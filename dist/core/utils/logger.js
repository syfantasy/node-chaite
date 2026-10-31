import { DefaultLogger } from '../types/common.js';
import { asyncLocalStorage } from './helpers.js';
export function getLogger() {
    const chaite = asyncLocalStorage.getStore()?.chaite;
    return chaite?.getLogger() || DefaultLogger;
}
