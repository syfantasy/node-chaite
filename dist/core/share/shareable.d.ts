import { BasicStorage, CloudSharingService, Filter, PaginationResult, SearchOption, Shareable } from '../types/index.js';
export type ExecutableSShareableType = 'tool' | 'processor';
/**
 * T是DTO
 * C是T对应的可执行的实例类型
 * @interface ExecutableShareableManager
 */
export declare abstract class ExecutableShareableManager<T extends Shareable<T>, C> {
    private type;
    private storage;
    private watcher;
    /**
     * 存储示例名称和文件名的映射
     * @private
     */
    protected instanceMap: Map<string, string>;
    /**
     * codeDirectory是存放实际代码的目录
     * @private
     */
    protected codeDirectory: string;
    cloudService?: CloudSharingService<T>;
    protected constructor(type: ExecutableSShareableType, codeDirectory: string, storage: BasicStorage<T>);
    setCloudService(cloudService: CloudSharingService<T>): void;
    /**
     * 只有可执行类型的实例才需要，如工具、处理器等。设置类不需要
     * @private
     */
    initialize(): Promise<void>;
    private setupFileWatcher;
    private scanInstances;
    /**
     * 返回实例名字们
     * @returns 实例名字列表
     */
    listInstanceNames(): Promise<string[]>;
    listInstances(): Promise<T[]>;
    getInstanceT(id: string): Promise<T | null>;
    /**
     * 获取实例对象而非Shareable DTO
     * @param name
     */
    getInstance(name: string): Promise<C | undefined>;
    /**
     * Plugins historically used both `export default new Tool()` and
     * `export class MyProcessor ...`. Resolve both shapes from the same loader.
     */
    private resolveModuleInstance;
    /**
     * 新增或更新
     * 有id就是更新，靠storage实现去控制，这里不管
     * @param instance
     * @return id
     */
    addInstance(instance: T): Promise<string>;
    addInstanceCode(name: string, code: string): Promise<void>;
    upsertInstanceT(t: T): Promise<string>;
    getInstanceTByCloudId(cloudId: string): Promise<T[]>;
    renameFile(id: string, oldName: string, newName: string): Promise<void>;
    deleteInstance(id: string): Promise<void>;
    /**
     * 序列化实例，返回DTO
     * @param name
     */
    abstract serializeInstance(name: string): Promise<T | null>;
    private checkCloudService;
    shareToCloud(id: string): Promise<string | undefined>;
    listFromCloud(filter: Filter, query: string, searchOption: SearchOption): Promise<PaginationResult<T & {
        downloaded: string;
    }>>;
    getFromCloud(shareId: string): Promise<T | null>;
    shareP2P(name: string): Promise<string | null>;
    dispose(): Promise<void>;
}
export type NonExecutableSShareableType = 'chat-preset' | 'tool-settings' | 'channel' | 'tools-group';
export declare abstract class NonExecutableShareableManager<T extends Shareable<T>> {
    protected type: NonExecutableSShareableType;
    protected storage: BasicStorage<T>;
    cloudService?: CloudSharingService<T>;
    protected constructor(type: NonExecutableSShareableType, storage: BasicStorage<T>);
    setCloudService(cloudService: CloudSharingService<T>): void;
    addInstance(instance: T): Promise<string>;
    deleteInstance(key: string): Promise<void>;
    listInstances(): Promise<T[]>;
    getInstance(key: string): Promise<T | null>;
    upsertInstance(t: T): Promise<string>;
    getInstanceByCloudId(cloudId: string): Promise<T[]>;
    private checkCloudService;
    shareToCloud(key: string): Promise<string | undefined>;
    shareP2P(key: string): Promise<string | null>;
    getFromCloud(shareId: string): Promise<T | null>;
    listFromCloud(filter: Filter, query: string, searchOption: SearchOption): Promise<PaginationResult<T & {
        id: string;
    }>>;
    deleteFromCloud(key: string): Promise<void>;
}
