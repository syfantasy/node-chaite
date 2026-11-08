class IntoChaiteConverterEntry {
}
const converters = new IntoChaiteConverterEntry();
export function registerIntoChaiteConverter(_clientType, converter) {
    switch (_clientType) {
        case 'openai': {
            converters.openai = converter;
            break;
        }
        case 'gemini': {
            converters.gemini = converter;
            break;
        }
        case 'claude': {
            converters.claude = converter;
            break;
        }
        case 'deepseek': {
            converters.deepseek = converter;
            break;
        }
    }
}
export function getIntoChaiteConverter(_clientType) {
    switch (_clientType) {
        case 'openai': {
            return converters.openai;
        }
        case 'gemini': {
            return converters.gemini;
        }
        case 'claude': {
            return converters.claude;
        }
        case 'deepseek': {
            return converters.deepseek;
        }
    }
}
class FromChaiteConverterEntry {
}
const fromConverters = new FromChaiteConverterEntry();
export function registerFromChaiteConverter(_clientType, converter) {
    switch (_clientType) {
        case 'openai': {
            fromConverters.openai = converter;
            break;
        }
        case 'gemini': {
            fromConverters.gemini = converter;
            break;
        }
        case 'claude': {
            fromConverters.claude = converter;
            break;
        }
        case 'deepseek': {
            fromConverters.deepseek = converter;
            break;
        }
    }
}
export function getFromChaiteConverter(_clientType) {
    switch (_clientType) {
        case 'openai': {
            return fromConverters.openai;
        }
        case 'gemini': {
            return fromConverters.gemini;
        }
        case 'claude': {
            return fromConverters.claude;
        }
        case 'deepseek': {
            return fromConverters.deepseek;
        }
    }
}
class FromChaiteToolConverterEntry {
}
const fromToolConverters = new FromChaiteToolConverterEntry();
export function registerFromChaiteToolConverter(_clientType, converter) {
    switch (_clientType) {
        case 'openai': {
            fromToolConverters.openai = converter;
            break;
        }
        case 'gemini': {
            fromToolConverters.gemini = converter;
            break;
        }
        case 'claude': {
            fromToolConverters.claude = converter;
            break;
        }
        case 'deepseek': {
            fromToolConverters.deepseek = converter;
            break;
        }
    }
}
export function getFromChaiteToolConverter(_clientType) {
    switch (_clientType) {
        case 'openai': {
            return fromToolConverters.openai;
        }
        case 'gemini': {
            return fromToolConverters.gemini;
        }
        case 'claude': {
            return fromToolConverters.claude;
        }
        case 'deepseek': {
            return fromToolConverters.deepseek;
        }
    }
}
