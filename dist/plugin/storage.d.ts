export declare class PluginKVStorage {
    private driver;
    private initialized;
    constructor(driver: any);
    initialize(): Promise<void>;
    createScopedClient(pluginId: string): {
        get: <T = any>(key: string, defaultValue?: T) => Promise<T | undefined>;
        set: (key: string, value: any) => Promise<void>;
        delete: (key: string) => Promise<boolean>;
        list: () => Promise<Record<string, any>>;
        clear: () => Promise<number>;
    };
}
