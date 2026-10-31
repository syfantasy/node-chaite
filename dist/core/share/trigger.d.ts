import { BasicStorage, ChaiteContext, CloudSharingService, Filter, PaginationResult, SearchOption } from '../types/index.js';
import { Trigger, TriggerDTO } from '../types/index.js';
/**
 * 专门用于管理触发器的管理器
 * 由于触发器需要注册并保持状态运行，因此管理方式不同于普通的可执行代码
 */
export declare class TriggerManager<T extends TriggerDTO> {
    private storage;
    /**
     * 存储触发器名称到 DTO ID 的映射
     * 这样通过实例的 name 就可以找到对应的 DTO id
     */
    protected nameToIdMap: Map<string, string>;
    private watcher;
    /**
     * 存储示例名称和文件名的映射
     */
    protected instanceMap: Map<string, string>;
    /**
     * 已注册的触发器实例
     */
    protected activeInstances: Map<string, Trigger>;
    /**
     * 全局上下文，用于传递给触发器
     */
    protected context: ChaiteContext;
    /**
     * codeDirectory是存放实际代码的目录
     */
    protected codeDirectory: string;
    cloudService?: CloudSharingService<T>;
    constructor(codeDirectory: string, storage: BasicStorage<T>);
    setCloudService(cloudService: CloudSharingService<T>): void;
    /**
     * 初始化管理器，加载所有触发器并注册
     */
    initialize(): Promise<void>;
    /**
     * 设置文件监听器，监控触发器文件的变化
     */
    private setupFileWatcher;
    /**
     * 扫描触发器实例
     */
    private scanInstances;
    /**
     * 注册所有启用状态的触发器
     */
    private registerAllEnabledTriggers;
    /**
     * 注册单个触发器
     */
    registerTrigger(dtoName: string): Promise<void>;
    /**
   * 通过触发器实例的 name 删除触发器
   * 注意：这里的 name 是触发器实例的 name，而不是 DTO 中的 name
   */
    deleteInstanceByName(triggerName: string): Promise<void>;
    /**
     * 取消注册触发器
     */
    unregisterTrigger(name: string): Promise<void>;
    /**
     * 返回实例名字们
     */
    listInstanceNames(): Promise<string[]>;
    /**
     * 获取所有触发器DTO
     */
    listInstances(): Promise<T[]>;
    /**
     * 获取触发器DTO
     */
    getInstanceT(id: string): Promise<T | null>;
    /**
     * 通过名称获取触发器DTO
     */
    getInstanceTByName(name: string): Promise<T | null>;
    /**
     * 获取触发器实例对象
     */
    getInstance(name: string): Promise<Trigger | undefined>;
    /**
     * 新增或更新触发器
     */
    addInstance(instance: T): Promise<string>;
    /**
     * 添加触发器代码
     */
    addInstanceCode(name: string, code: string): Promise<void>;
    /**
     * 更新或新增触发器
     */
    upsertInstanceT(t: T): Promise<string>;
    /**
     * 通过云ID获取触发器
     */
    getInstanceTByCloudId(cloudId: string): Promise<T[]>;
    /**
     * 重命名触发器文件
     */
    renameFile(id: string, oldName: string, newName: string): Promise<void>;
    /**
     * 删除触发器
     */
    deleteInstance(id: string): Promise<void>;
    /**
     * 更新上下文
     */
    updateContext(context: ChaiteContext): void;
    /**
     * 序列化触发器，返回DTO
     */
    serializeInstance(name: string): Promise<T | null>;
    private checkCloudService;
    shareToCloud(id: string): Promise<string | undefined>;
    listFromCloud(filter: Filter, query: string, searchOption: SearchOption): Promise<PaginationResult<T & {
        downloaded: string;
    }>>;
    getFromCloud(shareId: string): Promise<T | null>;
    shareP2P(name: string): Promise<string | null>;
    /**
     * 清理资源，关闭文件监听器
     */
    dispose(): Promise<void>;
    /**
     * 启用触发器
     */
    enableTrigger(id: string): Promise<void>;
    /**
     * 禁用触发器
     */
    disableTrigger(id: string): Promise<void>;
    /**
     * 检查触发器是否正在运行
     */
    isRunning(name: string): boolean;
    /**
     * 获取当前运行中的所有触发器
     */
    getRunningTriggers(): string[];
}
