import { createDialect } from './dialect.js';
import { toDollarPlaceholders } from './placeholders.js';
import { log } from '../logger.js';
/**
 * Postgres driver。
 *
 * 和 SQLite 那边最大的不同：这里不需要写者队列。SQLite 全库只有一个写锁，所以
 * 必须自己把写入串起来；Postgres 有 MVCC 和真正的连接池，串行化反而会白白限制
 * 吞吐，并发控制整个交给 pg.Pool。
 *
 * SQL 仍按 `?` 书写，在执行入口统一翻译成 $1..$n，storage 层不用关心方言。
 */
export class PostgresDriver {
    constructor(options, pool) {
        this.dialect = createDialect('postgres');
        this.closed = false;
        this.options = options;
        this.pool = pool;
        this.slowQueryMs = options.slowQueryMs ?? 500;
    }
    get name() {
        return `postgres:${this.options.database}`;
    }
    async ready() {
        const client = await this.pool.connect();
        client.release();
    }
    async query(sql, params) {
        const startedAt = Date.now();
        try {
            return await this.pool.query(toDollarPlaceholders(sql), params);
        }
        finally {
            const duration = Date.now() - startedAt;
            if (duration >= this.slowQueryMs) {
                log().warn(`[pg] slow query ${duration}ms: ${sql.trim().slice(0, 120)}`);
            }
        }
    }
    async get(sql, params = []) {
        const result = await this.query(sql, params);
        return result.rows[0];
    }
    async all(sql, params = []) {
        const result = await this.query(sql, params);
        return result.rows;
    }
    /**
     * lastID 只在显式写了 RETURNING id 时才有值。SQLite 的 this.lastID 在
     * Postgres 没有对应物，调用方不该依赖它。
     */
    async run(sql, params = []) {
        const result = await this.query(sql, params);
        return {
            changes: result.rowCount ?? 0,
            lastID: result.rows?.[0]?.id,
        };
    }
    /** exec 用来跑建表之类的多语句脚本，本身不带参数，所以不翻译占位符。 */
    async exec(sql) {
        await this.pool.query(sql);
    }
    async transaction(work) {
        const client = await this.pool.connect();
        const run = async (sql, params = []) => {
            const result = await client.query(toDollarPlaceholders(sql), params);
            return { changes: result.rowCount ?? 0, lastID: result.rows?.[0]?.id };
        };
        const get = async (sql, params = []) => (await client.query(toDollarPlaceholders(sql), params)).rows[0];
        const all = async (sql, params = []) => (await client.query(toDollarPlaceholders(sql), params)).rows;
        try {
            await client.query('BEGIN');
            const result = await work({ get, all, run });
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            try {
                await client.query('ROLLBACK');
            }
            catch (rollbackError) {
                log().warn(`[pg] rollback failed: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
            }
            throw error;
        }
        finally {
            client.release();
        }
    }
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        await this.pool.end();
    }
}
/** pg 是可选依赖，只有真的选了 postgres 才需要装。 */
export async function createPostgresDriver(options) {
    let pg;
    try {
        // @ts-ignore 可选依赖，未安装时在 catch 中提示
        pg = (await import('pg')).default;
    }
    catch (error) {
        throw new Error('使用 postgres 存储需要先安装 pg：pnpm add pg\n' +
            `原始错误：${error instanceof Error ? error.message : String(error)}`);
    }
    const pool = new pg.Pool({
        host: options.host || '127.0.0.1',
        port: options.port || 5432,
        database: options.database,
        user: options.username,
        password: options.password,
        max: options.pool?.max ?? 10,
        idleTimeoutMillis: options.pool?.idle ?? 10000,
        connectionTimeoutMillis: options.pool?.acquire ?? 30000,
        ssl: options.ssl ?? false,
    });
    pool.on('error', error => log().error(`[pg] idle client error: ${error.message}`));
    const driver = new PostgresDriver(options, pool);
    try {
        await driver.ready();
    }
    catch (error) {
        // 首次连接失败时必须把 pool 关掉，否则它的重连计时器会把进程吊住，
        // 连接也泄漏了
        await pool.end().catch(() => { });
        throw error;
    }
    return driver;
}
