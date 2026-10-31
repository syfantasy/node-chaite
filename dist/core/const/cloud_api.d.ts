import { CloudAPIType } from '../types/index.js';
export declare const CloudAPI: Record<'USER', string> & Record<'LIST' | 'ADD' | 'GET' | 'TEMP_SHARE' | 'DELETE', Record<CloudAPIType, string>>;
