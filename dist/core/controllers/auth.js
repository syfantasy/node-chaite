import express from 'express';
import { Chaite, ChaiteResponse, FrontEndAuthHandler, GlobalConfig } from '../index.js';
const router = express.Router();
router.post('/login', async (req, res) => {
    const body = req.body;
    const authHandler = Chaite.getInstance().getFrontendAuthHandler();
    if (!Chaite.getInstance().getGlobalConfig()) {
        Chaite.getInstance().setGlobalConfig(new GlobalConfig());
    }
    const config = Chaite.getInstance().getGlobalConfig();
    const authKey = config.getAuthKey();
    const inputToken = String(body.token || body.password || '').trim();
    const isDynamicValid = authHandler ? authHandler.validateToken(inputToken) : false;
    const isStaticValid = !!authKey && inputToken === authKey;
    if (isStaticValid || isDynamicValid) {
        const key = authKey || (authHandler ? authHandler.generateToken(0, true) : 'chaite-key');
        Chaite.getInstance().getLogger().info('Login success, generating token ' + key);
        config.setAuthKey(key);
        const token = FrontEndAuthHandler.generateJWT(key);
        res.status(200)
            .json(ChaiteResponse.ok({
            token: token,
            expiresIn: 7 * 24 * 60 * 60,
        }));
    }
    else {
        res.status(401)
            .json(ChaiteResponse.fail(null, 'Invalid token'));
    }
});
export default router;
