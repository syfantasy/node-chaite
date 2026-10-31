import { DocumentFileParser, DocumentPathParser, ParserType } from '../../types/index.js';
export declare class DocxFileParser extends DocumentPathParser {
    constructor();
    type: ParserType;
    supportedExtensions: string[];
    parse(documentPath: string): Promise<string>;
}
export declare class DocxBufferParser extends DocumentFileParser {
    constructor();
    type: ParserType;
    supportedExtensions: string[];
    parse(buffer: Buffer): Promise<string>;
}
