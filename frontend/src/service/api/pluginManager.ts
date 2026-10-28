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
  return request.get<{ code: number; data: PluginMeta[]; message: string }>('/plugins')
}

export function togglePlugin(id: string, enabled: boolean) {
  return request.post<{ code: number; message: string }>(`/plugins/${id}/toggle`, { enabled })
}

export function savePluginConfig(id: string, config: Record<string, any>) {
  return request.post<{ code: number; message: string }>(`/plugins/${id}/config`, { config })
}

export function fetchPluginCode(id: string) {
  return request.get<{ code: number; data: { code: string }; message: string }>(`/plugins/${id}/code`)
}

export function savePluginCode(id: string, code: string) {
  return request.post<{ code: number; message: string }>(`/plugins/${id}/code`, { code })
}

export function reloadPlugin(id: string) {
  return request.post<{ code: number; message: string }>(`/plugins/${id}/reload`)
}

export function importPlugin(type: 'single-file' | 'directory', filename: string, base64: string) {
  return request.post<{ code: number; data: { id: string }; message: string }>('/plugins/import', {
    type,
    filename,
    base64,
  })
}
