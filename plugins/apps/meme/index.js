import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

export const name = '表情包制作 (meme)'
export const version = '1.0.0'
export const description = '移植自 meme-generator，支持丰富的群聊表情包生成、列表查询及随机群友表情'

const PROTECT_KEYS = ['lash', 'do', 'beat_up', 'little_do']
const MIN_IMAGE_BYTES = 512
const RANDOM_MEME_ALIASES = {
  '咖波锤打': '咖波捶打'
}

function escapeRegExp(val) {
  return String(val).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function detectImageExtension(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg'
  if (buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))) return 'gif'
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp'
  return null
}

export default async function setup(ctx) {
  const logger = ctx.logger
  const getCfg = () => ({
    baseUrl: 'https://meme-generatoe-sha.onrender.com',
    forceSharp: false,
    reply: true,
    masterProtectDo: true,
    maxFileSize: 10,
    pageSize: 200,
    ...(ctx.config || {})
  })

  const memeDataDir = path.resolve(process.cwd(), 'data/memes')
  if (!fs.existsSync(memeDataDir)) {
    fs.mkdirSync(memeDataDir, { recursive: true })
  }

  let infos = {}
  let keyMap = {}
  let sortedKeywords = []
  let metadataTask = null

  function readJson(file) {
    if (!fs.existsSync(file)) return null
    try {
      const txt = fs.readFileSync(file, 'utf8')
      const obj = JSON.parse(txt)
      if (obj && typeof obj === 'object' && Object.keys(obj).length > 0) return obj
    } catch {}
    return null
  }

  function writeJson(file, data) {
    try {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')
    } catch (err) {
      logger.warn(`写入缓存失败: ${file}`, err.message)
    }
  }

  // 从本地缓存同步初始数据
  const cachedInfos = readJson(path.join(memeDataDir, 'infos.json'))
  const cachedKeyMap = readJson(path.join(memeDataDir, 'keyMap.json'))
  if (cachedInfos && cachedKeyMap) {
    infos = cachedInfos
    keyMap = cachedKeyMap
    sortedKeywords = Object.keys(keyMap).sort((a, b) => b.length - a.length)
  }

  async function updateMetadata(force = false) {
    const cfg = getCfg()
    const baseUrl = cfg.baseUrl.replace(/\/+$/, '')
    logger.info(`正在${force ? '强制刷新' : '同步'} meme 远程元数据...`)

    try {
      const [remoteInfos, remoteKeyMap] = await Promise.all([
        fetch(`${baseUrl}/memes/static/infos.json`).then(r => r.ok ? r.json() : null),
        fetch(`${baseUrl}/memes/static/keyMap.json`).then(r => r.ok ? r.json() : null)
      ])

      if (remoteInfos && remoteKeyMap && Object.keys(remoteInfos).length > 0) {
        infos = remoteInfos
        keyMap = remoteKeyMap
        sortedKeywords = Object.keys(keyMap).sort((a, b) => b.length - a.length)
        writeJson(path.join(memeDataDir, 'infos.json'), infos)
        writeJson(path.join(memeDataDir, 'keyMap.json'), keyMap)
        logger.info(`元数据更新完成，共加载 ${Object.keys(infos).length} 个表情包`)
        return true
      }
    } catch (err) {
      logger.warn(`快速拉取静态元数据失败，尝试通过 keys 接口重建: ${err.message}`)
    }

    try {
      const res = await fetch(`${baseUrl}/memes/keys`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const keys = await res.json()
      if (!Array.isArray(keys) || keys.length === 0) throw new Error('Key 列表为空')

      const newInfos = {}
      const newKeyMap = {}
      const batchSize = 10
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize)
        await Promise.all(batch.map(async (k) => {
          try {
            const r = await fetch(`${baseUrl}/memes/${k}/info`)
            if (r.ok) {
              const info = await r.json()
              newInfos[k] = info
              if (Array.isArray(info.keywords)) {
                for (const kw of info.keywords) newKeyMap[kw] = k
              }
            }
          } catch {}
        }))
      }

      if (Object.keys(newInfos).length > 0) {
        infos = newInfos
        keyMap = newKeyMap
        sortedKeywords = Object.keys(keyMap).sort((a, b) => b.length - a.length)
        writeJson(path.join(memeDataDir, 'infos.json'), infos)
        writeJson(path.join(memeDataDir, 'keyMap.json'), keyMap)
        logger.info(`通过 keys 接口重建完成，共加载 ${Object.keys(infos).length} 个表情`)
        return true
      }
    } catch (err) {
      logger.error('元数据更新彻底失败:', err.message)
      return false
    }
    return false
  }

  async function ensureMetadata() {
    if (Object.keys(infos).length > 0 && Object.keys(keyMap).length > 0) return true
    if (!metadataTask) {
      metadataTask = updateMetadata(false).finally(() => { metadataTask = null })
    }
    await metadataTask
    return Object.keys(infos).length > 0
  }

  // 每天凌晨 3 点自动更新
  ctx.cron('0 3 * * *', async () => {
    logger.info('触发定时更新 meme 元数据...')
    await updateMetadata(true)
  })

  // 异步初始拉取（如果缓存为空）
  if (Object.keys(infos).length === 0) {
    ensureMetadata().catch(() => {})
  }

  // 辅助：获取主人的 QQ 列表
  function getMasterQQList() {
    try {
      const globalCfg = globalThis.chaiteConfig
      if (globalCfg?.management?.masterUsers) {
        return globalCfg.management.masterUsers.map(String)
      }
    } catch {}
    return []
  }

  // 辅助：从消息中提取图片、被回复消息等
  async function resolveInputImages(e, info) {
    const images = []
    const rawMsg = e.raw?.message || []

    // 1. 被回复的消息中的图片
    let replyId = null
    if (Array.isArray(rawMsg)) {
      const replySeg = rawMsg.find(s => s.type === 'reply')
      if (replySeg?.data?.id) replyId = replySeg.data.id
    }

    const caller = e.callAction ? e.callAction.bind(e) : ctx.client?.callAction
    if (replyId && caller) {
      try {
        const msgRes = await caller('get_msg', { message_id: Number(replyId) })
        const replySegments = msgRes?.data?.message || []
        for (const seg of replySegments) {
          if (seg.type === 'image' && (seg.data?.url || seg.data?.file)) {
            images.push(seg.data.url || seg.data.file)
          }
        }
      } catch (err) {
        logger.debug('获取引用回复图片失败:', err.message)
      }
    }

    // 2. 当前消息中附带的图片
    if (images.length === 0 && Array.isArray(e.images) && e.images.length > 0) {
      for (const img of e.images) {
        if (img.url) images.push(img.url)
      }
    }

    // 3. @ 提及的用户头像
    if (images.length === 0 && Array.isArray(rawMsg)) {
      const atSegs = rawMsg.filter(s => s.type === 'at' && s.data?.qq && s.data.qq !== 'all')
      for (const at of atSegs) {
        images.push(`https://q1.qlogo.cn/g?b=qq&s=640&nk=${at.data.qq}`)
      }
    }

    // 4. 发送者自身头像（缺省或不足时兜底）
    const senderAvatar = `https://q1.qlogo.cn/g?b=qq&s=640&nk=${e.userId}`
    if (images.length === 0) {
      images.push(senderAvatar)
    } else if (images.length < (info.params_type?.min_images || 1) && !images.includes(senderAvatar)) {
      images.unshift(senderAvatar)
    }

    // 5. 主人保护：如果对主人发起撅/锤等动作，反噬
    const cfg = getCfg()
    if (cfg.masterProtectDo && PROTECT_KEYS.includes(info.key)) {
      const masters = getMasterQQList()
      if (masters.length > 0) {
        if (images.length === 1) {
          const match = images[0].match(/nk=(\d+)/)
          if (match && masters.includes(match[1])) {
            images[0] = senderAvatar
          }
        } else if (images.length >= 2) {
          const match = images[1].match(/nk=(\d+)/)
          if (match && masters.includes(match[1])) {
            images[1] = senderAvatar
          }
        }
      }
    }

    return images.slice(0, info.params_type?.max_images || 1)
  }

  // 辅助：处理扩展参数 (handleArgs)
  function buildMemeArgs(info, rawArgs, userInfos) {
    const argsObj = {}
    const argsType = info.params_type?.args_type
    if (argsType) {
      const argsModel = argsType.args_model
      const parserOptions = argsType.parser_options || []
      const trimmedArg = (rawArgs || '').trim()

      for (const prop in argsModel?.properties) {
        if (prop === 'user_infos') continue
        const propInfo = argsModel.properties[prop]
        const relatedOpts = parserOptions.filter(opt =>
          opt.dest === prop || (opt.args && opt.args.some(a => a.name === prop))
        )

        if (propInfo.enum && relatedOpts.length > 0) {
          const valueMap = {}
          relatedOpts.forEach(opt => {
            if (opt.action?.type === 0 && Array.isArray(opt.names)) {
              opt.names.forEach(n => {
                if (!/^-/.test(n)) valueMap[n] = opt.action.value
                else if (n.startsWith('--')) valueMap[n.slice(2)] = opt.action.value
              })
            }
          })
          argsObj[prop] = valueMap[trimmedArg] || propInfo.default
        } else if (propInfo.type === 'integer' || propInfo.type === 'number') {
          if (/^\d+$/.test(trimmedArg)) {
            argsObj[prop] = parseInt(trimmedArg, 10)
          }
        }
      }
    }

    argsObj.user_infos = userInfos.map(u => ({
      name: (u.name || '').replace(/^@/, ''),
      gender: u.gender || 'unknown'
    }))

    return JSON.stringify(argsObj)
  }

  // 辅助：生成详情说明
  function renderMemeDetail(info) {
    const p = info.params_type || {}
    let res = `【表情】${info.key}\n`
    res += `【关键词】${(info.keywords || []).join('、')}\n`
    res += `【图片要求】${p.min_images || 0} ~ ${p.max_images || 0} 张\n`
    res += `【文字要求】${p.min_texts || 0} ~ ${p.max_texts || 0} 段\n`
    if (p.default_texts && p.default_texts.length > 0) {
      res += `【默认文字】${p.default_texts.join('/')}\n`
    }
    return res.trim()
  }

  // 核心制作方法
  async function generateMeme(e, targetKeyword, restText) {
    await ensureMetadata()
    const targetCode = keyMap[targetKeyword]
    const info = infos[targetCode]
    if (!info) return false

    const p = info.params_type || {}
    let [mainText, customArgs = ''] = (restText || '').split('#')
    mainText = mainText.trim()

    // 检查“详情”或“帮助”后缀
    if (mainText === '详情' || mainText === '帮助') {
      await e.reply(renderMemeDetail(info))
      return true
    }

    // 如果该表情不需要任何文字，但输入了文字且未带 #，则放行给后续 AI
    if (mainText && p.max_texts === 0) {
      return false
    }

    const cfg = getCfg()
    const formData = new FormData()

    // 1. 处理图片
    if ((p.max_images || 0) > 0) {
      const imgUrls = await resolveInputImages(e, info)
      for (let i = 0; i < imgUrls.length; i++) {
        const u = imgUrls[i]
        try {
          const resp = await fetch(u)
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
          const buf = Buffer.from(await resp.arrayBuffer())
          if (buf.length > (cfg.maxFileSize * 1024 * 1024)) {
            await e.reply(`图片过大，上限 ${cfg.maxFileSize}MB`)
            return true
          }
          formData.append('images', new File([buf], `image_${i}.jpg`, { type: 'image/jpeg' }))
        } catch (err) {
          logger.error(`下载制作图片失败 (${u}):`, err.message)
          await e.reply(`下载制作图片失败: ${err.message}`)
          return true
        }
      }
    }

    // 2. 处理文字
    if (!mainText && (p.min_texts || 0) > 0) {
      mainText = e.sender.card || e.sender.nickname || ''
    }

    if (mainText) {
      const texts = mainText.split('/').map(t => t.trim()).slice(0, p.max_texts || 10)
      if (texts.length < (p.min_texts || 0)) {
        await e.reply(`该表情至少需要 ${p.min_texts} 段文字（请用 / 隔开）`)
        return true
      }
      for (const t of texts) formData.append('texts', t)
    } else if ((p.min_texts || 0) > 0) {
      await e.reply(`该表情需要文字喵！如：${targetKeyword} 文字内容`)
      return true
    }

    // 3. 处理用户信息与 args
    const userInfos = [{
      name: e.sender.card || e.sender.nickname || '用户',
      gender: 'unknown'
    }]
    const builtArgs = buildMemeArgs(info, customArgs, userInfos)
    if (builtArgs) {
      formData.set('args', builtArgs)
    }

    // 4. 调用接口生成
    const baseUrl = cfg.baseUrl.replace(/\/+$/, '')
    try {
      const resp = await fetch(`${baseUrl}/memes/${targetCode}/`, {
        method: 'POST',
        body: formData
      })

      if (!resp.ok) {
        const errTxt = await resp.text()
        logger.error(`表情生成接口报错 (${resp.status}):`, errTxt)
        await e.reply(`生成失败: ${errTxt}`)
        return true
      }

      const arrBuf = await resp.arrayBuffer()
      if (arrBuf.byteLength === 0) {
        await e.reply('表情生成失败：服务端返回了空数据')
        return true
      }

      const base64Data = Buffer.from(arrBuf).toString('base64')
      await e.reply({
        images: [`base64://${base64Data}`],
        reply: cfg.reply
      })
      return true
    } catch (err) {
      logger.error('请求生成表情接口异常:', err)
      await e.reply(`表情生成异常: ${err.message}`)
      return true
    }
  }

  // ========================== 指令注册 ==========================

  // 1. 帮助说明
  ctx.registerCommand(/^#?(meme(s)?|表情包)帮助$/i, async (e) => {
    const help = [
      '【表情包功能指南】',
      '• 表情制作：发送关键词制作（如“鲁迅说 学医救不了中国人”、“摸 @群友”）',
      '• #meme列表 [页码]：查看支持的表情列表大图',
      '• #meme搜索 <词>：搜索表情关键词',
      '• #随机meme：随机挑选表情包制作',
      '• #随机 <表情名>：随机抽取群友制作指定表情',
      '• <表情名>详情：查看指定表情的参数与图片文字要求',
      '• #meme更新：立即同步远程最新表情包库'
    ].join('\n')
    await e.reply(help)
    return true
  })

  // 2. 搜索
  ctx.registerCommand(/^#?(meme(s)?|表情包)搜索\s*(.*)$/i, async (e) => {
    await ensureMetadata()
    const match = e.text.match(/^#?(?:meme(?:s)?|表情包)搜索\s*(.*)$/i)
    const keyword = match?.[1]?.trim()
    if (!keyword) {
      await e.reply('请加上要搜索的关键词喵，如：#meme搜索 摸')
      return true
    }

    const hits = Object.keys(keyMap).filter(k => k.includes(keyword))
    if (hits.length === 0) {
      await e.reply(`未找到包含「${keyword}」的表情包`)
      return true
    }

    const displayHits = hits.slice(0, 30)
    let replyText = `搜索「${keyword}」结果 (前${displayHits.length}项):\n`
    replyText += displayHits.map((k, i) => `${i + 1}. ${k}`).join('\n')
    if (hits.length > 30) replyText += `\n...更多结果共 ${hits.length} 项`
    await e.reply(replyText)
    return true
  })

  // 3. 立即刷新元数据
  ctx.registerCommand(/^#?(meme(s)?|表情包)更新$/i, async (e) => {
    await e.reply('正在拉取 meme 远程最新元数据，请稍候...')
    const ok = await updateMetadata(true)
    if (ok) {
      await e.reply(`更新完成！当前共收录 ${Object.keys(infos).length} 个表情包。`)
    } else {
      await e.reply('更新遇到问题，已继续使用本地缓存。')
    }
    return true
  })

  // 4. 表情包列表
  ctx.registerCommand(/^#?(meme(s)?|表情包)列表(?:\s*(\d+))?$/i, async (e) => {
    await ensureMetadata()
    const cfg = getCfg()
    const pageSize = cfg.pageSize || 200
    const keys = Object.keys(infos).sort()

    if (keys.length === 0) {
      await e.reply('暂无表情包元数据，请先发送 #meme更新')
      return true
    }

    const totalPages = Math.ceil(keys.length / pageSize)
    const match = e.text.match(/列表(?:\s*(\d+))?$/i)
    const specifiedPage = match?.[1] ? parseInt(match[1], 10) : null
    const baseUrl = cfg.baseUrl.replace(/\/+$/, '')

    // 辅助渲染单页
    const renderPage = async (page) => {
      const pageKeys = keys.slice((page - 1) * pageSize, page * pageSize)
      const resp = await fetch(`${baseUrl}/memes/render_list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meme_list: pageKeys.map(k => ({ meme_key: k, disabled: false, labels: [] })),
          text_template: '{index}. {keywords}',
          add_category_icon: true
        })
      })
      if (!resp.ok) throw new Error(`服务端返回 HTTP ${resp.status}`)
      const buf = Buffer.from(await resp.arrayBuffer())
      return buf.toString('base64')
    }

    // A. 用户指定了具体页码
    if (specifiedPage !== null) {
      if (specifiedPage < 1 || specifiedPage > totalPages) {
        await e.reply(`页码超出范围，共 ${totalPages} 页（第 1 ~ ${totalPages} 页）`)
        return true
      }
      await e.reply(`正在渲染第 ${specifiedPage}/${totalPages} 页表情列表，请稍候...`)
      try {
        const base64 = await renderPage(specifiedPage)
        await e.reply({
          text: `表情包列表第 ${specifiedPage}/${totalPages} 页 (共 ${keys.length} 项)：`,
          images: [`base64://${base64}`]
        })
      } catch (err) {
        logger.error('渲染单页列表失败:', err.message)
        await e.reply(`渲染列表图片失败: ${err.message}`)
      }
      return true
    }

    // B. 未指定页码：全量生成并合并转发
    await e.reply(`正在准备 ${keys.length} 个表情，共 ${totalPages} 页，请稍候……`)
    try {
      const forwardNodes = []
      for (let p = 1; p <= totalPages; p++) {
        const base64 = await renderPage(p)
        forwardNodes.push({
          type: 'node',
          data: {
            name: '表情包列表',
            uin: String(e.userId || 10000),
            content: [
              { type: 'text', data: { text: `第 ${p}/${totalPages} 页 (第 ${(p - 1) * pageSize + 1} ~ ${Math.min(p * pageSize, keys.length)} 个)` } },
              { type: 'image', data: { file: `base64://${base64}` } }
            ]
          }
        })
      }

      // 尝试调用 OneBot 合并转发
      let sendOk = false
      if (e.callAction) {
        try {
          if (e.isGroup && e.groupId) {
            await e.callAction('send_group_forward_msg', {
              group_id: Number(e.groupId),
              messages: forwardNodes
            })
            sendOk = true
          } else if (e.isPrivate && e.userId) {
            await e.callAction('send_private_forward_msg', {
              user_id: Number(e.userId),
              messages: forwardNodes
            })
            sendOk = true
          }
        } catch (fErr) {
          logger.warn('合并转发失败，降级为逐页发送:', fErr.message)
        }
      }

      // 如果不支持合并转发，则逐条发送
      if (!sendOk) {
        for (let i = 0; i < forwardNodes.length; i++) {
          const imgBase64 = forwardNodes[i].data.content[1].data.file
          await e.reply({
            text: `表情包列表 第 ${i + 1}/${totalPages} 页：`,
            images: [imgBase64]
          })
        }
      }
      return true
    } catch (err) {
      logger.error('渲染全量列表失败:', err.message)
      await e.reply(`渲染列表失败: ${err.message}`)
      return true
    }
  })

  // 5. 随机单图 meme
  ctx.registerCommand(/^#?随机\s*(meme(s)?|表情包)\s*$/i, async (e) => {
    await ensureMetadata()
    const singleImageKeys = Object.keys(infos).filter(k => {
      const p = infos[k]?.params_type
      return p && p.min_images === 1 && p.min_texts === 0
    })

    if (singleImageKeys.length === 0) {
      await e.reply('未找到可用的单图随机表情')
      return true
    }

    const pickedKey = singleImageKeys[Math.floor(Math.random() * singleImageKeys.length)]
    const kw = infos[pickedKey]?.keywords?.[0] || pickedKey
    return await generateMeme(e, kw, '')
  })

  // 6. 随机指定 meme（抽取群成员制作）
  ctx.registerCommand(/^#?随机\s+(.+)$/, async (e) => {
    await ensureMetadata()
    const match = e.text.match(/^#?随机\s+(.+)$/)
    const rawTarget = match?.[1]?.trim()
    const target = RANDOM_MEME_ALIASES[rawTarget] || rawTarget
    const targetCode = keyMap[target]
    const info = infos[targetCode]

    if (!info) {
      // 若不是表情名，放行
      return false
    }

    const p = info.params_type || {}
    if ((p.min_images || 0) < 1) {
      await e.reply(`「${target}」不需要头像，无法进行随机群友抽取`)
      return true
    }

    // 尝试抽取随机群成员
    let memberUins = []
    if (e.isGroup) {
      try {
        const members = e.getMemberList ? await e.getMemberList() : (await ctx.client?.callAction('get_group_member_list', { group_id: Number(e.groupId) }))?.data
        if (Array.isArray(members) && members.length > 0) {
          memberUins = members.map(m => m.user_id).filter(id => id && String(id) !== String(e.userId))
        }
      } catch (err) {
        logger.debug('获取群成员列表失败:', err.message)
      }
    }

    if (memberUins.length === 0) {
      memberUins = [e.userId]
    }

    // 随机抽取
    const needCount = Math.max(1, p.min_images || 1)
    const shuffled = memberUins.sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, needCount)

    // 构造虚拟头像图片列表并发起制作
    const fakeEvent = Object.create(e)
    fakeEvent.images = selected.map(qq => ({ url: `https://q1.qlogo.cn/g?b=qq&s=640&nk=${qq}` }))
    return await generateMeme(fakeEvent, target, '')
  })

  // 7. 通用表情包生成器总入口（捕获所有 meme 关键词）
  // 采用前缀匹配与最长匹配算法，不匹配时优雅放行 (return false)
  ctx.registerCommand(/.+/, async (e) => {
    await ensureMetadata()
    const cfg = getCfg()
    let rawText = e.text.trim()

    if (cfg.forceSharp) {
      if (!rawText.startsWith('#')) return false
      rawText = rawText.slice(1).trim()
    } else if (rawText.startsWith('#')) {
      rawText = rawText.slice(1).trim()
    }

    if (!rawText) return false

    // 最长关键词前缀命中
    let matchedKw = null
    for (const kw of sortedKeywords) {
      if (rawText.startsWith(kw)) {
        matchedKw = kw
        break
      }
    }

    if (!matchedKw) return false

    const restText = rawText.slice(matchedKw.length).trim()
    return await generateMeme(e, matchedKw, restText)
  })

  logger.info('meme 表情包插件初始化就绪！')
}
