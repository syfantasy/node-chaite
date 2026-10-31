export declare class ChaiteResponse<T> {
    private code;
    private data;
    private message;
    constructor(code: number, data: T, message: string);
    static ok<T>(data: T): ChaiteResponse<T>;
    static okm<T>(data: T, msg: string): ChaiteResponse<T>;
    static fail<T>(data: T, msg: string): ChaiteResponse<T>;
    static failc<T>(data: T, msg: string, code: number): ChaiteResponse<T>;
}
