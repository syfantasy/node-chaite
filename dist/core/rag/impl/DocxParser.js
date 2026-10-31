import { DocumentFileParser, DocumentPathParser } from '../../types/index.js';
import mammoth from 'mammoth';
export class DocxFileParser extends DocumentPathParser {
    constructor() {
        super();
        this.type = 'docx';
        this.supportedExtensions = ['docx'];
    }
    async parse(documentPath) {
        const raw = await mammoth.extractRawText({
            path: documentPath,
        });
        return raw.value;
    }
}
export class DocxBufferParser extends DocumentFileParser {
    constructor() {
        super();
        this.type = 'docx';
        this.supportedExtensions = ['docx'];
    }
    async parse(buffer) {
        const raw = await mammoth.extractRawText({
            buffer,
        });
        return raw.value;
    }
}
