export const MultipleKeyStrategyChoice = {
    RANDOM: 'random',
    ROUND_ROBIN: 'round-robin',
    CONVERSATION_HASH: 'conversation-hash',
};
export class BaseClientOptions {
    constructor(options) {
        if (options) {
            this.features = options.features || [];
            this.tools = options.tools || [];
            this.baseUrl = options.baseUrl || '';
            this.apiKey = options.apiKey || '';
            this.multipleKeyStrategy = options.multipleKeyStrategy;
            this.proxy = options.proxy;
            this.preProcessorIds = options.preProcessorIds;
            this.postProcessorIds = options.postProcessorIds;
            if (options.historyManager) {
                this.historyManager = options.historyManager;
            }
            this.logger = options.logger;
            this.toolExecutor = options.toolExecutor;
            this.toolTimeoutMs = options.toolTimeoutMs;
            this.init();
        }
    }
    static create(options) {
        return options instanceof BaseClientOptions ? options : new BaseClientOptions(options);
    }
    async ready() {
        return this.initPromise;
    }
    setHistoryManager(historyManager) {
        this.historyManager = historyManager;
    }
    setLogger(logger) {
        this.logger = logger;
    }
    getPostProcessors() {
        return this.postProcessors || [];
    }
    getPreProcessors() {
        return this.preProcessors || [];
    }
    async init() {
        this.initPromise = (async () => {
        })();
    }
    toString() {
        const json = {
            features: this.features,
            tools: this.tools,
            baseUrl: this.baseUrl,
            apiKey: this.apiKey,
            multipleKeyStrategy: this.multipleKeyStrategy,
            proxy: this.proxy,
            // historyManager: this.historyManager,
            // logger: this.logger,
            postProcessors: this.postProcessors?.map(p => p.id),
            preProcessors: this.preProcessors?.map(p => p.id),
        };
        return JSON.stringify(json);
    }
    fromString(str) {
        const json = JSON.parse(str);
        return new BaseClientOptions(json);
    }
}
export const DefaultLogger = new class DefaultLogger {
    static { this.COLORS = {
        reset: '\x1b[0m',
        debug: '\x1b[36m', // 青色
        info: '\x1b[32m', // 绿色
        warn: '\x1b[33m', // 黄色
        error: '\x1b[31m', // 红色
    }; }
    constructor(name = 'Chaite', enableColors = true) {
        this.name = name;
        this.enableColors = enableColors;
    }
    formatDate() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
    formatMessage(level, msg, args) {
        // 格式化前缀
        const prefix = `[${this.name}][${this.formatDate()}][${level}]`;
        // 格式化消息内容
        const formattedMsg = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2);
        // 添加颜色（如果启用）
        if (this.enableColors) {
            const color = DefaultLogger.COLORS[level.toLowerCase()] || '';
            return `${color}${prefix}${DefaultLogger.COLORS.reset} ${formattedMsg}`;
        }
        return `${prefix} ${formattedMsg}`;
    }
    debug(msg, ...args) {
        console.log(this.formatMessage('DEBUG', msg, args), ...args);
    }
    error(msg, ...args) {
        console.log(this.formatMessage('ERROR', msg, args), ...args);
    }
    info(msg, ...args) {
        console.log(this.formatMessage('INFO', msg, args), ...args);
    }
    warn(msg, ...args) {
        console.log(this.formatMessage('WARN', msg, args), ...args);
    }
}();
export class ChaiteContext {
    constructor(logger) {
        this.logger = logger;
    }
    setHistoryMessages(histories) {
        this.historyMessages = histories;
    }
    getHistoryMessages() {
        return this.historyMessages;
    }
    setOptions(options) {
        this.options = options;
    }
    getOptions() {
        return this.options;
    }
    setEvent(event) {
        this.event = event;
    }
    setChaite(chaite) {
        this.chaite = chaite;
    }
    getEvent() {
        return this.event;
    }
    setData(data) {
        this.data = data;
    }
    getData() {
        return this.data;
    }
    setClient(client) {
        this.client = client;
    }
    getClient() {
        return this.client;
    }
    getChaite() {
        return this.chaite;
    }
}
