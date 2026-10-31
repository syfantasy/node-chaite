import express from 'express';
import { Chaite, ChaiteResponse } from '../index.js';
const router = express.Router();
router.get('/', async (req, res) => {
    const chaite = Chaite.getInstance();
    const config = await chaite.getCustomConfig();
    res.status(200)
        .json(ChaiteResponse.ok(config));
});
router.post('/', async (req, res) => {
    const chaite = Chaite.getInstance();
    try {
        await chaite.onUpdateCustomConfig(req.body);
        res.status(200)
            .json(ChaiteResponse.ok(req.body));
    }
    catch (e) {
        chaite.getLogger().error(e);
        if (e instanceof Error) {
            res.status(500)
                .json(ChaiteResponse.fail(null, e.message));
        }
        else {
            res.status(500)
                .json(ChaiteResponse.fail(null, 'Unknown error'));
        }
    }
});
export default router;
