import { DocumentFileParser, DocumentPathParser, ParserType } from '../../types/document.js';
export declare class PdfFileParser extends DocumentPathParser {
    constructor();
    private initPromise;
    valid: boolean;
    type: ParserType;
    supportedExtensions: string[];
    private initializePdfParse;
    ready(): Promise<void>;
    parse(documentPath: string): Promise<string>;
}
export declare class PdfBufferParser extends DocumentFileParser {
    constructor();
    private initPromise;
    private initializePdfParse;
    valid: boolean;
    type: ParserType;
    supportedExtensions: string[];
    ready(): Promise<void>;
    parse(buffer: Buffer): Promise<string>;
}
