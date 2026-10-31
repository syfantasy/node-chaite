import EventEmitter from 'node:events';
import { OneBotActionResponse, OneBotSegment } from './types.js';
export interface OneBotClientOptions {
    url: string;
    accessToken?: string;
    reconnectInterval?: number;
}
export declare class OneBotClient extends EventEmitter {
    private ws;
    private options;
    private echoCounter;
    private pendingCalls;
    private isClosedManually;
    selfId: number;
    constructor(options: OneBotClientOptions);
    connect(): void;
    close(): void;
    private handleIncoming;
    callAction<T = unknown>(action: string, params?: Record<string, unknown>, timeoutMs?: number): Promise<OneBotActionResponse<T>>;
    private rejectAllPending;
    sendGroupMsg(groupId: number, message: OneBotSegment[] | string): Promise<any>;
    sendPrivateMsg(userId: number, message: OneBotSegment[] | string): Promise<any>;
    sendMsg(params: {
        message_type: 'group' | 'private';
        group_id?: number;
        user_id?: number;
        message: OneBotSegment[] | string;
    }): Promise<any>;
    sendForwardMsg(params: {
        message_type: 'group' | 'private';
        group_id?: number;
        user_id?: number;
        messages: Array<{
            type: 'node';
            data: {
                name: string;
                uin: string | number;
                content: OneBotSegment[] | string;
            };
        }>;
    }): Promise<any>;
}
