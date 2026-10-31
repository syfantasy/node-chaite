import { type Application } from 'express';
import type { Server } from 'node:http';
export interface ApiServerOptions {
    /** Directory containing the built management panel (index.html + assets). */
    frontendDir?: string;
}
export declare function createApp(configure?: (app: Application) => void, options?: ApiServerOptions): Application;
export declare function runServer(host: string, port: number, configure?: (app: Application) => void, options?: ApiServerOptions): {
    app: Application;
    server: Server;
};
