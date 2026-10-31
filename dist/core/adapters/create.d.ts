import { BaseClientOptions, ChaiteContext, ClientType, IClient } from '../types/index.js';
export declare function createClient(name: ClientType, options: BaseClientOptions | Partial<BaseClientOptions>, context?: ChaiteContext): IClient;
