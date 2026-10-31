import { NonExecutableShareableManager } from './shareable.js';
import { Channel } from '../channels/index.js';
import { BasicStorage, ChannelsLoadBalancer } from '../types/index.js';
export declare class ChannelsManager extends NonExecutableShareableManager<Channel> {
    protected storage: BasicStorage<Channel>;
    private loadBalancer;
    private static instance;
    private constructor();
    static init(storage: BasicStorage<Channel>, loadBalancer: ChannelsLoadBalancer): Promise<ChannelsManager>;
    static getInstance(): Promise<ChannelsManager | null>;
    getAllChannels(name?: string): Promise<Channel[]>;
    getChannelByType(type: Channel['type']): Promise<Channel[]>;
    getChannelByStatus(status: 'enabled' | 'disabled'): Promise<Channel[]>;
    getChannelByModel(model: string): Promise<Channel[]>;
    getChannelsByModel(model: string, totalQuantity: number): Promise<{
        channel: Channel;
        quantity: number;
    }[]>;
}
