import { Tool, ToolDTO, BasicStorage, CloudSharingService } from '../types/index.js';
import { ExecutableShareableManager } from './shareable.js';
export declare class ToolManager extends ExecutableShareableManager<ToolDTO, Tool> {
    private static instance;
    private constructor();
    setCloudService(cloudService: CloudSharingService<ToolDTO>): void;
    static init(toolsDirectory: string, storage: BasicStorage<ToolDTO>): Promise<ToolManager>;
    static getInstance(): Promise<ToolManager | null>;
    serializeInstance(name: string): Promise<ToolDTO | null>;
}
