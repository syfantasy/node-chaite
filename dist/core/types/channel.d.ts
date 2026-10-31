import { DeSerializable, Serializable } from './cloud.js';
import { Channel } from '../channels/index.js';
export declare class ChannelStatistics implements Serializable, DeSerializable<ChannelStatistics> {
    callTimes?: number;
    useToken?: number;
    perModel: Record<string, Omit<ChannelStatistics, 'perModel'>>;
    fromString(str: string): ChannelStatistics;
    toString(): string;
}
export interface ChannelsLoadBalancer {
    getChannel(model: string, channels: Channel[]): Promise<Channel | null>;
    getChannels(model: string, channels: Channel[], totalQuantity: number): Promise<{
        channel: Channel;
        quantity: number;
    }[]>;
}
