import { Server } from 'node:http';
import { AppConfig } from './config.js';
export declare function startWebServer(config: AppConfig): {
    app: any;
    server: Server;
};
