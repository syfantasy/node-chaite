import express, { Request, Response, Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { Chaite, ChaiteResponse } from '../index.js'
import { SqlHistoryManager } from '../storage/sql/history_manager.js'

const router: Router = express.Router()

function getSqlHistoryManager(): SqlHistoryManager | undefined {
  const chaite = Chaite.getInstance()
  const historyManager = chaite?.getHistoryManager()
  if (historyManager instanceof SqlHistoryManager) {
    return historyManager
  }
  return undefined
}

/**
 * GET /api/maintenance/stats
 * 获取历史记录和图片文件统计
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const historyManager = getSqlHistoryManager()
    if (!historyManager) {
      res.status(200).json(ChaiteResponse.ok({
        supported: false,
        totalMessages: 0,
        totalImages: 0,
        imagesSizeBytes: 0,
      }))
      return
    }

    const totalMessages = await historyManager.countHistoryBefore({
      before: new Date().toISOString(),
    }).catch(() => 0)

    let totalImages = 0
    let imagesSizeBytes = 0
    const imagesDir = historyManager.imagesDir
    if (imagesDir && fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir)
      totalImages = files.length
      for (const file of files) {
        try {
          const stat = fs.statSync(path.join(imagesDir, file))
          imagesSizeBytes += stat.size
        } catch {
          // ignore error for single file
        }
      }
    }

    res.status(200).json(ChaiteResponse.ok({
      supported: true,
      totalMessages,
      totalImages,
      imagesSizeBytes,
    }))
  } catch (err: any) {
    res.status(500).json(ChaiteResponse.fail(null, err?.message || 'Failed to get stats'))
  }
})

/**
 * POST /api/maintenance/clean-images
 * 扫描并清理孤立图片（未被任何消息引用的图片）
 */
router.post('/clean-images', async (_req: Request, res: Response) => {
  try {
    const historyManager = getSqlHistoryManager()
    if (!historyManager) {
      res.status(400).json(ChaiteResponse.fail(null, '当前历史存储后端不支持清理孤立图片'))
      return
    }

    const result = await historyManager.cleanupUnusedImages()
    res.status(200).json(ChaiteResponse.ok(result))
  } catch (err: any) {
    res.status(500).json(ChaiteResponse.fail(null, err?.message || 'Failed to cleanup unused images'))
  }
})

/**
 * POST /api/maintenance/prune-history
 * 按天数清理过期历史消息，并可选自动清理孤立图片
 */
router.post('/prune-history', async (req: Request, res: Response) => {
  try {
    const historyManager = getSqlHistoryManager()
    if (!historyManager) {
      res.status(400).json(ChaiteResponse.fail(null, '当前历史存储后端不支持清理历史记录'))
      return
    }

    const days = Number(req.body?.days)
    if (!Number.isFinite(days) || days <= 0) {
      res.status(400).json(ChaiteResponse.fail(null, '保留天数必须大于 0'))
      return
    }

    const before = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const pruneResult = await historyManager.pruneHistory({ before })

    let cleanImagesResult = { deleted: 0, total: 0 }
    if (req.body?.cleanImages !== false) {
      cleanImagesResult = await historyManager.cleanupUnusedImages()
    }

    res.status(200).json(ChaiteResponse.ok({
      prunedMessages: pruneResult.deleted,
      truncated: pruneResult.truncated,
      deletedImages: cleanImagesResult.deleted,
      remainingImages: cleanImagesResult.total - cleanImagesResult.deleted,
    }))
  } catch (err: any) {
    res.status(500).json(ChaiteResponse.fail(null, err?.message || 'Failed to prune history'))
  }
})

export default router
