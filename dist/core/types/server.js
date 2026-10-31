export class ChaiteResponse {
    constructor(code, data, message) {
        this.code = code;
        this.data = data;
        this.message = message;
    }
    static ok(data) {
        return new ChaiteResponse(0, data, 'ok');
    }
    static okm(data, msg) {
        return new ChaiteResponse(0, data, msg);
    }
    static fail(data, msg) {
        return new ChaiteResponse(-1, data, msg);
    }
    static failc(data, msg, code) {
        return new ChaiteResponse(code, data, msg);
    }
}
