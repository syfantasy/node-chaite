import { AbstractShareable } from './cloud.js';
import { ChaiteContext } from './common.js';
import { Job } from '@karinjs/node-schedule';
import { ModelResponse, UserMessage } from './models.js';
import { SendMessageOption } from './adapter.js';
import { ChatPreset } from '../channels/index.js';
import EventEmitter from 'node:events';
export declare class TriggerDTO extends AbstractShareable<TriggerDTO> {
    constructor(params: Partial<TriggerDTO>);
    status: 'enabled' | 'disabled';
    isOneTime?: boolean;
    fromString(str: string): TriggerDTO;
    toFormatedString(verbose?: boolean): string;
}
export interface Trigger {
    name: string;
    isOneTime?: boolean;
    register(context: ChaiteContext): Promise<void>;
    unregister(): Promise<void>;
    queryLLM(message: UserMessage, options: SendMessageOption & {
        chatPreset?: ChatPreset;
    }): Promise<ModelResponse>;
}
export declare abstract class BaseTrigger implements Trigger {
    name: string;
    isOneTime?: boolean;
    private triggerExecuted;
    constructor(params: {
        name: string;
        isOneTime?: boolean;
    });
    protected abstract registerImpl(context: ChaiteContext): Promise<void>;
    protected abstract unregisterImpl(): Promise<void>;
    register(context: ChaiteContext): Promise<void>;
    unregister(): Promise<void>;
    protected checkOneTimeAndCleanup(): Promise<boolean>;
    protected triggerAction(action: () => Promise<void>): Promise<void>;
    queryLLM(message: UserMessage, options: SendMessageOption & {
        chatPreset?: ChatPreset;
    }): Promise<ModelResponse>;
}
export declare abstract class CronTrigger extends BaseTrigger {
    protected cronExpression: string;
    protected cronJob?: Job;
    constructor(params: {
        name: string;
        description: string;
        cronExpression: string;
        isOneTime?: boolean;
    });
    protected registerImpl(context: ChaiteContext): Promise<void>;
    protected unregisterImpl(): Promise<void>;
    unregister(): Promise<void>;
    protected abstract execute(context: ChaiteContext): Promise<void>;
}
export declare abstract class EventTrigger extends BaseTrigger {
    protected bot: EventEmitter;
    protected eventName: string;
    protected eventHandler: (...args: any[]) => void;
    private isRegistered;
    constructor(params: {
        id: string;
        name: string;
        description: string;
        eventName: string;
        bot: EventEmitter;
        isOneTime?: boolean;
    });
    register(context: ChaiteContext): Promise<void>;
    unregister(): Promise<void>;
    protected abstract handleEvent(...args: any[]): Promise<void>;
}
