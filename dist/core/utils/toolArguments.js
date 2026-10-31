export function parseToolArguments(value, name = '') {
    let input = value;
    try {
        if (typeof input === 'string')
            input = input.trim() ? JSON.parse(input) : {};
    }
    catch {
        throw new Error(`工具 ${name} 的参数不是有效 JSON`);
    }
    if (input === undefined)
        input = {};
    if (!input || typeof input !== 'object' || Array.isArray(input))
        throw new Error(`工具 ${name} 的参数必须是 JSON 对象`);
    return input;
}
