import express from 'express';
import { Chaite, ChaiteResponse } from '../index.js';
import { ChaiteContext } from '../types/index.js';
import { createClient } from '../adapters/index.js';
const router = express.Router();
function paginate(items, req) {
    const page = Math.max(1, parseInt(req.query['page']) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query['pageSize']) || 20));
    return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
}
async function wrap(res, fn) {
    try {
        const data = await fn();
        if (!res.headersSent)
            res.status(200).json(ChaiteResponse.ok(data));
    }
    catch (e) {
        if (!res.headersSent) {
            Chaite.getInstance().getLogger().error(e);
            res.status(500).json(ChaiteResponse.fail(null, e instanceof Error ? e.message : 'Unknown error'));
        }
    }
}
// ─── Local CRUD ───────────────────────────────────────────────────────────────
/** GET /api/channels/list?name=&type=&status=&model=&page=1&pageSize=20 */
router.get('/list', (req, res) => {
    wrap(res, async () => {
        let items = await Chaite.getInstance().getChannelsManager().listInstances();
        const { name, type, status, model } = req.query;
        if (name)
            items = items.filter(c => c.name.includes(name));
        if (type)
            items = items.filter(c => c.adapterType === type);
        if (status)
            items = items.filter(c => c.status === status);
        if (model)
            items = items.filter(c => c.models.some(m => m.name.includes(model)));
        return paginate(items, req);
    });
});
/** GET /api/channels/models — configured models grouped by channel + unique models */
router.get('/models', (req, res) => {
    wrap(res, async () => {
        const channels = await Chaite.getInstance().getChannelsManager().listInstances();
        const counts = new Map();
        const channelModels = [];
        for (const channel of channels) {
            if (channel.status === 'disabled')
                continue;
            for (const model of channel.models) {
                const name = model.name?.trim();
                if (name) {
                    counts.set(name, (counts.get(name) ?? 0) + 1);
                    channelModels.push({
                        channelId: channel.id,
                        channelName: channel.name,
                        modelName: name,
                        fullKey: `${channel.name}/${name}`,
                    });
                }
            }
        }
        const uniqueModels = [...counts.entries()]
            .map(([name, channelCount]) => ({ name, channelCount }))
            .sort((left, right) => left.name.localeCompare(right.name));
        return {
            models: uniqueModels,
            channelModels,
        };
    });
});
/** GET /api/channels/vision-models — enabled channels and models that support vision */
router.get('/vision-models', (req, res) => {
    wrap(res, async () => {
        const channels = await Chaite.getInstance().getChannelsManager().listInstances();
        return channels
            .filter(channel => channel.status === 'enabled')
            .map(channel => ({
            id: channel.id,
            name: channel.name,
            models: channel.models.filter(model => model.features?.includes('visual')).map(model => ({ name: model.name, features: model.features })),
        }))
            .filter(channel => channel.models.length > 0);
    });
});
/** POST /api/channels — create */
router.post('/', (req, res) => {
    wrap(res, async () => {
        const id = await Chaite.getInstance().getChannelsManager().addInstance(req.body);
        return { ...req.body, id };
    });
});
/** PUT /api/channels/:id — full update */
router.put('/:id', (req, res) => {
    wrap(res, async () => {
        const mgr = Chaite.getInstance().getChannelsManager();
        const existing = await mgr.getInstance(req.params.id);
        if (!existing) {
            res.status(404).json(ChaiteResponse.fail(null, 'Channel not found'));
            return null;
        }
        const body = { ...req.body, id: req.params.id };
        const id = await mgr.upsertInstance(body);
        return { ...body, id };
    });
});
/** GET /api/channels/:id */
router.get('/:id', (req, res) => {
    wrap(res, async () => {
        const channel = await Chaite.getInstance().getChannelsManager().getInstance(req.params.id);
        if (!channel) {
            res.status(404).json(ChaiteResponse.fail(null, 'Channel not found'));
            return null;
        }
        return channel;
    });
});
/** DELETE /api/channels/:id */
router.delete('/:id', (req, res) => {
    wrap(res, async () => {
        const mgr = Chaite.getInstance().getChannelsManager();
        const existing = await mgr.getInstance(req.params.id);
        if (!existing) {
            res.status(404).json(ChaiteResponse.fail(null, 'Channel not found'));
            return null;
        }
        await mgr.deleteInstance(req.params.id);
        return { deleted: true };
    });
});
// ─── Cloud sync ───────────────────────────────────────────────────────────────
router.post('/upload', (req, res) => {
    wrap(res, () => Chaite.getInstance().getChannelsManager().shareToCloud(req.body.id));
});
router.post('/download', (req, res) => {
    wrap(res, async () => {
        const manager = Chaite.getInstance().getChannelsManager();
        const channel = await manager.getFromCloud(req.body.id);
        if (!channel) {
            res.status(404).json(ChaiteResponse.fail(null, 'Channel not found in cloud'));
            return null;
        }
        channel.cloudId = channel.id;
        const existing = await manager.getInstanceByCloudId(channel.cloudId);
        if (existing.length > 0) {
            if (existing[0].toString() === channel.toString()) {
                res.status(400).json(ChaiteResponse.fail(null, '渠道已是最新版本'));
                return null;
            }
            channel.id = existing[0].id;
        }
        else {
            channel.id = '';
        }
        const id = await manager.upsertInstance(channel);
        return { ...channel, id };
    });
});
router.post('/list-cloud', (req, res) => {
    wrap(res, () => Chaite.getInstance().getChannelsManager().listFromCloud(req.body.filter || {}, req.body.query, req.body.options || {}));
});
// ─── Channel test ────────────────────────────────────────────────────────────
/** POST /api/channels/test — test channel connectivity */
router.post('/test', (req, res) => {
    wrap(res, async () => {
        const { id, model } = req.body;
        const mgr = Chaite.getInstance().getChannelsManager();
        const channel = await mgr.getInstance(id);
        if (!channel) {
            res.status(404).json(ChaiteResponse.fail(null, 'Channel not found'));
            return null;
        }
        const testModel = model || channel.models[0]?.name;
        if (!testModel) {
            res.status(400).json(ChaiteResponse.fail(null, 'No model specified and channel has no models'));
            return null;
        }
        const context = new ChaiteContext(Chaite.getInstance().getLogger());
        context.chaite = Chaite.getInstance();
        context.channelId = channel.id;
        context.channelName = channel.name;
        const client = createClient(channel.adapterType, channel.options, context);
        const startTime = Date.now();
        try {
            const result = await client.sendMessage({ role: 'user', content: [{ type: 'text', text: 'Hi! Reply with exactly: OK' }] }, { model: testModel, maxToken: 10, temperature: 0, stream: false });
            const elapsed = Date.now() - startTime;
            const content = result.contents
                ? result.contents.map((c) => c.text || '').join('')
                : '';
            return {
                success: true,
                model: testModel,
                elapsed,
                response: content.trim().substring(0, 200),
                usage: result.usage,
            };
        }
        catch (e) {
            const elapsed = Date.now() - startTime;
            return {
                success: false,
                model: testModel,
                elapsed,
                error: e instanceof Error ? e.message : 'Unknown error',
            };
        }
    });
});
/** POST /api/channels/auto-features — auto-detect channel features */
router.post('/auto-features', (req, res) => {
    wrap(res, async () => {
        const { id, model } = req.body;
        const mgr = Chaite.getInstance().getChannelsManager();
        const channel = await mgr.getInstance(id);
        if (!channel) {
            res.status(404).json(ChaiteResponse.fail(null, 'Channel not found'));
            return null;
        }
        const testModel = model || channel.models[0]?.name;
        if (!testModel) {
            res.status(400).json(ChaiteResponse.fail(null, 'No model specified'));
            return null;
        }
        const context = new ChaiteContext(Chaite.getInstance().getLogger());
        context.chaite = Chaite.getInstance();
        const client = createClient(channel.adapterType, channel.options, context);
        const results = {};
        // Test chat
        try {
            await client.sendMessage({ role: 'user', content: [{ type: 'text', text: 'Say just HELLO' }] }, { model: testModel, maxToken: 10, temperature: 0, stream: false });
            results.chat = { supported: true, detail: 'OK' };
        }
        catch (e) {
            results.chat = { supported: false, detail: e?.message || 'failed' };
        }
        // Test visual (send a tiny 1x1 base64 png)
        try {
            const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
            const visualMsg = {
                role: 'user',
                content: [
                    { type: 'text', text: 'Say exactly one word describing this image' },
                    { type: 'image', image: tinyPng, mimeType: 'image/png' },
                ],
            };
            await client.sendMessage(visualMsg, { model: testModel, maxToken: 20, temperature: 0, stream: false });
            results.visual = { supported: true, detail: 'OK' };
        }
        catch (e) {
            results.visual = { supported: false, detail: e?.message || 'failed' };
        }
        // Test embedding
        try {
            await client.getEmbedding('test', { model: testModel });
            results.embedding = { supported: true, detail: 'OK' };
        }
        catch (e) {
            results.embedding = { supported: false, detail: e?.message || 'failed' };
        }
        // Test tool — create a temp client with a dummy tool and check if the model calls it
        try {
            const toolClient = createClient(channel.adapterType, {
                ...channel.options,
                tools: [{
                        name: 'get_weather',
                        type: 'function',
                        function: {
                            name: 'get_weather',
                            description: 'Get current weather for a city',
                            parameters: {
                                type: 'object',
                                properties: { location: { type: 'string', description: 'City name' } },
                                required: ['location'],
                            },
                        },
                        run: async () => 'ok',
                    }],
            }, context);
            await toolClient.sendMessage({ role: 'user', content: [{ type: 'text', text: 'What is the weather in Beijing? Use the get_weather function to check.' }] }, { model: testModel, maxToken: 500, temperature: 0, stream: false, toolChoice: { type: 'any' } });
            // toolChoice: 'any' → tool_choice: 'required'. If no error, tools are supported.
            results.tool = { supported: true, detail: 'OK' };
        }
        catch (e) {
            results.tool = { supported: false, detail: e?.message || 'failed' };
        }
        return {
            model: testModel,
            features: results,
        };
    });
});
export default router;
