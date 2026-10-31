import { promises as fsPromises } from 'fs';
import path from 'path';
import { ProcessorDTO, } from '../types/index.js';
import { ExecutableShareableManager } from './shareable.js';
export class ProcessorsManager extends ExecutableShareableManager {
    constructor(processorsDirectory, storage) {
        super('processor', processorsDirectory, storage);
    }
    setCloudService(cloudService) {
        this.cloudService = cloudService;
    }
    static async init(processorsDirectory, storage) {
        if (ProcessorsManager.instance) {
            return ProcessorsManager.instance;
        }
        ProcessorsManager.instance = new ProcessorsManager(processorsDirectory, storage);
        await ProcessorsManager.instance.initialize();
        return ProcessorsManager.instance;
    }
    static async getInstance() {
        if (!ProcessorsManager.instance) {
            return null;
        }
        return ProcessorsManager.instance;
    }
    async serializeInstance(name) {
        const filename = this.instanceMap.get(name);
        if (!filename)
            return null;
        const filePath = path.join(this.codeDirectory, filename);
        try {
            const code = await fsPromises.readFile(filePath, 'utf-8');
            return new ProcessorDTO({ name, code });
        }
        catch (error) {
            console.error(`Error serializing tool '${name}':`, error);
            return null;
        }
    }
}
