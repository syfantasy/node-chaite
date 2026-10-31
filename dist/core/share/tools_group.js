import { NonExecutableShareableManager } from './shareable.js';
export class ToolsGroupManager extends NonExecutableShareableManager {
    constructor(storage) {
        super('tools-group', storage);
    }
    static async init(storage) {
        if (ToolsGroupManager.instance) {
            return ToolsGroupManager.instance;
        }
        ToolsGroupManager.instance = new ToolsGroupManager(storage);
        return ToolsGroupManager.instance;
    }
    static async getInstance() {
        if (!ToolsGroupManager.instance) {
            return null;
        }
        return ToolsGroupManager.instance;
    }
}
