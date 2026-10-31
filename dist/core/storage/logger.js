let resolver;
export function setStorageLoggerResolver(fn) {
    resolver = fn;
}
const consoleLogger = {
    debug: (...args) => console.debug(...args),
    info: (...args) => console.info(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
    trace: (...args) => console.debug(...args),
    mark: (...args) => console.info(...args),
};
export function log() {
    return resolver?.() ?? consoleLogger;
}
