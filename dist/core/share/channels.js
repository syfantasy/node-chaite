import { NonExecutableShareableManager } from './shareable.js';
import { DefaultChannelLoadBalancer } from '../channels/index.js';
import { asyncLocalStorage, getLogger } from '../utils/index.js';
export class ChannelsManager extends NonExecutableShareableManager {
    constructor(storage, loadBalancer = new DefaultChannelLoadBalancer()) {
        super('chat-preset', storage);
        this.storage = storage;
        this.loadBalancer = loadBalancer;
    }
    static async init(storage, loadBalancer) {
        if (ChannelsManager.instance) {
            return ChannelsManager.instance;
        }
        ChannelsManager.instance = new ChannelsManager(storage, loadBalancer);
        return ChannelsManager.instance;
    }
    static async getInstance() {
        if (!ChannelsManager.instance) {
            return null;
        }
        return ChannelsManager.instance;
    }
    async getAllChannels(name) {
        const allChannels = await this.storage.listItems();
        if (name) {
            return allChannels.filter(channel => channel.models.some(m => m.name === name));
        }
        else {
            return allChannels;
        }
    }
    async getChannelByType(type) {
        const allChannels = await this.storage.listItems();
        return allChannels.filter(channel => channel.type === type);
    }
    async getChannelByStatus(status) {
        const allChannels = await this.storage.listItems();
        return allChannels.filter(channel => channel.status === status);
    }
    async getChannelByModel(model) {
        let channels = await this.getAllChannels();
        channels = channels.filter(channel => channel.models.some(m => m.name === model));
        const chaite = asyncLocalStorage.getStore()?.chaite;
        if (chaite?.getGlobalConfig()?.getDebug()) {
            getLogger().debug(`查询所有渠道: ${model} -> ${channels.map(channel => channel.name).join(', ')}`);
        }
        const channel = await this.loadBalancer.getChannel(model, channels);
        if (chaite?.getGlobalConfig()?.getDebug()) {
            getLogger().debug(`选中了渠道: ${model} -> ${channel?.name}`);
        }
        return channel ? [channel] : [];
    }
    async getChannelsByModel(model, totalQuantity) {
        const channels = await this.getAllChannels(model);
        return await this.loadBalancer.getChannels(model, channels, totalQuantity);
    }
}
