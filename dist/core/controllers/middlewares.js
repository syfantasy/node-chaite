import { Chaite, FrontEndAuthHandler } from '../index.js';
export const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        res.status(401).json({ message: 'Access denied, token missing' });
        return;
    }
    try {
        const authKey = Chaite.getInstance().getGlobalConfig()?.getAuthKey();
        if (FrontEndAuthHandler.validateJWT(authKey, token)) {
            next();
            return;
        }
        res.status(401).json({ message: 'Invalid token' });
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid token format' });
    }
};
