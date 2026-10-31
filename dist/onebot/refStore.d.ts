export type RefType = 'voice' | 'forward' | 'image' | 'video' | 'file';
export interface BaseRefData {
    id: string;
    ref: string;
    type: RefType;
    createdAt: number;
    groupId?: number | string;
    senderId?: number | string;
    messageId?: number | string;
}
export interface VoiceRefData extends BaseRefData {
    type: 'voice';
    file?: string;
    url?: string;
    duration?: number;
}
export interface ForwardRefData extends BaseRefData {
    type: 'forward';
    forwardId: string;
    summary?: string;
    messagesCount?: number;
    previewMessages?: Array<{
        senderName: string;
        time?: string;
        text: string;
    }>;
}
export interface ImageRefData extends BaseRefData {
    type: 'image';
    url?: string;
    file?: string;
    base64?: string;
    mimeType?: string;
}
export interface VideoRefData extends BaseRefData {
    type: 'video';
    file?: string;
    url?: string;
    name?: string;
    ext?: string;
    fileSize?: number;
}
export interface FileRefData extends BaseRefData {
    type: 'file';
    file?: string;
    fileId?: string;
    url?: string;
    name?: string;
    ext?: string;
    fileSize?: number;
}
export type RefData = VoiceRefData | ForwardRefData | ImageRefData | VideoRefData | FileRefData | BaseRefData;
declare class MediaRefStore {
    private store;
    private maxItems;
    private ttlMs;
    private generateShortId;
    saveVoice(data: Omit<VoiceRefData, 'id' | 'ref' | 'type' | 'createdAt'>): string;
    saveForward(data: Omit<ForwardRefData, 'id' | 'ref' | 'type' | 'createdAt'>): string;
    saveImage(data: Omit<ImageRefData, 'id' | 'ref' | 'type' | 'createdAt'>): string;
    saveVideo(data: Omit<VideoRefData, 'id' | 'ref' | 'type' | 'createdAt'>): string;
    saveFile(data: Omit<FileRefData, 'id' | 'ref' | 'type' | 'createdAt'>): string;
    /**
     * Resolve media (video, file, etc.) downloadable URL or local path
     */
    resolveMedia(ref: string, onebotClient?: any): Promise<{
        url?: string;
        file?: string;
        name?: string;
        ext?: string;
    } | null>;
    get(ref: string): RefData | undefined;
    /**
     * Resolve an image ref to base64 data and mimeType, caching results in memory
     */
    resolveImage(ref: string, onebotClient?: any): Promise<{
        base64: string;
        mimeType: string;
    } | null>;
    private cleanup;
}
export declare const mediaRefStore: MediaRefStore;
export {};
