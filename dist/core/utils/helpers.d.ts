import { ChaiteContext, MultipleKeyStrategy } from '../types/common.js';
import { AsyncLocalStorage } from 'async_hooks';
export declare function getKey(apiKeys: string[] | string, strategy: MultipleKeyStrategy): Promise<string>;
export declare const asyncLocalStorage: AsyncLocalStorage<ChaiteContext>;
export declare function useEvent(): Promise<import("src/index.js").EventMessage>;
/**
 * 表示构造函数的类型
 */
type AbstractConstructor<T> = abstract new (...args: unknown[]) => T;
/**
 * 将JS代码保存到指定目录并导入其默认导出
 *
 * @param {string} jsContent - JS代码内容
 * @param {string} modulesDir - 保存模块的目录
 * @param {string} fileName - 文件名（不含路径）
 * @param {Function} AbstractClass - 抽象类，用于检查实例是否继承自它
 * @returns {Promise<T | null>} 如果默认导出继承自AbstractClass则返回该实例，否则返回null
 */
export declare function saveAndLoadModule<T>(jsContent: string, modulesDir: string, fileName: string, AbstractClass: AbstractConstructor<T>): Promise<T | null>;
/**
 * 解析 JavaScript 代码中的 class 变量 name 的值
 * @param {string} code - 输入的 JavaScript 代码
 * @returns {string|null} - 解析出的 class 的 name 值，或者 null 如果没有找到
 */
export declare function extractClassName(code: string): string;
export {};
