import EventEmitter from 'node:events';
export declare const DEFAULT_HOST = "127.0.0.1";
export declare const DEFAULT_PORT = 48370;
export declare class GlobalConfig extends EventEmitter {
    /**
     * jwt密钥
     */
    private authKey;
    /**
     * 监听地址
     */
    private host;
    /**
     * 监听端口
     */
    private port;
    /**
     * 是否开启调试模式
     */
    private debug;
    /**
     * 登录有效期，单位秒
     */
    private loginValidTime;
    setAuthKey(key: string): void;
    setHost(host: string): void;
    setPort(port: number): void;
    setDebug(debug: boolean): void;
    setLoginValidTime(time: number): void;
    getAuthKey(): string;
    getHost(): string;
    getPort(): number;
    getDebug(): boolean;
    getLoginValidTime(): number;
}
