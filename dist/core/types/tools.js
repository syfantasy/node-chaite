import { AbstractShareable } from './cloud.js';
import { ChaiteContext } from './common.js';
export class ToolDTO extends AbstractShareable {
    constructor(params) {
        super(params);
        this.modelType = 'executable';
        this.permission = params.permission || 'private';
        this.status = params.status || 'enabled';
        this.extraData = params.extraData;
        this.config = params.config || params.extraData?.config || {};
    }
    toFormatedString(_verbose) {
        let base = `ID: ${this.id}\n工具名称：${this.name}`;
        if (this.description) {
            base += `\n工具描述：${this.description}`;
        }
        if (this.permission) {
            base += `\n权限：${this.permission}`;
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
    fromString(str) {
        return new ToolDTO(JSON.parse(str));
    }
}
export class ToolsGroupDTO extends AbstractShareable {
    constructor(params) {
        super(params);
        this.modelType = 'settings';
        // AbstractShareable 只搬它自己认识的字段，这两个是 ToolsGroupDTO 独有的。
        // 漏掉的话 new ToolsGroupDTO({ toolIds }) 出来的对象 toolIds 永远是 undefined，
        // 工具组等于形同虚设。
        this.toolIds = params.toolIds || [];
        this.isDefault = params.isDefault;
    }
    toFormatedString(_verbose) {
        let base = `工具组名称：${this.name}`;
        if (this.description) {
            base += `\n工具组描述：${this.description}`;
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
 * js写的工具可以继承这个抽象类
 */
export class CustomTool {
    constructor() {
        this.type = 'function';
        this.function = {
            name: '',
            description: '',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
            },
        };
        if (!this.name) {
            this.name = this.function.name;
        }
    }
    async run(_args, _context = new ChaiteContext()) {
        throw new Error('Not implemented');
    }
}
