import { request } from '../http'

export type MemoryScope = 'group' | 'group_user' | 'private_user'

export interface MemoryRecord {
  id: string
  scope: MemoryScope
  groupId?: string | null
  userId?: string | null
  targetId: string
  key: string
  content: string
  importance: number // 1~100
  updatedAt: number
}

export interface MemoryQueryParams {
  scope?: MemoryScope
  groupId?: string
  userId?: string
  key?: string
  limit?: number
  offset?: number
}

export interface SaveMemoryParams {
  scope: MemoryScope
  groupId?: string | null
  userId?: string | null
  key: string
  content: string
  importance?: number
}

// 记忆 API
export function fetchMemoryGroups() {
  return request.Get<Service.ResponseResult<string[]>>('/api/memories/groups')
}

export function fetchMemories(params: MemoryQueryParams) {
  return request.Get<Service.ResponseResult<MemoryRecord[]>>('/api/memories', {
    params,
  })
}

export function saveMemory(data: SaveMemoryParams) {
  return request.Post<Service.ResponseResult<{ success: boolean; action: string; message: string }>>('/api/memories', data)
}

export function updateMemoryImportance(id: string, importance: number) {
  return request.Put<Service.ResponseResult<{ success: boolean }>>(`/api/memories/${id}/importance`, { importance })
}

export function deleteMemory(id: string) {
  return request.Delete<Service.ResponseResult<{ removed: boolean }>>(`/api/memories/${id}`)
}

// 兼容旧接口定义（防止外部或旧构建报错）
export type GroupFact = any
export type UserMemory = any
export function fetchGroupFacts(_params: any) {
  return request.Get<Service.ResponseResult<any[]>>('/api/memory/user/memories')
}
export function fetchUserMemories(_params: any) {
  return request.Get<Service.ResponseResult<any[]>>('/api/memory/user/memories')
}
export function deleteGroupFact(_groupId: string, _id: string) {
  return Promise.resolve({ data: { removed: true }, error: null } as any)
}
export function deleteUserMemory(_userId: string, _id: string) {
  return Promise.resolve({ data: { removed: true }, error: null } as any)
}
export function deleteMemoryById(id: string) {
  return deleteMemory(id)
}
export function saveGroupFacts(_params: any) {
  return Promise.resolve({ data: {}, error: null } as any)
}
export function queryGroupFacts(_params: any) {
  return Promise.resolve({ data: [], error: null } as any)
}
export function queryUserMemories(_params: any) {
  return Promise.resolve({ data: [], error: null } as any)
}
export function upsertUserMemories(_params: any) {
  return Promise.resolve({ data: { updated: 0 }, error: null } as any)
}
export function fetchMemoryConfig() {
  return request.Get<Service.ResponseResult<any>>('/api/memory/config')
}
export function updateMemoryConfig(config: any) {
  return request.Post<Service.ResponseResult<any>>('/api/memory/config', config)
}
export function fetchSimpleExtensionStatus() {
  return request.Get<Service.ResponseResult<any>>('/api/memory/extensions/simple/status')
}
export function downloadSimpleExtension(params: any) {
  return request.Post<Service.ResponseResult<any>>('/api/memory/extensions/simple/download', params)
}
