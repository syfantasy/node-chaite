import { ProcessorDTO, ToolDTO, ToolsGroupDTO, TriggerDTO, } from '../types/index.js';
import { createHttpClient } from '../utils/index.js';
import { CloudAPI } from '../const/index.js';
import { Channel, ChatPreset } from '../channels/index.js';
export class DefaultCloudService {
    constructor(cloudApiBaseUrl, type) {
        this.cloudApiBaseUrl = cloudApiBaseUrl;
        this.client = createHttpClient({
            baseURL: this.cloudApiBaseUrl,
        });
        this.type = type;
    }
    setUser(user) {
        this.user = user;
        this.identifier = user.user_id + '';
        if (user.api_key) {
            this.apiKey = user.api_key;
            this.client.updateOptions({
                headers: {
                    Authorization: 'ApiKey ' + this.apiKey,
                },
            });
        }
    }
    async authenticate(apiKey) {
        const response = await this.client.post(CloudAPI.USER, {
            apiKey,
        }, {
            headers: {
                Authorization: 'ApiKey ' + apiKey,
            },
        });
        this.apiKey = apiKey;
        const user = response.data;
        if (user) {
            this.user = user;
            this.identifier = user.user_id + '';
            this.client.updateOptions({
                headers: {
                    Authorization: 'ApiKey ' + apiKey,
                },
            });
        }
        return user || null;
    }
    async list(filter, query, searchOption) {
        const response = await this.client.post(CloudAPI.LIST[this.type], {
            filter,
            query,
            searchOption,
        });
        const tempInstance = this.createEmptyInstance();
        if (response.data?.items?.length) {
            response.data.items = response.data.items.map(item => {
                return tempInstance.fromString(JSON.stringify(item));
            });
        }
        return response.data;
    }
    createEmptyInstance() {
        const EmptyClass = this.getClassForType();
        return new EmptyClass({});
    }
    getClassForType() {
        switch (this.type) {
            case 'tool':
                return ToolDTO;
            case 'chat-preset':
                return ChatPreset;
            case 'processor':
                return ProcessorDTO;
            case 'channel':
                return Channel;
            case 'tool-group':
                return ToolsGroupDTO;
            case 'trigger':
                return TriggerDTO;
            default:
                throw new Error(`Unknown type: ${this.type}`);
        }
    }
    async upload(model) {
        const response = await this.client.post(CloudAPI.ADD[this.type], model);
        return response.data || null;
    }
    async download(shareId) {
        const response = await this.client.get(CloudAPI.GET[this.type] + shareId);
        return response.data || null;
    }
    async initializeTransfer(model) {
        const response = await this.client.post(CloudAPI.TEMP_SHARE[this.type], {
            time: 5 * 60,
            limit: 1,
            permission: 'any',
            content: model,
        });
        return response.data || null;
    }
    async delete(shareId) {
        const response = await this.client.post(CloudAPI.DELETE[this.type], {
            shareId,
        });
        return response.data || false;
    }
    getUser() {
        return this.user;
    }
}
