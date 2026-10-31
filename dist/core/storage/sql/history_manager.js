import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { AbstractHistoryManager } from '../../types/adapter.js';
import { isBase64Image } from './base64_image.js';
import { log } from '../logger.js';
import { HISTORY } from './tables.js';
const MIME_EXTENSIONS = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
};
const IMAGE_REF = /^\$image:([a-f0-9]+):(\.[a-z]+)$/;
/**
 * 消息链回溯的深度上限。
 *
 * 正常会话远达不到这个数；设上限是为了让一条成环的 parentId 不至于把递归查询
 * 拖死。超过上限会告警并截断。
 */
const MAX_CHAIN_DEPTH = 10000;
/**
 * 前缀的下一个字符串，用于把「以 prefix 开头」表达成范围比较。
 *
 * 用范围而不是 LIKE 'prefix%'：LIKE 能不能走索引取决于 case_sensitive_like
 * 之类的设置，范围比较则一定能用上 conversationId 索引。
 */
function nextPrefix(prefix) {
    const last = prefix.charCodeAt(prefix.length - 1);
    return prefix.slice(0, -1) + String.fromCharCode(last + 1);
}
/**
 * 基于 SQL 的对话历史。
 *
 * 和其他 storage 不同，它实现的是 AbstractHistoryManager 而不是 ChaiteStorage，
 * 而且还要把消息里的 base64 图片落盘换成引用——历史库是最大的一张表，把几 MB 的
 * 图片塞进行里会让它迅速膨胀到几百 MB。
 */
export class SqlHistoryManager extends AbstractHistoryManager {
    constructor(driver, imagesDir) {
        super();
        this.name = 'SqlHistoryManager';
        this.table = 'history';
        this.initialized = false;
        this.initPromise = null;
        this.driver = driver;
        this.imagesDir = imagesDir;
    }
    q(name) {
        return this.driver.dialect.quoteId(name);
    }
    async initialize() {
        if (this.initialized)
            return;
        if (this.initPromise)
            return this.initPromise;
        this.initPromise = (async () => {
            const dialect = this.driver.dialect;
            fs.mkdirSync(this.imagesDir, { recursive: true });
            await this.driver.exec(dialect.createTable(this.table, HISTORY.columns));
            await this.driver.exec(dialect.createIndex(this.table, ['conversationId'], { name: 'idx_history_conversation' }));
            await this.driver.exec(dialect.createIndex(this.table, ['parentId'], { name: 'idx_history_parent' }));
            this.initialized = true;
            this.createdAtIndexReady = this.driver
                .exec(dialect.createIndex(this.table, ['createdAt'], { name: 'idx_history_created' }), {
                priority: 'low',
                label: 'create createdAt index',
            })
                .catch((error) => {
                log().warn(`[History] failed to create createdAt index: ${error instanceof Error ? error.message : String(error)}`);
            });
        })().catch((error) => {
            this.initPromise = null;
            throw error;
        });
        return this.initPromise;
    }
    async ensureInitialized() {
        if (!this.initialized)
            await this.initialize();
    }
    getMd5(text) {
        return crypto.createHash('md5').update(text).digest('hex');
    }
    getMimeTypeFromBase64(base64, defaultMimeType = 'image/jpeg') {
        if (base64 && base64.startsWith('data:image/')) {
            const match = base64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
            if (match)
                return match[1];
        }
        // 纯 base64 字符串没有类型信息，用调用方给的默认值
        return defaultMimeType;
    }
    getExtensionFromMimeType(mimeType) {
        return MIME_EXTENSIONS[mimeType] || '.png';
    }
    /** 把消息里的 base64 图片落盘，行里只留 `$image:md5:ext` 引用。 */
    processMessageImages(message) {
        if (!message.content || !Array.isArray(message.content))
            return message;
        const processed = JSON.parse(JSON.stringify(message));
        processed.content = processed.content.map((item) => {
            if (item.type !== 'image' || !item.image || !isBase64Image(item.image))
                return item;
            let base64Data = item.image;
            let mimeType = item.mimeType || 'image/jpeg';
            if (base64Data.startsWith('data:')) {
                const parts = base64Data.split(',');
                if (parts.length > 1) {
                    base64Data = parts[1];
                    mimeType = this.getMimeTypeFromBase64(item.image, mimeType);
                }
            }
            try {
                const md5 = this.getMd5(base64Data);
                const ext = this.getExtensionFromMimeType(mimeType);
                const filePath = path.join(this.imagesDir, `${md5}${ext}`);
                // 同一张图只落一次盘
                if (!fs.existsSync(filePath)) {
                    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
                }
                item.image = `$image:${md5}:${ext}`;
                item._type = mimeType;
            }
            catch (error) {
                log().warn(`[History] 保存图片失败: ${error instanceof Error ? error.message : String(error)}`);
            }
            return item;
        });
        return processed;
    }
    /** 把 `$image:md5:ext` 引用读回 base64；文件没了就把这一项去掉并补上 [图片]。 */
    restoreMessageImages(message) {
        if (!message || !message.content || !Array.isArray(message.content))
            return message;
        const restored = JSON.parse(JSON.stringify(message));
        let needImageText = true;
        let hasRemovedImage = false;
        restored.content = restored.content.filter((item) => {
            if (item.type === 'image' && typeof item.image === 'string') {
                const match = item.image.match(IMAGE_REF);
                if (match) {
                    const filePath = path.join(this.imagesDir, `${match[1]}${match[2]}`);
                    if (!fs.existsSync(filePath)) {
                        hasRemovedImage = true;
                        return false;
                    }
                    try {
                        item.image = fs.readFileSync(filePath).toString('base64');
                        return true;
                    }
                    catch (error) {
                        log().warn(`[History] 读取图片文件失败 ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
                        hasRemovedImage = true;
                        return false;
                    }
                }
            }
            if (item.type === 'text')
                needImageText = false;
            return true;
        });
        if (hasRemovedImage) {
            if (restored.content.length === 0) {
                restored.content.push({ type: 'text', text: '[图片]' });
            }
            else if (needImageText) {
                const textIndex = restored.content.findIndex((item) => item.type === 'text');
                if (textIndex !== -1) {
                    restored.content[textIndex].text = `[图片] ${restored.content[textIndex].text}`;
                }
                else {
                    restored.content.unshift({ type: 'text', text: '[图片]' });
                }
            }
        }
        return restored;
    }
    messageToRecord(message, conversationId) {
        const processed = this.processMessageImages(message);
        const { id, parentId, role } = processed;
        return {
            id: id || '',
            parentId: parentId || null,
            conversationId: conversationId || '',
            role: role || '',
            messageData: JSON.stringify(processed),
            createdAt: new Date().toISOString(),
        };
    }
    recordToMessage(record) {
        if (!record)
            return null;
        try {
            return this.restoreMessageImages(JSON.parse(String(record.messageData)));
        }
        catch {
            // 解析失败就尽量给个最小结构，别让整个会话读不出来
            return {
                id: record.id,
                parentId: record.parentId,
                role: record.role,
                conversationId: record.conversationId,
                content: [],
            };
        }
    }
    upsertSql() {
        const fields = ['id', 'parentId', 'conversationId', 'role', 'messageData', 'createdAt'];
        return this.driver.dialect.upsert(this.table, fields, 'id');
    }
    recordValues(record) {
        return [record.id, record.parentId, record.conversationId, record.role, record.messageData, record.createdAt];
    }
    async saveHistory(message, conversationId) {
        await this.ensureInitialized();
        const record = this.messageToRecord(message, conversationId);
        await this.driver.run(this.upsertSql(), this.recordValues(record), {
            priority: 'high',
            label: 'save history message',
        });
    }
    /** 批量保存走一个事务，避免多条消息逐条 autocommit。 */
    async saveHistories(messages, conversationId) {
        await this.ensureInitialized();
        if (!messages || messages.length === 0)
            return;
        const records = messages.map(message => this.messageToRecord(message, conversationId));
        const sql = this.upsertSql();
        await this.driver.transaction(async (transaction) => {
            for (const record of records) {
                await transaction.run(sql, this.recordValues(record));
            }
        }, { priority: 'high', label: `save ${records.length} history messages` });
    }
    async getHistory(messageId, conversationId) {
        await this.ensureInitialized();
        if (messageId)
            return this.getMessageChain(messageId);
        if (conversationId)
            return this.getConversationMessages(conversationId);
        return [];
    }
    /**
     * 从指定消息沿 parentId 追溯到根。
     *
     * 用递归 CTE 一次查完，而不是每条消息发一次查询。原来那种逐条回溯是典型的
     * N+1：链有多长就要多少次往返。本机 SQLite 上一次往返约 0.022ms，一条 3000
     * 条的链就要 65ms；换成走网络的 Postgres，按单次往返 0.3ms 算会变成近 1 秒。
     * 而且这是每条消息进对话时都要做一次的事。
     *
     * 递归 CTE 两种方言都支持（SQLite 3.8.3+、Postgres 一直有）。
     *
     * depth 上限同时兼作防环措施：parentId 理论上不该成环，但一条坏数据就足以
     * 让递归停不下来。
     */
    async getMessageChain(messageId) {
        const table = this.q(this.table);
        const id = this.q('id');
        const parentId = this.q('parentId');
        const rows = await this.driver.all(`WITH RECURSIVE ${this.q('chain')} AS (
         SELECT ${table}.*, 0 AS ${this.q('depth')} FROM ${table} WHERE ${id} = ?
         UNION ALL
         SELECT ${table}.*, ${this.q('chain')}.${this.q('depth')} + 1
         FROM ${table}
         JOIN ${this.q('chain')} ON ${table}.${id} = ${this.q('chain')}.${parentId}
         WHERE ${this.q('chain')}.${this.q('depth')} < ?
       )
       SELECT * FROM ${this.q('chain')} ORDER BY ${this.q('depth')} ASC`, [messageId, MAX_CHAIN_DEPTH]);
        // 按 depth 升序拿回来（目标消息 -> 父 -> 祖父 …），遇到重复 id 就停：
        // 这和改造前逐条回溯 + visited 集合的语义完全一致。深度上限只保证成环时
        // 递归一定会停，真正判环还是靠这里。
        const chain = [];
        const seen = new Set();
        for (const row of rows) {
            const id = String(row.id);
            if (seen.has(id)) {
                log().warn(`[History] detected a parentId cycle at ${id}, truncating the chain`);
                break;
            }
            seen.add(id);
            const message = this.recordToMessage(row);
            if (message)
                chain.push(message);
        }
        if (rows.length >= MAX_CHAIN_DEPTH) {
            log().warn(`[History] chain from ${messageId} hit the depth cap (${MAX_CHAIN_DEPTH}) and was truncated`);
        }
        // 调用方要的是从根到目标的顺序
        return chain.reverse();
    }
    async getConversationMessages(conversationId) {
        const rows = await this.driver.all(`SELECT * FROM ${this.q(this.table)} WHERE ${this.q('conversationId')} = ? ORDER BY ${this.q('createdAt')}`, [conversationId]);
        return rows.map(row => this.recordToMessage(row)).filter((m) => Boolean(m));
    }
    async deleteConversation(conversationId) {
        await this.ensureInitialized();
        await this.driver.run(`DELETE FROM ${this.q(this.table)} WHERE ${this.q('conversationId')} = ?`, [conversationId]);
    }
    /** 删一条消息但不断链：先把它的直接子节点改挂到它的父节点上。 */
    async removeHistory(messageId, conversationId) {
        await this.ensureInitialized();
        await this.driver.transaction(async (transaction) => {
            const row = await transaction.get(`SELECT ${this.q('parentId')} FROM ${this.q(this.table)}
           WHERE ${this.q('id')} = ? AND ${this.q('conversationId')} = ?`, [messageId, conversationId]);
            if (!row)
                return;
            await transaction.run(`UPDATE ${this.q(this.table)} SET ${this.q('parentId')} = ?
           WHERE ${this.q('conversationId')} = ? AND ${this.q('parentId')} = ?`, [row.parentId || null, conversationId, messageId]);
            await transaction.run(`DELETE FROM ${this.q(this.table)} WHERE ${this.q('id')} = ? AND ${this.q('conversationId')} = ?`, [messageId, conversationId]);
        }, { priority: 'high', label: 'remove history message' });
    }
    async getOneHistory(messageId, conversationId) {
        await this.ensureInitialized();
        const conditions = [];
        const params = [];
        if (messageId) {
            conditions.push(`${this.q('id')} = ?`);
            params.push(messageId);
        }
        if (conversationId) {
            conditions.push(`${this.q('conversationId')} = ?`);
            params.push(conversationId);
        }
        if (conditions.length === 0)
            return undefined;
        const row = await this.driver.get(`SELECT * FROM ${this.q(this.table)} WHERE ${conditions.join(' AND ')} LIMIT 1`, params);
        return this.recordToMessage(row) ?? undefined;
    }
    buildPruneFilter(before, conversationPrefix) {
        const conditions = [`${this.q('createdAt')} < ?`];
        const params = [before];
        if (conversationPrefix) {
            conditions.push(`${this.q('conversationId')} >= ?`, `${this.q('conversationId')} < ?`);
            params.push(conversationPrefix, nextPrefix(conversationPrefix));
        }
        return { where: conditions.join(' AND '), params };
    }
    async countHistoryBefore({ before, conversationPrefix = '' }) {
        await this.ensureInitialized();
        if (!before)
            return 0;
        const { where, params } = this.buildPruneFilter(before, conversationPrefix);
        const row = await this.driver.get(`SELECT COUNT(*) AS "count" FROM ${this.q(this.table)} WHERE ${where}`, params);
        return Number(row?.count || 0);
    }
    /**
     * 按保留期删除历史消息。
     *
     * 分批删而不是一条 DELETE 干掉几十万行：单条大 DELETE 会长时间占住写连接，
     * 期间所有对话的写入都要排队。批次走 low 优先级，让实时对话的写入插在前面。
     */
    async pruneHistory({ before, conversationPrefix = '', batchSize = 2000, maxBatches = 500, }) {
        await this.ensureInitialized();
        if (!before)
            return { deleted: 0, truncated: false };
        const { where, params } = this.buildPruneFilter(before, conversationPrefix);
        const sql = `DELETE FROM ${this.q(this.table)} WHERE ${this.q('id')} IN (
      SELECT ${this.q('id')} FROM ${this.q(this.table)} WHERE ${where} LIMIT ?
    )`;
        let deleted = 0;
        for (let batch = 0; batch < maxBatches; batch++) {
            const result = await this.driver.run(sql, [...params, batchSize], {
                priority: 'low',
                label: 'prune history',
            });
            const changes = result?.changes || 0;
            deleted += changes;
            if (changes < batchSize)
                return { deleted, truncated: false };
        }
        // 还没删完，剩下的留给下一次，避免一次任务跑太久
        return { deleted, truncated: true };
    }
    /** 删掉已经没有任何消息引用的图片文件。 */
    async cleanupUnusedImages() {
        await this.ensureInitialized();
        const rows = await this.driver.all(`SELECT ${this.q('messageData')} FROM ${this.q(this.table)}`, []);
        const usedImageRefs = new Set();
        for (const row of rows) {
            try {
                const message = JSON.parse(row.messageData);
                if (!Array.isArray(message.content))
                    continue;
                for (const item of message.content) {
                    if (item.type === 'image' && typeof item.image === 'string') {
                        const match = item.image.match(IMAGE_REF);
                        if (match)
                            usedImageRefs.add(`${match[1]}${match[2]}`);
                    }
                }
            }
            catch {
                // 单条坏数据不该让整次清理失败
            }
        }
        const files = fs.readdirSync(this.imagesDir);
        let deleted = 0;
        for (const file of files) {
            if (!usedImageRefs.has(file)) {
                fs.unlinkSync(path.join(this.imagesDir, file));
                deleted++;
            }
        }
        return { deleted, total: files.length };
    }
    /** 连接归 DriverRegistry 管，这里不关。 */
    async close() { }
}
