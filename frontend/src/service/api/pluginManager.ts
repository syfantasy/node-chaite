import { request } from '../http'

export interface PluginConfigField {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'textarea' | 'select'
  default?: any
  description?: string
  options?: Array<{ label: string; value: any }>
}

export interface PluginMeta {
  id: string
  name: string
  version?: string
  description?: string
  author?: string
  type: 'single-file' | 'directory'
  enabled: boolean
  entryPath: string
  configSchema?: PluginConfigField[]
  config?: Record<string, any>
}

export function fetchPlugins() {
  return request.Get<Service.ResponseResult<PluginMeta[]>>('/api/plugins')
}

export function togglePlugin(id: string, enabled: boolean) {
  return request.Post<Service.ResponseResult<{ success: boolean }>>(`/api/plugins/${id}/toggle`, { enabled })
}

export function savePluginConfig(id: string, config: Record<string, any>) {
  return request.Post<Service.ResponseResult<{ success: boolean }>>(`/api/plugins/${id}/config`, config)
}

export function fetchPluginCode(id: string) {
  return request.Get<Service.ResponseResult<{ code: string }>>(`/api/plugins/${id}/code`)
}

export function savePluginCode(id: string, code: string) {
  return request.Post<Service.ResponseResult<{ success: boolean }>>(`/api/plugins/${id}/code`, { code })
}

export function reloadPlugin(id: string) {
  return request.Post<Service.ResponseResult<{ success: boolean }>>(`/api/plugins/${id}/reload`, {})
}
