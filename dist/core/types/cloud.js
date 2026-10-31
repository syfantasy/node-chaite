export class AbstractShareable {
    constructor(params) {
        if (params) {
            if (params.id) {
                this.id = params.id;
            }
            if (params.name) {
                this.name = params.name;
            }
            if (params.embedded) {
                this.embedded = params.embedded;
            }
            if (params.uploader) {
                this.uploader = params.uploader;
            }
            if (params.createdAt) {
                this.createdAt = params.createdAt;
            }
            if (params.updatedAt) {
                this.updatedAt = params.updatedAt;
            }
            if (params.cloudId) {
                this.cloudId = params.cloudId;
            }
            if (params.description) {
                this.description = params.description;
            }
            if (params.modelType) {
                this.modelType = params.modelType;
            }
            if (params.code) {
                this.code = params.code;
            }
            if (params.md5) {
                this.md5 = params.md5;
            }
        }
    }
    fromString(str) {
        return JSON.parse(str);
    }
    toString() {
        return JSON.stringify(this);
    }
    toFormatedString(verbose) {
        return JSON.stringify(this, null, 2);
    }
}
