import { Parser, ValidExtension } from '../types/index.js';
/**
 * 文档解析器管理
 */
declare class DocumentParserManager {
    private parsers;
    constructor();
    route<T>(ext: ValidExtension, target: T): Parser<T> | undefined;
    register<T>(parser?: Parser<T>): DocumentParserManager;
}
declare const _default: {
    documentParserManager: DocumentParserManager;
};
export default _default;
