import path from 'node:path'
import { PluginManager } from './manager'

const defaultPluginsDir = path.resolve(process.cwd(), 'plugins')
export const pluginManager = new PluginManager(defaultPluginsDir)

export * from './types'
export { PluginManager }
