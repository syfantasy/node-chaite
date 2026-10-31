import { DocumentFileParser, DocumentPathParser, ParserType } from '../../types/document.js';
export declare class PureTextFileParser extends DocumentPathParser {
    constructor();
    type: ParserType;
    supportedExtensions: string[];
    parse(documentPath: string): Promise<string>;
}
export declare class PureTextBufferParser extends DocumentFileParser {
    constructor();
    type: ParserType;
    supportedExtensions: string[];
    parse(buffer: Buffer): Promise<string>;
}
