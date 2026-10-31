import { NonExecutableShareableManager } from './shareable.js';
import { BasicStorage, ToolsGroupDTO } from '../types/index.js';
export declare class ToolsGroupManager extends NonExecutableShareableManager<ToolsGroupDTO> {
    private static instance;
    private constructor();
    static init(storage: BasicStorage<ToolsGroupDTO>): Promise<ToolsGroupManager>;
    static getInstance(): Promise<ToolsGroupManager | null>;
}
