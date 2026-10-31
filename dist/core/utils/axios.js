import axios from 'axios';
/**
 * 创建HTTP客户端
 */
export class HttpClient {
    /**
     * 构造HTTP客户端
     * @param options 配置选项
     */
    constructor(options = {}) {
        this.options = {
            baseURL: '',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            authorizationPrefix: 'Bearer',
            ...options,
        };
        this.instance = this.createAxiosInstance();
        this.setupInterceptors();
    }
    /**
     * 创建Axios实例
     */
    createAxiosInstance() {
        return axios.create({
            baseURL: this.options.baseURL,
            timeout: this.options.timeout,
            headers: this.options.headers,
        });
    }
    /**
     * 设置拦截器
     */
    setupInterceptors() {
        // 请求拦截器
        this.instance.interceptors.request.use(async (config) => {
            // 自定义请求处理
            if (this.options.onRequest) {
                config = this.options.onRequest(config);
            }
            // 添加认证 token（如果提供了获取 token 的方法）
            if (this.options.getToken && config.headers) {
                const token = await this.options.getToken();
                if (token) {
                    config.headers.Authorization = `${this.options.authorizationPrefix} ${token}`;
                }
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        // 响应拦截器
        this.instance.interceptors.response.use((response) => {
            // 使用自定义的响应处理器（如果有）
            if (this.options.onResponse) {
                return this.options.onResponse(response.data);
            }
            return response.data;
        }, (error) => {
            const apiError = this.normalizeError(error);
            // 使用自定义的错误处理器（如果有）
            if (this.options.onError) {
                return Promise.reject(this.options.onError(apiError));
            }
            return Promise.reject(apiError);
        });
    }
    /**
     * 标准化错误对象
     */
    normalizeError(error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // 服务器响应了，但状态码超出 2xx 范围
                return {
                    status: error.response.status,
                    data: error.response.data,
                    message: `Request failed with status code ${error.response.status}`,
                    originalError: error,
                };
            }
            else if (error.request) {
                // 请求已经发出，但没有收到响应
                return {
                    request: error.request,
                    message: 'No response received from server',
                    originalError: error,
                };
            }
        }
        // 其他类型的错误
        if (error instanceof Error) {
            return {
                message: error.message,
                originalError: error,
            };
        }
        // 未知错误
        return {
            message: 'Unknown error occurred',
            originalError: error instanceof Error ? error : new Error(String(error)),
        };
    }
    /**
     * 更新配置
     * @param options 新配置
     */
    updateOptions(options) {
        this.options = { ...this.options, ...options };
        this.instance = this.createAxiosInstance();
        this.setupInterceptors();
    }
    /**
     * 获取底层 Axios 实例
     */
    getAxiosInstance() {
        return this.instance;
    }
    /**
     * HTTP GET 请求
     */
    async get(url, config) {
        return this.instance.get(url, config);
    }
    /**
     * HTTP POST 请求
     */
    async post(url, data, config) {
        return this.instance.post(url, data, config);
    }
    /**
     * HTTP PUT 请求
     */
    async put(url, data, config) {
        return this.instance.put(url, data, config);
    }
    /**
     * HTTP DELETE 请求
     */
    async delete(url, config) {
        return this.instance.delete(url, config);
    }
    /**
     * HTTP PATCH 请求
     */
    async patch(url, data, config) {
        return this.instance.patch(url, data, config);
    }
}
/**
 * 创建默认的HTTP客户端
 */
export const createHttpClient = (options) => {
    return new HttpClient(options);
};
export default createHttpClient;
