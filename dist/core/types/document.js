export class DocumentPathParser {
    isCompatibleType(value) {
        return typeof value === 'string';
    }
    parse(document) {
        throw new Error('abstract class');
    }
}
export class DocumentFileParser {
    isCompatibleType(value) {
        return Buffer.isBuffer(value);
    }
    parse(document) {
        throw new Error('abstract class');
    }
}
