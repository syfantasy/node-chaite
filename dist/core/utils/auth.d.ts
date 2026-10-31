export declare class FrontEndAuthHandler {
    private token;
    constructor();
    generateToken(timeout?: number, onetime?: boolean): string;
    validateToken(token: string): boolean;
    static generateJWT(key: string): any;
    static validateJWT(key: string, token: string): boolean;
}
