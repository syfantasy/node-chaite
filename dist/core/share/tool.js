import { promises as fsPromises } from 'fs';
import path from 'path';
import { ToolDTO, } from '../types/index.js';
import { ExecutableShareableManager } from './shareable.js';
export class ToolManager extends ExecutableShareableManager {
    constructor(toolsDirectory, storage) {
        super('tool', toolsDirectory, storage);
    }
    setCloudService(cloudService) {
        this.cloudService = cloudService;
    }
    static async init(toolsDirectory, storage) {
        if (ToolManager.instance) {
            return ToolManager.instance;
        }
        ToolManager.instance = new ToolManager(toolsDirectory, storage);
        await ToolManager.instance.initialize();
        return ToolManager.instance;
    }
    static async getInstance() {
        if (!ToolManager.instance) {
            return null;
        }
        return ToolManager.instance;
    }
    async serializeInstance(name) {
        const filename = this.instanceMap.get(name);
        if (!filename)
            return null;
        const filePath = path.join(this.codeDirectory, filename);
        try {
            const code = await fsPromises.readFile(filePath, 'utf-8');
            return new ToolDTO({ name, code });
        }
        catch (error) {
            console.error(`Error serializing tool '${name}':`, error);
            return null;
        }
    }
}
