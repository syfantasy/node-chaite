export type ParserType = 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'txt' | 'other';
type TypePredicate<T> = (value: unknown) => value is T;
export interface Parser<T> {
    type: ParserType;
    supportedExtensions: ValidExtension[];
    isCompatibleType: TypePredicate<T>;
    parse(document: T): Promise<string>;
}
export type ValidExtension = `.${string}` | string;
export type FilePath = `${string}${ValidExtension}`;
export declare class DocumentPathParser implements Parser<FilePath> {
    isCompatibleType(value: unknown): value is string;
    supportedExtensions: ValidExtension[];
    type: ParserType;
    parse(document: FilePath): Promise<string>;
}
export declare class DocumentFileParser implements Parser<Buffer> {
    isCompatibleType(value: unknown): value is Buffer;
    supportedExtensions: ValidExtension[];
    type: ParserType;
    parse(document: Buffer): Promise<string>;
}
export {};
