import { request } from '../http'

export interface MaintenanceStats {
  supported: boolean
  totalMessages: number
  totalImages: number
  imagesSizeBytes: number
}

export interface CleanImagesResult {
  deleted: number
  total: number
}

export interface PruneHistoryResult {
  prunedMessages: number
  truncated: boolean
  deletedImages: number
  remainingImages: number
}

export function fetchMaintenanceStats() {
  return request.Get<Service.ResponseResult<MaintenanceStats>>('/api/maintenance/stats')
}

export function cleanUnusedImages() {
  return request.Post<Service.ResponseResult<CleanImagesResult>>('/api/maintenance/clean-images')
}

export function pruneHistory(days: number, cleanImages = true) {
  return request.Post<Service.ResponseResult<PruneHistoryResult>>('/api/maintenance/prune-history', {
    days,
    cleanImages,
  })
}
