import { DefaultLogger, ILogger } from '../types/common.js'
import { asyncLocalStorage } from './helpers.js'

export function getLogger (): ILogger {
  const chaite = asyncLocalStorage.getStore()?.chaite
  return chaite?.getLogger() || DefaultLogger
}
