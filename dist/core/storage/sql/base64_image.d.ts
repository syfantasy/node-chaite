/**
 * 判断是不是图片数据，但不用正则。
 *
 * V8 的正则引擎在超长字符串上可能把自己的栈撑爆——尤其是非法字符出现在靠近
 * 末尾的位置时，而这里的输入可能是几 MB 的 Base64。
 *
 * 行为刻意保持宽松，和改造前一致：若干个 Base64 字母表字符，末尾最多两个补位号。
 */
export declare function isBase64Image(value: unknown): boolean;
