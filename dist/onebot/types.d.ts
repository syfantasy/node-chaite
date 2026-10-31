export interface OneBotSegmentText {
    type: 'text';
    data: {
        text: string;
    };
}
export interface OneBotSegmentAt {
    type: 'at';
    data: {
        qq: string | number;
    };
}
export interface OneBotSegmentImage {
    type: 'image';
    data: {
        file: string;
        url?: string;
    };
}
export interface OneBotSegmentReply {
    type: 'reply';
    data: {
        id: string | number;
    };
}
export type OneBotSegment = OneBotSegmentText | OneBotSegmentAt | OneBotSegmentImage | OneBotSegmentReply | {
    type: string;
    data: Record<string, unknown>;
};
export interface OneBotSender {
    user_id: number;
    nickname: string;
    card?: string;
    role?: 'owner' | 'admin' | 'member';
    title?: string;
    level?: string | number;
    sex?: string;
}
export interface OneBotMessageEvent {
    time: number;
    self_id: number;
    post_type: 'message';
    message_type: 'group' | 'private';
    sub_type: 'normal' | 'anonymous' | 'notice' | 'friend' | 'group';
    message_id: number;
    real_id?: number;
    user_id: number;
    group_id?: number;
    message: OneBotSegment[];
    raw_message: string;
    font: number;
    sender: OneBotSender;
}
export interface OneBotMetaEvent {
    time: number;
    self_id: number;
    post_type: 'meta_event';
    meta_event_type: 'lifecycle' | 'heartbeat';
    sub_type?: string;
}
export type OneBotEvent = OneBotMessageEvent | OneBotMetaEvent | Record<string, unknown>;
export interface OneBotActionResponse<T = unknown> {
    status: 'ok' | 'failed';
    retcode: number;
    data: T;
    message?: string;
    echo?: string;
}
