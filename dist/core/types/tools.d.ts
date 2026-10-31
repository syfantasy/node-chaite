import { ArgumentValue } from './models.js';
import { AbstractShareable } from './cloud.js';
import { ChaiteContext } from './common.js';
export interface Function {
    name: string;
    description: string;
    parameters: Parameter;
}
export interface Parameter {
    type: 'object';
    properties: Record<string, Property>;
    required: string[];
}
export interface Property {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string | null;
    enum?: string[];
    /** Required by Gemini for array-typed parameters. */
    items?: Property;
    properties?: Record<string, Property>;
    required?: string[];
}
export interface Tool {
    name: Function['name'];
    type: 'function';
    function: Function;
    run(args: Record<string, ArgumentValue | Record<string, ArgumentValue>>, chaiteContext?: ChaiteContext): Promise<string>;
}
export declare class ToolDTO extends AbstractShareable<ToolDTO> {
    constructor(params: Partial<ToolDTO>);
    status: 'enabled' | 'disabled';
    permission: 'public' | 'private' | 'onetime';
    extraData?: Record<string, any>;
    config?: Record<string, any>;
    toFormatedString(_verbose?: boolean): string;
    fromString(str: string): ToolDTO;
}
/**
 * 工具组，与若干个工具关联
 */
export interface ToolsGroup {
    id: string;
    name: string;
    description: string;
    toolIds: string[];
    isDefault?: boolean;
}
export declare class ToolsGroupDTO extends AbstractShareable<ToolsGroupDTO> implements ToolsGroup {
    constructor(params: Partial<ToolsGroupDTO>);
    toolIds: string[];
    isDefault?: boolean | undefined;
    toFormatedString(_verbose?: boolean): string;
}
/**
 * js写的工具可以继承这个抽象类
 */
export declare abstract class CustomTool implements Tool {
    constructor();
    type: "function";
    config?: Record<string, any>;
    function: Function;
    run(_args: Record<string, ArgumentValue | Record<string, ArgumentValue>>, _context?: ChaiteContext): Promise<string>;
    name: Function['name'];
}
