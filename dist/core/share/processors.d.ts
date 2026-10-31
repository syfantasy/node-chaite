import { ProcessorDTO, Processor } from '../types/index.js';
import { CloudSharingService } from '../types/cloud.js';
import { ExecutableShareableManager } from './shareable.js';
import { BasicStorage } from '../types/index.js';
export declare class ProcessorsManager extends ExecutableShareableManager<ProcessorDTO, Processor> {
    private static instance;
    private constructor();
    setCloudService(cloudService: CloudSharingService<ProcessorDTO>): void;
    static init(processorsDirectory: string, storage: BasicStorage<ProcessorDTO>): Promise<ProcessorsManager>;
    static getInstance(): Promise<ProcessorsManager | null>;
    serializeInstance(name: string): Promise<ProcessorDTO | null>;
}
