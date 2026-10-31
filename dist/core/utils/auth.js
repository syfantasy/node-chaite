import jwt from 'jsonwebtoken';
export class FrontEndAuthHandler {
    constructor() {
    }
    generateToken(timeout = 5 * 60, onetime = false) {
        const timestamp = Math.floor(Date.now() / 1000);
        const randomString = Math.random().toString(36).substring(2, 15);
        const token = `${timestamp}-${randomString}`;
        if (!onetime) {
            this.token = token;
            setTimeout(() => {
                this.token = null;
            }, timeout * 1000);
        }
        return token;
    }
    validateToken(token) {
        if (token === this.token) {
            this.token = null;
            return true;
        }
        return false;
    }
    static generateJWT(key) {
        return jwt.sign({ key }, key, { expiresIn: '30d' });
    }
    static validateJWT(key, token) {
        try {
            jwt.verify(token, key);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
