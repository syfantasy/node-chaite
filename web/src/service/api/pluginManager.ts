import { request } from '../http'

export interface PluginConfigField {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'textarea' | 'select' | 'button'
  default?: any
  description?: string
  options?: Array<{ label: string; value: any }>
  buttonText?: string
  buttonType?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  action?: string
  group?: 'plugin' | 'common'
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
  return request.Get<{ code: number; data: PluginMeta[]; message: string }>('/api/plugins')
}

export function togglePlugin(id: string, enabled: boolean) {
  return request.Post<{ code: number; message: string }>(`/api/plugins/${id}/toggle`, { enabled })
}

export function savePluginConfig(id: string, config: Record<string, any>) {
  return request.Post<{ code: number; message: string }>(`/api/plugins/${id}/config`, { config })
}

export function fetchPluginCode(id: string) {
  return request.Get<{ code: number; data: { code: string }; message: string }>(`/api/plugins/${id}/code`)
}

export function savePluginCode(id: string, code: string) {
  return request.Post<{ code: number; message: string }>(`/api/plugins/${id}/code`, { code })
}

export function reloadPlugin(id: string) {
  return request.Post<{ code: number; message: string }>(`/api/plugins/${id}/reload`)
}

export function importPlugin(
  type: 'single-file' | 'directory',
  filename: string,
  base64: string,
  overwrite?: boolean,
  customId?: string
) {
  return request.Post<{ code: number; data: { id: string; overwritten?: boolean }; message: string }>('/api/plugins/import', {
    type,
    filename,
    base64,
    overwrite,
    customId,
  })
}

export function deletePlugin(id: string, keepConfig: boolean = true) {
  return request.Post<{ code: number; message: string }>(`/api/plugins/${id}/delete`, { keepConfig })
}

export function resetPluginConfig(id: string) {
  return request.Post<{ code: number; data: { config: Record<string, any> }; message: string }>(`/api/plugins/${id}/reset-config`)
}

export function triggerPluginAction(id: string, action: string, payload?: any) {
  return request.Post<{ code: number; data?: any; message: string }>(`/api/plugins/${id}/action/${action}`, payload || {})
}
