import express from 'express';
import { Chaite, ChaiteResponse } from '../index.js';
const router = express.Router();
function notConfigured(res) {
    res.status(503).json(ChaiteResponse.fail(null, 'OperationLogManager is not configured. Call chaite.setOperationLogManager(mgr) to enable operation logs.'));
}
function handle(res, fn) {
    fn()
        .then(data => { if (!res.headersSent)
        res.status(200).json(ChaiteResponse.ok(data)); })
        .catch((e) => {
        if (!res.headersSent) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            Chaite.getInstance().getLogger().error(e);
            res.status(500).json(ChaiteResponse.fail(null, msg));
        }
    });
}
/**
 * GET /api/logs
 * Query params: type, level, userId, from (ms), to (ms), keyword, page, pageSize
 */
router.get('/', (req, res) => {
    const mgr = Chaite.getInstance().getOperationLogManager();
    if (!mgr)
        return notConfigured(res);
    handle(res, async () => {
        const filter = {
            type: req.query['type'],
            level: req.query['level'],
            userId: req.query['userId'],
            groupId: req.query['groupId'],
            channelId: req.query['channelId'],
            model: req.query['model'],
            presetId: req.query['presetId'],
            toolName: req.query['toolName'],
            processorName: req.query['processorName'],
            triggerName: req.query['triggerName'],
            keyword: req.query['keyword'],
            from: req.query['from'] ? Number(req.query['from']) : undefined,
            to: req.query['to'] ? Number(req.query['to']) : undefined,
            page: req.query['page'] ? Math.max(1, Number(req.query['page'])) : 1,
            pageSize: req.query['pageSize'] ? Math.min(200, Math.max(1, Number(req.query['pageSize']))) : 50,
        };
        return mgr.list(filter);
    });
});
/**
 * GET /api/logs/stats
 * Returns aggregate statistics for all logs.
 */
router.get('/stats', (req, res) => {
    const mgr = Chaite.getInstance().getOperationLogManager();
    if (!mgr)
        return notConfigured(res);
    handle(res, () => mgr.getStats());
});
/**
 * GET /api/logs/:id
 * Returns a single log entry with full details and metadata
 */
router.get('/:id', (req, res) => {
    const mgr = Chaite.getInstance().getOperationLogManager();
    if (!mgr)
        return notConfigured(res);
    handle(res, async () => {
        const id = String(req.params['id']);
        if (!id)
            throw new Error('Missing log ID');
        const item = await mgr.get(id);
        if (!item)
            throw new Error('Log not found');
        if (!item.channelName) {
            try {
                const channelMgr = Chaite.getInstance().getChannelsManager();
                if (channelMgr) {
                    if (item.channelId) {
                        const chan = await channelMgr.getInstance(item.channelId).catch(() => null);
                        if (chan)
                            item.channelName = chan.name;
                    }
                    else if (item.model) {
                        const chans = await channelMgr.getChannelByModel(item.model).catch(() => []);
                        const matched = chans?.find(c => c.status === 'enabled') || chans?.[0];
                        if (matched) {
                            item.channelId = matched.id;
                            item.channelName = matched.name;
                        }
                    }
                }
            }
            catch { }
        }
        return item;
    });
});
/**
 * DELETE /api/logs
 * Clear logs. Optionally filtered by: type, level, userId, from (ms), to (ms).
 */
router.delete('/', (req, res) => {
    const mgr = Chaite.getInstance().getOperationLogManager();
    if (!mgr)
        return notConfigured(res);
    handle(res, async () => {
        const filter = {
            type: req.query['type'],
            level: req.query['level'],
            userId: req.query['userId'],
            from: req.query['from'] ? Number(req.query['from']) : undefined,
            to: req.query['to'] ? Number(req.query['to']) : undefined,
        };
        const count = await mgr.clear(filter);
        return { deleted: count };
    });
});
export default router;
