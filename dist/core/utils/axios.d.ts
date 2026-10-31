import type { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
export interface ApiError {
    status?: number;
    data?: unknown;
    message: string;
    request?: unknown;
    originalError?: Error | AxiosError;
}
export interface HttpClientOptions {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
    authorizationPrefix?: string;
    getToken?: () => string | Promise<string> | null | undefined;
    onRequest?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
    onResponse?: <T>(response: T) => T;
    onError?: (error: ApiError) => ApiError;
}
/**
 * 创建HTTP客户端
 */
export declare class HttpClient {
    private instance;
    private options;
    /**
     * 构造HTTP客户端
     * @param options 配置选项
     */
    constructor(options?: HttpClientOptions);
    /**
     * 创建Axios实例
     */
    private createAxiosInstance;
    /**
     * 设置拦截器
     */
    private setupInterceptors;
    /**
     * 标准化错误对象
     */
    private normalizeError;
    /**
     * 更新配置
     * @param options 新配置
     */
    updateOptions(options: Partial<HttpClientOptions>): void;
    /**
     * 获取底层 Axios 实例
     */
    getAxiosInstance(): AxiosInstance;
    /**
     * HTTP GET 请求
     */
    get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * HTTP POST 请求
     */
    post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>;
    /**
     * HTTP PUT 请求
     */
    put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>;
    /**
     * HTTP DELETE 请求
     */
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
    /**
     * HTTP PATCH 请求
     */
    patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>;
}
/**
 * 创建默认的HTTP客户端
 */
export declare const createHttpClient: (options?: HttpClientOptions) => HttpClient;
export default createHttpClient;
