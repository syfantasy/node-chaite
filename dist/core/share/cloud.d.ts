import { AbstractShareable, CloudAPIType, CloudSharingService, Filter, PaginationResult, SearchOption, User } from '../types/index.js';
import { HttpClient } from '../utils/index.js';
export declare class DefaultCloudService<T extends AbstractShareable<T>> implements CloudSharingService<T> {
    private cloudApiBaseUrl;
    client: HttpClient;
    type: CloudAPIType;
    user: User;
    identifier: string;
    apiKey: string;
    constructor(cloudApiBaseUrl: string, type: CloudAPIType);
    setUser(user: User): void;
    authenticate(apiKey: string): Promise<User | null>;
    list(filter: Filter, query: string, searchOption: SearchOption): Promise<PaginationResult<T>>;
    private createEmptyInstance;
    private getClassForType;
    upload(model: T): Promise<T | null>;
    download(shareId: string): Promise<T | null>;
    initializeTransfer(model: T): Promise<string | null>;
    delete(shareId: string): Promise<boolean>;
    getUser(): User | null;
}
