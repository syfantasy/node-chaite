import { AbstractShareable } from './cloud.js';
import { AssistantMessage, UserMessage } from './models.js';
export declare class ProcessorDTO extends AbstractShareable<ProcessorDTO> {
    constructor(params: Partial<ProcessorDTO>);
    type: 'pre' | 'post';
    fromString(str: string): ProcessorDTO;
    toFormatedString(_verbose?: boolean): string;
}
export interface Processor {
    type: 'pre' | 'post';
    name: string;
}
/**
 * 继承这个来实现一个前处理器
 */
export declare abstract class PreProcessor implements Processor {
    type: 'pre';
    abstract process(message: UserMessage): Promise<UserMessage>;
    name: string;
    id: string;
}
/**
 * 继承这个来实现一个后处理器
 */
export declare abstract class PostProcessor implements Processor {
    type: 'post';
    abstract process(message: AssistantMessage): Promise<AssistantMessage>;
    name: string;
    id: string;
}
