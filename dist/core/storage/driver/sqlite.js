import path from 'node:path';
import fs from 'node:fs';
import { createDialect } from './dialect.js';
import { log } from '../logger.js';
async function openNativeDatabase(dbPath, busyTimeout) {
    let sqlite3;
    try {
        sqlite3 = (await import('sqlite3')).default;
    }
    catch (error) {
        throw new Error('SQLite 存储需要安装 sqlite3：pnpm add sqlite3\n' +
            `原始错误：${error instanceof Error ? error.message : String(error)}`);
    }
    return new Promise((resolve, reject) => {
        fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        const db = new sqlite3.Database(dbPath, (error) => {
            if (error)
                return reject(error);
            db.configure('busyTimeout', busyTimeout);
            db.exec(`
        PRAGMA journal_mode = WAL;
        PRAGMA synchronous = NORMAL;
        PRAGMA foreign_keys = ON;
        PRAGMA busy_timeout = ${busyTimeout};
        `, (pragmaError) => (pragmaError ? reject(pragmaError) : resolve(db)));
        });
    });
}
/**
 * SQLite driver。
 *
 * SQLite 全库只有一个写锁，并发写会直接撞上 SQLITE_BUSY，所以这里自己把写入
 * 串起来：一个专用的 writer 连接 + 三档优先级队列，读取走另一条连接绕开队列。
 * 这套东西 chatgpt-plugin 里已经跑了很久，karin 那份拷贝没有——收进 chaite
 * 就是为了让两边都拿到。
 *
 * **串行化只在单个实例内生效。** 同一个文件被构造出两个 SqliteDriver 时，两个
 * 队列互不知情，最终还是退回 WAL + busy_timeout 去扛。DriverRegistry 每个文件
 * 只建一个实例，走注册表就没问题；绕过注册表自己 new 的话，这一层保证就没了。
 */
export class SqliteDriver {
    constructor(dbPath, options = {}) {
        this.dialect = createDialect('sqlite');
        this.queues = { high: [], normal: [], low: [] };
        this.writerActive = false;
        this.busyCount = 0;
        /**
         * open -> closing -> closed。
         *
         * 只有一个布尔量不够：close() 先置位再等队列排空，中间这段时间里新的
         * run()/get() 如果不被拦下，就会排到一个即将被关掉的连接上，或者留下一个
         * 永远不会完成的 Promise。
         */
        this.state = 'open';
        this.closePromise = null;
        this.dbPath = path.resolve(dbPath);
        this.busyTimeout = options.busyTimeout ?? 5000;
        this.slowQueryMs = options.slowQueryMs ?? 500;
        this.writerReady = openNativeDatabase(this.dbPath, this.busyTimeout);
        this.readerReady = this.writerReady.then(() => openNativeDatabase(this.dbPath, this.busyTimeout));
        this.readyPromise = Promise.all([this.writerReady, this.readerReady]);
    }
    get name() {
        return `sqlite:${path.basename(this.dbPath)}`;
    }
    get queueDepth() {
        return this.queues.high.length + this.queues.normal.length + this.queues.low.length;
    }
    async ready() {
        await this.readyPromise;
    }
    /**
     * 关闭中/已关闭就别再收活了，早失败好过半路连接被抽走。
     *
     * 返回 Error 而不是直接抛：driver 的其他方法一律以 rejected promise 报错，
     * 这里同步抛会让调用方要写两种错误处理。
     */
    closedError(operation) {
        if (this.state === 'open')
            return null;
        return new Error(`[SQLite:${this.name}] driver is ${this.state}, refusing ${operation}`);
    }
    enqueue(task, options = {}) {
        const refused = this.closedError(options.label || 'write');
        if (refused)
            return Promise.reject(refused);
        const { priority = 'normal', label = 'write' } = options;
        const queuedAt = Date.now();
        return new Promise((resolve, reject) => {
            const item = { task, label, queuedAt, resolve, reject };
            const queue = this.queues[priority] ?? this.queues.normal;
            queue.push(item);
            void this.drain();
        });
    }
    async drain() {
        if (this.writerActive)
            return;
        const item = this.queues.high.shift() || this.queues.normal.shift() || this.queues.low.shift();
        if (!item)
            return;
        this.writerActive = true;
        const waitMs = Date.now() - item.queuedAt;
        if (waitMs >= this.slowQueryMs) {
            log().warn(`[SQLite:${this.name}] writer wait ${waitMs}ms (${item.label}), queue=${this.queueDepth}`);
        }
        const startedAt = Date.now();
        try {
            const db = await this.writerReady;
            item.resolve(await item.task(db));
        }
        catch (error) {
            if (error?.code === 'SQLITE_BUSY') {
                this.busyCount++;
                log().warn(`[SQLite:${this.name}] SQLITE_BUSY #${this.busyCount} (${item.label})`);
            }
            item.reject(error);
        }
        finally {
            const duration = Date.now() - startedAt;
            if (duration >= this.slowQueryMs) {
                log().warn(`[SQLite:${this.name}] slow write ${duration}ms (${item.label})`);
            }
            this.writerActive = false;
            queueMicrotask(() => void this.drain());
        }
    }
    /** 读取直接打在 reader 连接上，绕开写入队列。 */
    async read(method, sql, params) {
        const refused = this.closedError(method);
        if (refused)
            throw refused;
        const db = await this.readerReady;
        const startedAt = Date.now();
        try {
            return await new Promise((resolve, reject) => {
                const callback = (error, result) => (error ? reject(error) : resolve(result));
                if (method === 'get')
                    db.get(sql, params, callback);
                else
                    db.all(sql, params, callback);
            });
        }
        catch (error) {
            if (error?.code === 'SQLITE_BUSY') {
                this.busyCount++;
                log().warn(`[SQLite:${this.name}] SQLITE_BUSY #${this.busyCount} (${method})`);
            }
            throw error;
        }
        finally {
            const duration = Date.now() - startedAt;
            if (duration >= this.slowQueryMs) {
                log().warn(`[SQLite:${this.name}] slow ${method} ${duration}ms`);
            }
        }
    }
    get(sql, params = []) {
        return this.read('get', sql, params);
    }
    all(sql, params = []) {
        return this.read('all', sql, params);
    }
    run(sql, params = [], options = {}) {
        return this.enqueue(db => new Promise((resolve, reject) => {
            db.run(sql, params, function (error) {
                if (error)
                    reject(error);
                else
                    resolve({ lastID: this.lastID, changes: this.changes });
            });
        }), { ...options, label: options.label || sql.trim().split(/\s+/, 2).join(' ') });
    }
    exec(sql, options = {}) {
        return this.enqueue(db => new Promise((resolve, reject) => db.exec(sql, error => (error ? reject(error) : resolve()))), { label: 'exec', ...options });
    }
    transaction(work, options = {}) {
        return this.enqueue(async (db) => {
            const run = (sql, params = []) => new Promise((resolve, reject) => {
                db.run(sql, params, function (error) {
                    if (error)
                        reject(error);
                    else
                        resolve({ lastID: this.lastID, changes: this.changes });
                });
            });
            const get = (sql, params = []) => new Promise((resolve, reject) => db.get(sql, params, (error, row) => (error ? reject(error) : resolve(row))));
            const all = (sql, params = []) => new Promise((resolve, reject) => db.all(sql, params, (error, rows) => (error ? reject(error) : resolve(rows))));
            await run('BEGIN IMMEDIATE');
            try {
                const result = await work({ get, all, run });
                await run('COMMIT');
                return result;
            }
            catch (error) {
                try {
                    await run('ROLLBACK');
                }
                catch (rollbackError) {
                    log().warn(`[SQLite:${this.name}] rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
                }
                throw error;
            }
        }, { ...options, label: options.label || 'transaction' });
    }
    /** 库文件加上 WAL/SHM 的总大小。 */
    fileSize() {
        let total = 0;
        for (const suffix of ['', '-wal', '-shm']) {
            try {
                total += fs.statSync(this.dbPath + suffix).size;
            }
            catch {
                // 文件不存在就当 0
            }
        }
        return total;
    }
    /**
     * 回收删除后留下的空闲页。
     *
     * 只能用整库 VACUUM：即使把 auto_vacuum 设成 INCREMENTAL（而且必须设在
     * journal_mode=WAL 之前，否则会被静默忽略），PRAGMA incremental_vacuum 在
     * WAL 下也几乎回收不到东西。
     *
     * VACUUM 本身很快，但会重写整个数据库文件，期间独占写锁，并且临时需要约等于
     * 库大小的额外磁盘空间。
     */
    async vacuum({ minFreePages = 0 } = {}) {
        const before = this.fileSize();
        const row = await this.get('PRAGMA freelist_count', []);
        const freePages = row?.freelist_count || 0;
        if (freePages < minFreePages) {
            return { name: this.name, path: this.dbPath, skipped: 'free-pages', freePages, before, after: before, ms: 0 };
        }
        // VACUUM 要把整个库重写一遍，磁盘剩余空间不够就别开始
        try {
            const stat = fs.statfsSync(path.dirname(this.dbPath));
            const available = stat.bavail * stat.bsize;
            if (available < before * 2) {
                return {
                    name: this.name, path: this.dbPath, skipped: 'disk-space', freePages, before, after: before, ms: 0, available,
                };
            }
        }
        catch {
            // 拿不到磁盘信息就继续，VACUUM 失败会自己报错
        }
        const startedAt = Date.now();
        // 读取绕过队列直接打在 reader 上，所以 VACUUM 期间来一次查询就可能拿不到
        // 独占锁而 SQLITE_BUSY。重试几次即可，VACUUM 是幂等的。
        let attempt = 0;
        for (;;) {
            try {
                // low 优先级：排在实时对话的写入后面
                await this.exec('VACUUM', { priority: 'low', label: 'vacuum' });
                break;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                const busy = error?.code === 'SQLITE_BUSY' || /database is locked/i.test(message);
                if (!busy || ++attempt >= 3)
                    throw error;
                log().warn(`[SQLite:${this.name}] vacuum busy, retry ${attempt}/3`);
                await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
        }
        // checkpoint 只是顺手把 WAL 截短，失败不该把已经成功的 VACUUM 报成失败
        try {
            await this.exec('PRAGMA wal_checkpoint(TRUNCATE)', { priority: 'low', label: 'vacuum checkpoint' });
        }
        catch (error) {
            log().warn(`[SQLite:${this.name}] post-vacuum checkpoint failed: ${error instanceof Error ? error.message : String(error)}`);
        }
        const after = this.fileSize();
        const ms = Date.now() - startedAt;
        log().info(`[SQLite:${this.name}] vacuum reclaimed ${((before - after) / 1024 / 1024).toFixed(1)} MiB in ${ms}ms`);
        return { name: this.name, path: this.dbPath, freePages, before, after, ms };
    }
    /**
     * 关闭连接。重复调用会等同一个 Promise，而不是第二个调用方立刻拿到 resolve
     * 却其实还没关完。
     */
    async close() {
        if (this.closePromise)
            return this.closePromise;
        if (this.state === 'closed')
            return;
        this.state = 'closing';
        this.closePromise = (async () => {
            // 等队列排空，否则正在写的事务会被切断。此时 closedError 已经挡住新任务，
            // 所以这个循环一定会收敛。
            while (this.writerActive || this.queueDepth > 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            const writer = await this.writerReady;
            const reader = await this.readerReady;
            await new Promise((resolve, reject) => reader.close(error => (error ? reject(error) : resolve())));
            await new Promise((resolve, reject) => writer.run('PRAGMA wal_checkpoint(PASSIVE)', [], error => (error ? reject(error) : resolve())));
            await new Promise((resolve, reject) => writer.close(error => (error ? reject(error) : resolve())));
            this.state = 'closed';
        })();
        return this.closePromise;
    }
}
