// ************** 处理器 **************
import { AbstractShareable } from './cloud.js';
import { PROCESSOR_TYPE_MAP } from '../const/index.js';
export class ProcessorDTO extends AbstractShareable {
    constructor(params) {
        super(params);
        this.modelType = 'executable';
        if (params.type) {
            this.type = params.type;
        }
    }
    fromString(str) {
        return new ProcessorDTO(JSON.parse(str));
    }
    toFormatedString(_verbose) {
        let base = `处理器ID：${this.id}`;
        if (this.name) {
            base += `\n处理器名称：${this.name}`;
        }
        if (this.type) {
            base += `\n类型：${PROCESSOR_TYPE_MAP[this.type]}`;
        }
        if (this.description) {
            base += `\n描述：${this.description}`;
        }
        if (this.createdAt) {
            base += `\n创建时间：${this.createdAt}`;
        }
        if (this.updatedAt) {
            base += `\n最后更新时间：${this.updatedAt}`;
        }
        if (this.uploader?.username) {
            base += `\n上传者：@${this.uploader.username}`;
        }
        return base.trimEnd();
    }
}
/**
 * 继承这个来实现一个前处理器
 */
export class PreProcessor {
}
/**
 * 继承这个来实现一个后处理器
 */
export class PostProcessor {
}
