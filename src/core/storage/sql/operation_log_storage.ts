import { ListLogsFilter, LogsPage, LogsStats, OperationLog, OperationLogLevel, OperationLogType } from '../../types/operation-log.js'
import { SqlDriver } from '../driver/types.js'
import { SqlKvStorage, TableSpec, parseJson } from '../sql_storage.js'
import { log } from '../logger.js'
import { OPERATION_LOGS } from './tables.js'

/** 日志落库脱敏：剥离多模态 Base64 大图数据，避免单条 payload 膨胀为几 MB 拖垮数据库与内存 */
function sanitizeLogValue(data: any, depth = 0): any {
  if (depth > 6 || data == null) return data
  if (typeof data === 'string') {
    if (data.length > 500 && /^[A-Za-z0-9+/=\r\n\s]+$/.test(data.slice(0, 100))) {
      return `[base64 data (${data.length} chars)]`
    }
    return data
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogValue(item, depth + 1))
  }
  if (typeof data === 'object') {
    if (data.type === 'image' && typeof data.image === 'string' && data.image.length > 200) {
      return {
        ...data,
        image: `[base64 image (${data.mimeType || 'unknown'}): ${data.image.length} chars]`,
      }
    }
    if (data.inlineData && typeof data.inlineData.data === 'string' && data.inlineData.data.length > 200) {
      return {
        ...data,
        inlineData: {
          ...data.inlineData,
          data: `[base64 inlineData (${data.inlineData.mimeType || 'unknown'}): ${data.inlineData.data.length} chars]`,
        },
      }
    }
    const result: Record<string, any> = {}
    for (const [k, v] of Object.entries(data)) {
      result[k] = sanitizeLogValue(v, depth + 1)
    }
    return result
  }
  return data
}

/** 能下推到 SQL 的列。其余字段都在 payload 里，只能读出来再过滤。 */
const FILTERABLE = ['id', 'timestamp', 'type', 'level', 'userId', 'groupId', 'channelId', 'model', 'presetId']

const spec: TableSpec<OperationLog> = {
  table: OPERATION_LOGS.table,
  columns: OPERATION_LOGS.columns,
  indexes: [
    { columns: [{ column: 'timestamp', order: 'DESC' }], name: 'idx_operation_logs_time' },
    { columns: ['userId', { column: 'timestamp', order: 'DESC' }], name: 'idx_operation_logs_user' },
    { columns: ['groupId', { column: 'timestamp', order: 'DESC' }], name: 'idx_operation_logs_group' },
    { columns: ['channelId', { column: 'timestamp', order: 'DESC' }], name: 'idx_operation_logs_channel' },
    { columns: ['type', { column: 'timestamp', order: 'DESC' }], name: 'idx_operation_logs_type' },
    {
      columns: [{ column: 'timestamp', order: 'ASC' }, { column: 'id', order: 'ASC' }],
      name: 'idx_operation_logs_retention',
    },
  ],
  filterable: FILTERABLE,
  numeric: ['timestamp'],
  orderBy: 'timestamp DESC',
  toRecord(value, id) {
    let payload = JSON.stringify(value)
    // 兜底保护：单条日志 payload 若超过 128 KB，进行脱敏截断处理
    if (payload.length > 131072) {
      try {
        const safe = sanitizeLogValue(value)
        payload = JSON.stringify(safe)
        if (payload.length > 131072) {
          payload = JSON.stringify({
            id,
            timestamp: value.timestamp,
            type: value.type,
            level: value.level,
            summary: value.summary,
            detail: (value.detail || '').slice(0, 1000),
            metadata: { truncated: true, originalBytes: payload.length },
          })
        }
      } catch {
        payload = JSON.stringify({ id, timestamp: value.timestamp, type: value.type, level: value.level, summary: value.summary })
      }
    }
    return {
      id,
      timestamp: value.timestamp,
      type: value.type,
      level: value.level,
      userId: value.userId ?? null,
      groupId: value.groupId ?? null,
      channelId: value.channelId ?? null,
      model: value.model ?? null,
      presetId: value.presetId ?? null,
      payload,
    }
  },
  fromRecord(record) {
    if (!record) return null
    return parseJson<OperationLog | null>(record.payload as string, null)
  },
}

/**
 * 操作日志。
 *
 * 和其他 storage 的区别是它有保留期：写入频率高、条数按万计，所以要按 maxEntries
 * 滚动裁剪。裁剪分批进行并走低优先级队列，免得在低配机器上把实时对话的写入挤掉。
 */
export class SqlOperationLogStorage extends SqlKvStorage<OperationLog> {
  private writeCount = 0
  private maxEntries: number
  private prunePromise: Promise<void> | null = null
  private readonly pruneBatchSize = 500

  constructor(driver: SqlDriver, maxEntries = 50000) {
    super(driver, spec)
    this.maxEntries = normalizeLimit(maxEntries)
  }

  getName(): string {
    return 'SqlOperationLogStorage'
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    await super.initialize()
    void this.schedulePrune()
  }

  async setItem(id: string, value: OperationLog): Promise<string> {
    const key = await super.setItem(id, value)
    this.writeCount++
    // 低配机器上别每写一条就查一次总数：按比例间隔触发，上限 200
    const pruneEvery = Math.min(200, Math.max(1, Math.floor(this.maxEntries / 10)))
    if (this.maxEntries > 0 && this.writeCount % pruneEvery === 0) {
      void this.schedulePrune()
    }
    return key
  }

  /** clear 也走分批，避免一次性删掉几十万行把写锁占满。 */
  async clear(): Promise<void> {
    await this.ensureInitialized()
    for (;;) {
      const result = await this.driver.run(
        `DELETE FROM ${this.q(this.table)} WHERE ${this.q('id')} IN (
           SELECT ${this.q('id')} FROM ${this.q(this.table)}
           ORDER BY ${this.q('timestamp')} ASC, ${this.q('id')} ASC LIMIT ?
         )`,
        [this.pruneBatchSize],
        { priority: 'low', label: 'clear operation logs batch' },
      )
      if (result.changes < this.pruneBatchSize) return
      await new Promise(resolve => setImmediate(resolve))
    }
  }

  async setMaxEntries(maxEntries: number): Promise<void> {
    this.maxEntries = normalizeLimit(maxEntries)
    await (this.schedulePrune(true) || Promise.resolve())
  }

  /** 分页查询（下推 SQL，极大降低高并发与大数据量下的内存压力） */
  async listPaged(filter: ListLogsFilter = {}): Promise<LogsPage> {
    await this.ensureInitialized()
    const {
      page = 1,
      pageSize = 50,
      type,
      level,
      userId,
      groupId,
      channelId,
      model,
      presetId,
      toolName,
      processorName,
      triggerName,
      from,
      to,
      keyword,
    } = filter

    const clauses: string[] = []
    const params: unknown[] = []

    if (type) {
      clauses.push(`${this.q('type')} = ?`)
      params.push(type)
    }
    if (level) {
      clauses.push(`${this.q('level')} = ?`)
      params.push(level)
    }
    if (userId) {
      clauses.push(`${this.q('userId')} = ?`)
      params.push(userId)
    }
    if (groupId) {
      clauses.push(`${this.q('groupId')} = ?`)
      params.push(groupId)
    }
    if (channelId) {
      clauses.push(`${this.q('channelId')} = ?`)
      params.push(channelId)
    }
    if (model) {
      clauses.push(`${this.q('model')} = ?`)
      params.push(model)
    }
    if (presetId) {
      clauses.push(`${this.q('presetId')} = ?`)
      params.push(presetId)
    }
    if (from != null && Number.isFinite(from)) {
      clauses.push(`${this.q('timestamp')} >= ?`)
      params.push(Number(from))
    }
    if (to != null && Number.isFinite(to)) {
      clauses.push(`${this.q('timestamp')} <= ?`)
      params.push(Number(to))
    }
    if (toolName) {
      clauses.push(`${this.q('payload')} LIKE ?`)
      params.push(`%"toolName":%${toolName}%`)
    }
    if (processorName) {
      clauses.push(`${this.q('payload')} LIKE ?`)
      params.push(`%"processorName":%${processorName}%`)
    }
    if (triggerName) {
      clauses.push(`${this.q('payload')} LIKE ?`)
      params.push(`%"triggerName":%${triggerName}%`)
    }
    if (keyword) {
      clauses.push(`${this.q('payload')} LIKE ?`)
      params.push(`%${keyword}%`)
    }

    const where = clauses.length > 0 ? ` WHERE ${clauses.join(' AND ')}` : ''

    // 1. 获取符合条件的总条数（仅查询计数，不取数据）
    const countRow = await this.driver.get<{ count: number }>(
      `SELECT COUNT(*) AS "count" FROM ${this.q(this.table)}${where}`,
      params,
    )
    const total = Number(countRow?.count || 0)

    const curPage = Math.max(1, Number(page) || 1)
    const limit = Math.min(200, Math.max(1, Number(pageSize) || 50))
    const offset = (curPage - 1) * limit

    if (total === 0 || offset >= total) {
      return { items: [], total, page: curPage, pageSize: limit }
    }

    // 2. 仅查询当前页的完整记录（ORDER BY timestamp DESC LIMIT ? OFFSET ?）
    const rows = await this.driver.all<Record<string, unknown>>(
      `SELECT * FROM ${this.q(this.table)}${where} ORDER BY ${this.q('timestamp')} DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    )

    const items = rows
      .map(row => this.spec.fromRecord(row))
      .filter((item): item is OperationLog => item !== null)

    return { items, total, page: curPage, pageSize: limit }
  }

  /** 聚合统计（下推 SQL 聚合，秒级返回且内存开销极低） */
  async getStats(): Promise<LogsStats> {
    await this.ensureInitialized()
    const now = Date.now()
    const h24ago = now - 24 * 60 * 60 * 1000

    const [totalRow, last24hRow, typeRows, levelRows, modelRows, presetRows, channelRows] = await Promise.all([
      this.driver.get<{ count: number }>(`SELECT COUNT(*) AS "count" FROM ${this.q(this.table)}`),
      this.driver.get<{ count: number }>(`SELECT COUNT(*) AS "count" FROM ${this.q(this.table)} WHERE ${this.q('timestamp')} >= ?`, [h24ago]),
      this.driver.all<{ type: string; count: number }>(`SELECT ${this.q('type')}, COUNT(*) AS "count" FROM ${this.q(this.table)} GROUP BY ${this.q('type')}`),
      this.driver.all<{ level: string; count: number }>(`SELECT ${this.q('level')}, COUNT(*) AS "count" FROM ${this.q(this.table)} GROUP BY ${this.q('level')}`),
      this.driver.all<{ model: string; count: number }>(`SELECT ${this.q('model')}, COUNT(*) AS "count" FROM ${this.q(this.table)} WHERE ${this.q('model')} IS NOT NULL AND ${this.q('model')} != '' GROUP BY ${this.q('model')}`),
      this.driver.all<{ presetId: string; count: number }>(`SELECT ${this.q('presetId')}, COUNT(*) AS "count" FROM ${this.q(this.table)} WHERE ${this.q('presetId')} IS NOT NULL AND ${this.q('presetId')} != '' GROUP BY ${this.q('presetId')}`),
      this.driver.all<{ channelId: string; count: number }>(`SELECT ${this.q('channelId')}, COUNT(*) AS "count" FROM ${this.q(this.table)} WHERE ${this.q('channelId')} IS NOT NULL AND ${this.q('channelId')} != '' GROUP BY ${this.q('channelId')}`),
    ])

    const total = Number(totalRow?.count || 0)
    const last24h = Number(last24hRow?.count || 0)

    const byType: Partial<Record<OperationLogType, number>> = {}
    for (const r of typeRows) if (r.type) byType[r.type as OperationLogType] = Number(r.count)

    const byLevel: Record<OperationLogLevel, number> = { info: 0, warn: 0, error: 0 }
    let errorCount = 0
    for (const r of levelRows) {
      if (r.level === 'info' || r.level === 'warn' || r.level === 'error') byLevel[r.level] = Number(r.count)
      if (r.level === 'error') errorCount = Number(r.count)
    }

    const byModel: Record<string, number> = {}
    for (const r of modelRows) if (r.model) byModel[r.model] = Number(r.count)

    const byPreset: Record<string, number> = {}
    for (const r of presetRows) if (r.presetId) byPreset[r.presetId] = Number(r.count)

    const byChannel: Record<string, number> = {}
    for (const r of channelRows) if (r.channelId) byChannel[r.channelId] = Number(r.count)

    // 统计 Tokens 与 LLM 平均时长（只读取最近最多 500 条 llm.call，平衡准确度与性能）
    const llmRows = await this.driver.all<Record<string, unknown>>(
      `SELECT * FROM ${this.q(this.table)} WHERE ${this.q('type')} = 'llm.call' ORDER BY ${this.q('timestamp')} DESC LIMIT 500`,
    )
    let llmDurationSum = 0, llmDurationCount = 0, totalTokens = 0, inputTokens = 0, outputTokens = 0, cachedTokens = 0, reasoningTokens = 0
    for (const r of llmRows) {
      const logObj = this.spec.fromRecord(r)
      if (!logObj) continue
      if (logObj.durationMs != null) { llmDurationSum += logObj.durationMs; llmDurationCount++; }
      inputTokens += logObj.inputTokens ?? 0; outputTokens += logObj.outputTokens ?? 0;
      cachedTokens += logObj.cachedTokens ?? 0; reasoningTokens += logObj.reasoningTokens ?? 0;
      totalTokens += logObj.totalTokens ?? ((logObj.inputTokens ?? 0) + (logObj.outputTokens ?? 0))
    }

    return {
      total, byType, byLevel, last24h,
      avgLlmDurationMs: llmDurationCount > 0 ? Math.round(llmDurationSum / llmDurationCount) : 0,
      totalTokens, inputTokens, outputTokens, cachedTokens, reasoningTokens,
      errorRate: total > 0 ? errorCount / total : 0,
      byChannel, byModel, byPreset,
    }
  }

  private schedulePrune(force = false): Promise<void> | null {
    if (this.prunePromise) {
      // force 时要等当前这轮跑完再按新的 maxEntries 重来一次
      return force ? this.prunePromise.then(() => this.schedulePrune(true) ?? undefined) : this.prunePromise
    }
    if (this.maxEntries <= 0) return null
    const targetEntries = this.maxEntries
    this.prunePromise = this.prune(targetEntries, force)
      .catch((error: unknown) =>
        log().warn(
          `[operation_logs] prune failed: ${error instanceof Error ? error.message : String(error)}`,
        ),
      )
      .finally(() => {
        this.prunePromise = null
      })
    return this.prunePromise
  }

  private async prune(targetEntries: number, force = false): Promise<void> {
    if (targetEntries <= 0) return
    await this.ensureInitialized()
    // 留 10% 余量，避免刚好卡在阈值时每写一条都要删一条
    const highWatermark = Math.max(targetEntries + 1, Math.ceil(targetEntries * 1.1))
    const row = await this.driver.get<{ count: number }>(
      `SELECT COUNT(*) AS "count" FROM ${this.q(this.table)}`,
      [],
    )
    let remaining = Number(row?.count || 0)
    if (!force && remaining <= highWatermark) return

    while (remaining > targetEntries && this.maxEntries > 0) {
      const batchSize = Math.min(this.pruneBatchSize, remaining - targetEntries)
      const startedAt = Date.now()
      const result = await this.driver.run(
        `DELETE FROM ${this.q(this.table)} WHERE ${this.q('id')} IN (
           SELECT ${this.q('id')} FROM ${this.q(this.table)}
           ORDER BY ${this.q('timestamp')} ASC, ${this.q('id')} ASC LIMIT ?
         )`,
        [batchSize],
        { priority: 'low', label: 'operation log retention batch' },
      )
      remaining -= result.changes
      log().debug(
        `[operation_logs] pruned ${result.changes} rows in ${Date.now() - startedAt}ms, remaining=${remaining}`,
      )
      if (result.changes === 0) break
      await new Promise(resolve => setImmediate(resolve))
    }
  }
}

function normalizeLimit(value: number): number {
  const limit = Number.parseInt(String(value), 10)
  return Number.isFinite(limit) && limit > 0 ? limit : 0
}

export { spec as operationLogSpec }
