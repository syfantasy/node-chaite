<script lang="ts" setup>
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import type { Component } from 'vue'
import type { MenuOption } from 'naive-ui'
import {
  NAlert,
  NButton,
  NCard,
  NDynamicTags,
  NForm,
  NFormItemGridItem,
  NGrid,
  NIcon,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  NTabPane,
  NTabs,
  NTooltip,
  useMessage,
} from 'naive-ui'
import { InformationCircleOutline } from '@vicons/ionicons5'
import IconLinkStar from '~icons/icon-park-outline/star-one'
import IconLinkSystem from '~icons/icon-park-outline/system'
import IconLinkPermission from '~icons/icon-park-outline/permissions'
import IconLinkLock from '~icons/icon-park-outline/electronic-locks-open'
import IconLinkVision from '~icons/icon-park-outline/preview-open'
import { useAuthStore } from '@/store/auth'
import { fetchChangePassword } from '@/service/api/login'
import { fetchSystemUpdate } from '@/service/api/system'
import type { CustomConfig } from '@/service/api/config'
import { fetchConfig, saveConfig } from '@/service/api/config'
import { fetchAllPresetList } from '@/service/api/presets'
import { fetchVisionChannelModels } from '@/service/api/channels'
import { cleanUnusedImages, fetchMaintenanceStats, pruneHistory } from '@/service/api/maintenance'
import type { MaintenanceStats } from '@/service/api/maintenance'
// Create the message instance
const message = useMessage()
const activeTab = ref('basic')
const tabsRef = ref(null)

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions: MenuOption[] = [
  {
    label: '基础设置',
    key: 'basic',
    icon: renderIcon(IconLinkSystem),
  },
  {
    label: '模型与对话',
    key: 'llm',
    icon: renderIcon(IconLinkPermission),
  },
  {
    label: '权限管理',
    key: 'management',
    icon: renderIcon(IconLinkLock),
  },
  {
    label: '视觉配置',
    key: 'vision',
    icon: renderIcon(IconLinkVision),
  },
  {
    label: '日志与调试',
    key: 'logging',
    icon: renderIcon(IconLinkSystem),
  },
  {
    label: '存储与维护',
    key: 'maintenance',
    icon: renderIcon(IconLinkStar),
  },
  {
    label: '安全与更新',
    key: 'security',
    icon: renderIcon(IconLinkLock),
  },
]

function handleMenuUpdate(key: string) {
  activeTab.value = key
}

// Define the config structure based on your ChatGPTConfig class
const config = reactive({
  version: '3.0.0',
  basic: {
    toggleMode: 'at',
    togglePrefix: '#chat',
    debug: false,
    commandPrefix: '#',
    enableAt: true,
    atPresetId: '',
  },
  /**
   * 伪人模式，基于框架实现，因此机器人开启前缀后依然需要带上前缀。
   * @type {{
   *   enable: boolean,
   *   hit: string[],
   *   probability: number,
   *   speakingMode: 'reply' | 'contextual',
   *   contextualPrompt: string,
   *   defaultPreset: string,
   *   presetPrefix?: string,
   *   presetMap: Array<{
   *     keywords: string[],
   *     presetId: string,
   *     priority: number,
   *     recall?: boolean
   *   }>,
   *   maxTokens: number,
   *   temperature: number,
   *   sendReasoning: boolean
   * }}
   * }}
   */
  bym: {
    enable: false,
    hit: [],
    probability: 0.02,
    speakingMode: 'reply',
    contextualPrompt: '你现在不是在回复某一条特定消息，而是作为这个群里的一名普通群友自然参与当前聊天。请阅读前面的群聊上下文，选择一个自然的切入点发言，可以接续话题、补充信息、吐槽、提问或表达态度。不要解释任务，不要提及“上下文”“指令”“AI”或“机器人”，不要强行引用、@或逐句回答触发你的那条消息。直接输出一段适合发到群里的自然发言。',
    defaultPreset: '',
    presetPrefix: '',
    presetMap: [],
    maxTokens: 0,
    temperature: -1,
    sendReasoning: false,
  } as {
    enable: boolean
    hit: string[]
    probability: number
    speakingMode: 'reply' | 'contextual'
    contextualPrompt: string
    defaultPreset: string
    presetPrefix?: string
    presetMap: Array<{
      keywords: string[]
      presetId: string
      priority: number
      recall?: boolean
    }>
    maxTokens: number
    temperature: number
    sendReasoning: boolean
  },
  llm: {
    defaultModel: '',
    defaultChatPresetId: '',
    enableCustomPreset: false,
    customPresetUserWhiteList: [],
    customPresetUserBlackList: [],
    promptBlockWords: [],
    responseBlockWords: [],
    blockStrategy: 'full',
    blockWordMask: '**',
    enableGroupContext: true,
    maxConsecutiveCalls: 10,
    maxConsecutiveIdenticalCalls: 3,
  },
  groupContext: {
    enable: true,
    minMessages: 20,
    minTokens: 2000,
    maxMessages: 100,
    maxTokens: 10000,
    enableRichCards: true,
    enableForwardParse: true,
    maxForwardMessages: 15,
  },
  management: {
    blackGroups: [],
    whiteGroups: [],
    blackUsers: [],
    whiteUsers: [],
    masterUsers: [],
    defaultRateLimit: 0,
  },
  chaite: {
    dataDir: 'data',
    processorsDirPath: 'utils/processors',
    toolsDirPath: 'utils/tools',
    cloudBaseUrl: '',
    cloudApiKey: '',
    authKey: '',
    host: '',
    port: 48370,
    operationLogLimit: 50000,
  },
  vision: {
    nonVisionStrategy: 'tool',
    visionChannelId: '',
    imageDescriptionModel: '',
    imageDescriptionSystemPrompt: 'You are an image analysis assistant. Answer questions about images accurately and thoroughly.',
    defaultQuestion: '请详细描述这张图片的内容，包括场景、人物、物体、文字、颜色等所有可见细节。',
    maxImageSize: 10485760,
    maxImageSizeMb: 4,
    maxRecentImages: 3,
    maxImageDimension: 4096,
    enableGroupContextImages: true,
  },
  logging: {
    enabled: true,
    maxRecords: 500,
  },
  maintenance: {
    historyRetentionDays: 30,
    autoCleanImages: true,
  },
})

// 安全与更新功能
const authStore = useAuthStore()

const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const pwdLoading = ref(false)

async function handleChangePassword() {
  if (!pwdForm.newPassword || !pwdForm.newPassword.trim()) {
    message.warning('请输入新密码')
    return
  }
  if (pwdForm.newPassword !== pwdForm.confirmPassword) {
    message.error('两次输入的新密码不一致，请重新核对')
    return
  }

  pwdLoading.value = true
  try {
    const res = await fetchChangePassword({
      oldPassword: pwdForm.oldPassword.trim() || undefined,
      newPassword: pwdForm.newPassword.trim(),
    })
    if (res.isSuccess) {
      message.success('密码修改成功！正在退出登录，请使用新密码重新登录...')
      setTimeout(async () => {
        await authStore.logout()
      }, 1200)
    }
    else {
      message.error(res.message || '密码修改失败')
    }
  }
  catch (err: any) {
    message.error(`修改失败: ${err?.message || err}`)
  }
  finally {
    pwdLoading.value = false
  }
}

// 自动更新功能
const updateLoading = ref(false)
const updateLog = ref('')
const updateFinished = ref(false)
const restartCountdown = ref(0)

async function handleSystemUpdate() {
  updateLoading.value = true
  updateLog.value = ''
  updateFinished.value = false
  try {
    const res = await fetchSystemUpdate()
    if (res.isSuccess && res.data) {
      updateLog.value = res.data.log || '执行完成，无输出'
      if ((res.data as any).hasUpdate) {
        message.success(res.data.message || '更新命令已执行，服务正在自动重启')
        updateFinished.value = true
        restartCountdown.value = 6
        const timer = setInterval(() => {
          restartCountdown.value--
          if (restartCountdown.value <= 0) {
            clearInterval(timer)
            window.location.reload()
          }
        }, 1000)
      }
      else {
        message.info(res.data.message || '当前已是最新版本，无需更新')
      }
    }
    else {
      message.error(res.message || '自动更新失败')
    }
  }
  catch (err: any) {
    message.error(`自动更新请求出错: ${err?.message || err}`)
  }
  finally {
    updateLoading.value = false
  }
}

const visionChannels = ref<Array<{ id: string; name: string; models: Array<{ name: string; features: string[] }> }>>([])
const visionChannelsLoaded = ref(false)

const visionChannelOptions = computed(() => [
  { label: '自动选择第一个可用视觉渠道（推荐）', value: '' },
  ...visionChannels.value.map(channel => ({ label: `${channel.name}（${channel.models.length} 个视觉模型）`, value: channel.id })),
])

const visionModelOptions = computed(() => {
  const channel = visionChannels.value.find(item => item.id === config.vision.visionChannelId)
  if (!channel) return [{ label: '自动选择渠道的第一个视觉模型', value: '' }]
  return [
    { label: '自动选择该渠道的第一个视觉模型', value: '' },
    ...channel.models.map(model => ({ label: model.name, value: model.name })),
  ]
})

function ensureVisionModelSelection() {
  if (!visionChannelsLoaded.value || !config.vision.visionChannelId) return
  const selected = visionModelOptions.value.some(option => option.value === config.vision.imageDescriptionModel)
  if (!selected) config.vision.imageDescriptionModel = ''
}

watch(() => config.vision.visionChannelId, ensureVisionModelSelection)

async function loadVisionChannels() {
  try {
    const res = await fetchVisionChannelModels()
    if (res.code === 0) visionChannels.value = res.data
    visionChannelsLoaded.value = true
    ensureVisionModelSelection()
  }
  catch (error) {
    console.error('加载视觉渠道失败:', error)
  }
}

const maintenanceStats = ref<MaintenanceStats>({
  supported: false,
  totalMessages: 0,
  totalImages: 0,
  imagesSizeBytes: 0,
})
const maintenanceStatsLoading = ref(false)
const cleanImagesLoading = ref(false)
const pruneHistoryLoading = ref(false)

function formatBytes(bytes: number) {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

async function loadMaintenanceStats() {
  maintenanceStatsLoading.value = true
  try {
    const res = await fetchMaintenanceStats()
    if (res.isSuccess && res.data) {
      maintenanceStats.value = res.data
    }
  } catch (err: any) {
    console.error('获取维护统计失败:', err)
  } finally {
    maintenanceStatsLoading.value = false
  }
}

async function handleCleanImages() {
  cleanImagesLoading.value = true
  try {
    const res = await cleanUnusedImages()
    if (res.isSuccess && res.data) {
      message.success(`孤立图片清理成功：删除了 ${res.data.deleted} 张无引用图片（共扫描 ${res.data.total} 张）`)
      await loadMaintenanceStats()
    } else {
      message.error(res.message || '清理图片失败')
    }
  } catch (err: any) {
    message.error(`清理图片出错: ${err?.message || err}`)
  } finally {
    cleanImagesLoading.value = false
  }
}

async function handlePruneHistory() {
  const days = config.maintenance.historyRetentionDays
  if (!days || days <= 0) {
    message.warning('当前保留天数设为 0（永久保留），无法执行过期清理')
    return
  }
  pruneHistoryLoading.value = true
  try {
    const res = await pruneHistory(days, config.maintenance.autoCleanImages)
    if (res.isSuccess && res.data) {
      message.success(`历史清理完成：清理了 ${res.data.prunedMessages} 条过期消息，删除了 ${res.data.deletedImages} 张孤立图片`)
      await loadMaintenanceStats()
    } else {
      message.error(res.message || '历史清理失败')
    }
  } catch (err: any) {
    message.error(`历史清理出错: ${err?.message || err}`)
  } finally {
    pruneHistoryLoading.value = false
  }
}

watch(activeTab, (val) => {
  if (val === 'maintenance') {
    loadMaintenanceStats()
  }
})

async function getConfig(): Promise<CustomConfig> {
  const data = await fetchConfig()
  if (data.isSuccess) {
    message.success('配置加载成功')
  }
  else {
    message.error('配置加载失败')
  }
  const rawMgmt = (data.data?.management || {}) as Record<string, any>
  const rawLlm = (data.data?.llm || {}) as Record<string, any>
  const rawGc = (data.data?.groupContext || {}) as Record<string, any>
  // Keep defaults introduced by newer plugin versions when loading older
  // persisted nested config objects that do not yet contain them.
  Object.assign(config, {
    ...data.data,
    basic: {
      ...config.basic,
      ...(data.data?.basic || {}),
    },
    management: {
      ...config.management,
      ...rawMgmt,
      whiteGroups: ((rawMgmt.whiteGroups as any[]) || []).map(String),
      blackGroups: ((rawMgmt.blackGroups as any[]) || []).map(String),
      whiteUsers: ((rawMgmt.whiteUsers as any[]) || []).map(String),
      blackUsers: ((rawMgmt.blackUsers as any[]) || []).map(String),
      masterUsers: ((rawMgmt.masterUsers as any[]) || []).map(String),
    },
    bym: {
      ...config.bym,
      ...(data.data?.bym || {}),
    },
    llm: {
      ...config.llm,
      ...rawLlm,
      customPresetUserWhiteList: ((rawLlm.customPresetUserWhiteList as any[]) || []).map(String),
      customPresetUserBlackList: ((rawLlm.customPresetUserBlackList as any[]) || []).map(String),
    },
    vision: {
      ...config.vision,
      ...(data.data?.vision || {}),
    },
    maintenance: {
      ...config.maintenance,
      ...(data.data?.maintenance || {}),
    },
  })
  Object.assign(config.groupContext, {
    ...config.groupContext,
    ...rawGc,
    minMessages: Number(rawGc.minMessages) || config.groupContext.minMessages || 20,
    minTokens: Number(rawGc.minTokens) || config.groupContext.minTokens || 2000,
    maxMessages: Number(rawGc.maxMessages) || config.groupContext.maxMessages || 100,
    maxTokens: Number(rawGc.maxTokens) || config.groupContext.maxTokens || 10000,
    maxForwardMessages: Number(rawGc.maxForwardMessages) || config.groupContext.maxForwardMessages || 15,
    enable: rawGc.enable !== undefined ? Boolean(rawGc.enable) : config.groupContext.enable,
    enableRichCards: rawGc.enableRichCards !== undefined ? Boolean(rawGc.enableRichCards) : config.groupContext.enableRichCards,
    enableForwardParse: rawGc.enableForwardParse !== undefined ? Boolean(rawGc.enableForwardParse) : config.groupContext.enableForwardParse,
  })
  if (!Array.isArray(config.bym.presetMap)) {
    config.bym.presetMap = []
  }
  return data.data
}

async function updateConfig() {
  const payload = JSON.parse(JSON.stringify(config))
  if (payload.groupContext) {
    if (!payload.llm) payload.llm = {}
    payload.llm.enableGroupContext = payload.groupContext.enable
  }
  if (payload.management) {
    payload.management.whiteGroups = (payload.management.whiteGroups || []).map(Number).filter(Boolean)
    payload.management.blackGroups = (payload.management.blackGroups || []).map(Number).filter(Boolean)
    payload.management.whiteUsers = (payload.management.whiteUsers || []).map(Number).filter(Boolean)
    payload.management.blackUsers = (payload.management.blackUsers || []).map(Number).filter(Boolean)
    payload.management.masterUsers = (payload.management.masterUsers || []).map(Number).filter(Boolean)
  }
  const updateRes = await saveConfig(payload)
  if (updateRes.isSuccess) {
    message.success('配置保存成功')
  }
  else {
    message.error('配置保存失败')
  }
}

const presets = ref([] as Array<Shareable.PresetModel>)
function fetchPresets() {
  fetchAllPresetList().then((items) => {
    presets.value = items
  }).catch((err) => {
    console.error(err)
  })
}

const presetOptions = computed(() => {
  return presets.value.map(preset => ({
    label: preset.name,
    value: preset.id,
  }))
})

function filterOption(query: string, option: any) {
  return option.label.toLowerCase().includes(query.toLowerCase())
}

// Load configuration on component mount
onMounted(async () => {
  // 1. Fetch presets & channels first so select components have options available
  try {
    await Promise.allSettled([fetchPresets(), loadVisionChannels()])
  } catch {}

  // 2. Fetch main system config
  try {
    await getConfig()
  } catch (error) {
    console.error('加载系统配置失败:', error)
    message.error('系统配置加载失败')
  }
})
</script>

<template>
  <div class="config-container">
    <NCard title="系统配置" class="main-card">
      <template #header-extra>
        <NButton type="primary" size="small" @click="updateConfig">
          保存配置
        </NButton>
      </template>
      <div class="layout-container">
        <!-- Left sidebar for navigation on wider screens -->
        <div class="sidebar">
          <NMenu
            v-model:value="activeTab"
            :options="menuOptions"
            @update:value="handleMenuUpdate"
          />
          <div class="version-info">
            <span>版本: {{ config.version }}</span>
          </div>
        </div>
        <!-- Main content area -->
        <div class="content-area">
          <NTabs
            ref="tabsRef"
            v-model:value="activeTab"
            type="line"
            animated
            class="responsive-tabs"
          >
            <!-- 基础设置选项卡 -->
            <NTabPane name="basic" tab="基础设置">
              <NCard class="inner-card">
                <template #header>
                  <div class="card-header">
                    <div class="card-header">
                      <div class="card-title">
                        触发与命令
                      </div>
                      <div class="card-subtitle">
                        设置机器人的触发方式和基本命令
                      </div>
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.basic">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24 s:24 m:12" label="@ 触发">
                      <div style="display: flex; align-items: center; height: 34px;">
                        <NSwitch v-model:value="config.basic.enableAt" />
                        <NTooltip placement="top" trigger="hover">
                          <template #trigger>
                            <NIcon size="18" style="margin-left: 8px; cursor: pointer;">
                              <InformationCircleOutline />
                            </NIcon>
                          </template>
                          <span>关闭时，群内 @ 机器人不会触发对话；开启时可直接触发对话。</span>
                        </NTooltip>
                      </div>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="@ 触发预设">
                      <div style="display: flex; align-items: center; width: 100%;">
                        <NSelect
                          v-model:value="config.basic.atPresetId"
                          :options="presetOptions"
                          clearable
                          placeholder="选择 @ 触发时使用的预设（留空使用默认预设）"
                          :disabled="!config.basic.enableAt"
                          style="flex: 1;"
                        />
                        <NTooltip placement="top" trigger="hover">
                          <template #trigger>
                            <NIcon size="18" style="margin-left: 8px; cursor: pointer; flex-shrink: 0;">
                              <InformationCircleOutline />
                            </NIcon>
                          </template>
                          <span>开启 @ 触发时，若指定了预设，则 @ 触发就像在消息前加了该预设的前缀一样直接唤醒该预设。</span>
                        </NTooltip>
                      </div>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="命令触发前缀" path="commandPrefix">
                      <div style="display: flex; align-items: center; width: 100%;">
                        <NInput v-model:value="config.basic.commandPrefix" placeholder="默认 #" style="flex: 1;" />
                        <NTooltip placement="top" trigger="hover">
                          <template #trigger>
                            <NIcon size="18" style="margin-left: 8px; cursor: pointer; flex-shrink: 0;">
                              <InformationCircleOutline />
                            </NIcon>
                          </template>
                          <span>绑定 #chaite、#ping、#拉黑 等交互指令的前缀（若改成 /，则指令变为 /chaite）。默认为 #。</span>
                        </NTooltip>
                      </div>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="调试模式" path="debug">
                      <NSwitch v-model:value="config.basic.debug" />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>
            </NTabPane>

            <!-- 模型与对话选项卡 -->
            <NTabPane name="llm" tab="模型与对话">
              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      模型配置
                    </div>
                    <div class="card-subtitle">
                      设置默认对话预设与内容安全规则
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.llm">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>

                    <NFormItemGridItem span="24" label="默认对话预设" path="defaultChatPresetId">
                      <NSelect
                        v-model:value="config.llm.defaultChatPresetId"
                        :options="presetOptions"
                        filterable
                        placeholder="选择默认对话预设"
                        clearable
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      工具调用熔断限制 (Tool Call Limits)
                    </div>
                    <div class="card-subtitle">
                      防止模型在单轮对话中陷入死循环无限调用工具。设为 0 表示不限制调用次数。
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.llm">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24 s:24 m:12" label="单轮最大连续调用次数" path="maxConsecutiveCalls">
                      <NInputNumber
                        v-model:value="config.llm.maxConsecutiveCalls"
                        :min="0"
                        :max="100"
                        placeholder="默认 10 (0 为不限制)"
                        style="width: 100%"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="相同参数连续调用限制" path="maxConsecutiveIdenticalCalls">
                      <NInputNumber
                        v-model:value="config.llm.maxConsecutiveIdenticalCalls"
                        :min="0"
                        :max="50"
                        placeholder="默认 3 (0 为不限制)"
                        style="width: 100%"
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <NCard class="inner-card">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      内容过滤
                    </div>
                    <div class="card-subtitle">
                      设置敏感词过滤规则
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.llm">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24" label="用户输入屏蔽词" path="promptBlockWords">
                      <NDynamicTags
                        v-model:value="config.llm.promptBlockWords"
                        placeholder="输入屏蔽词并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="回复屏蔽词" path="responseBlockWords">
                      <NDynamicTags
                        v-model:value="config.llm.responseBlockWords"
                        placeholder="输入屏蔽词并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="屏蔽策略" path="blockStrategy">
                      <NSelect
                        v-model:value="config.llm.blockStrategy"
                        :options="[
                          { label: '完全屏蔽消息', value: 'full' },
                          { label: '仅屏蔽关键词', value: 'mask' },
                        ]"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem
                      span="24 s:24 m:12"
                      label="屏蔽替换字符"
                      path="blockWordMask"
                      :disabled="config.llm.blockStrategy !== 'mask'"
                    >
                      <NInput
                        v-model:value="config.llm.blockWordMask"
                        placeholder="例如: ***"
                        :disabled="config.llm.blockStrategy !== 'mask'"
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <!-- 群聊上下文卡片 -->
              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      群聊上下文
                    </div>
                    <div class="card-subtitle">
                      基于双水位滚动窗口的群聊背景管理机制，兼顾前缀缓存命中与上下文完整度
                    </div>
                  </div>
                </template>
                <NForm label-placement="top" :model="config.groupContext">
                  <NGrid :cols="24" :x-gap="16" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24 s:24 m:12" label="全局启用群组上下文" path="enable">
                      <NSwitch v-model:value="config.groupContext.enable" />
                      <template #feedback>
                        <span class="form-hint">总开关：关闭后所有预设默认不携带群聊背景（个别预设单独开启除外）</span>
                      </template>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="富媒体卡片解析" path="enableRichCards">
                      <NSwitch v-model:value="config.groupContext.enableRichCards" />
                      <template #feedback>
                        <span class="form-hint">将群里的小程序、音乐卡片、B站视频等压缩为单行紧凑 Markdown，避免垃圾 Token 污染</span>
                      </template>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="合并转发解析" path="enableForwardParse">
                      <NSwitch v-model:value="config.groupContext.enableForwardParse" />
                      <template #feedback>
                        <span class="form-hint">自动拉取群聊合并转发记录并提取概要，支持生成句柄供后续查阅</span>
                      </template>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="转发最多采样条数" path="maxForwardMessages">
                      <NInputNumber
                        v-model:value="config.groupContext.maxForwardMessages"
                        :min="1"
                        :max="50"
                        style="width: 100%"
                        placeholder="默认 15 条"
                      />
                      <template #feedback>
                        <span class="form-hint">单个合并转发最多采样的消息条数</span>
                      </template>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:12 m:6" label="最低保留条数" path="minMessages">
                      <NInputNumber
                        v-model:value="config.groupContext.minMessages"
                        :min="1"
                        :max="500"
                        style="width: 100%"
                        placeholder="默认 20 条"
                      />
                      <template #feedback>
                        <span class="form-hint">水位重置后的保底消息数量</span>
                      </template>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:12 m:6" label="最低保留 Token" path="minTokens">
                      <NInputNumber
                        v-model:value="config.groupContext.minTokens"
                        :min="100"
                        :max="50000"
                        style="width: 100%"
                        placeholder="默认 2000"
                      />
                      <template #feedback>
                        <span class="form-hint">水位重置后的保底 Token 预算</span>
                      </template>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:12 m:6" label="上限条数" path="maxMessages">
                      <NInputNumber
                        v-model:value="config.groupContext.maxMessages"
                        :min="5"
                        :max="1000"
                        style="width: 100%"
                        placeholder="默认 100 条"
                      />
                      <template #feedback>
                        <span class="form-hint">仅当条数与 Token 均超过上限时才触发修剪</span>
                      </template>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:12 m:6" label="上限 Token" path="maxTokens">
                      <NInputNumber
                        v-model:value="config.groupContext.maxTokens"
                        :min="500"
                        :max="100000"
                        style="width: 100%"
                        placeholder="默认 10000"
                      />
                      <template #feedback>
                        <span class="form-hint">双重条件触发截断，最大化利用 Prompt Cache</span>
                      </template>
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>
            </NTabPane>

            <!-- 权限管理选项卡 -->
            <NTabPane name="management" tab="权限管理">
              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      访问控制
                    </div>
                    <div class="card-subtitle">
                      设置黑白名单控制机器人访问权限
                    </div>
                  </div>
                </template>
                <template #header-extra>
                  <NButton type="primary" size="small" @click="updateConfig">
                    保存配置
                  </NButton>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.management">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24" label="管理员/主人 QQ" path="masterUsers">
                      <div style="display: flex; align-items: center; width: 100%;">
                        <NDynamicTags
                          v-model:value="config.management.masterUsers"
                          placeholder="输入管理员 QQ 号并按回车添加"
                          style="flex: 1;"
                        />
                        <NTooltip placement="top" trigger="hover">
                          <template #trigger>
                            <NIcon size="18" style="margin-left: 8px; cursor: pointer; flex-shrink: 0;">
                              <InformationCircleOutline />
                            </NIcon>
                          </template>
                          <span>享有管理员权限的 QQ 号列表。可执行 #结束全部对话 等全局维护指令。</span>
                        </NTooltip>
                      </div>
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="黑名单群组" path="blackGroups">
                      <NDynamicTags
                        v-model:value="config.management.blackGroups"
                        placeholder="输入群号并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="白名单群组" path="whiteGroups">
                      <NDynamicTags
                        v-model:value="config.management.whiteGroups"
                        placeholder="输入群号并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="黑名单用户" path="blackUsers">
                      <NDynamicTags
                        v-model:value="config.management.blackUsers"
                        placeholder="输入用户ID并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="白名单用户" path="whiteUsers">
                      <NDynamicTags
                        v-model:value="config.management.whiteUsers"
                        placeholder="输入用户ID并按回车添加"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="对话速率限制" path="defaultRateLimit">
                      <NInputNumber
                        v-model:value="config.management.defaultRateLimit"
                        placeholder="0表示不限制"
                        :min="0"
                        style="width: 100%"
                      >
                        <template #suffix>
                          次/分钟
                        </template>
                      </NInputNumber>
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>
            </NTabPane>

            <!-- 视觉配置选项卡 -->
            <NTabPane name="vision" tab="视觉配置">
              <NCard class="inner-card">
                <template #header>
                  <span>视觉处理</span>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.vision">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24 s:12 m:12" label="非视觉模型策略">
                      <NSelect
                        v-model:value="config.vision.nonVisionStrategy"
                        :options="[
                          { label: '工具模式（引用文本 + ask_about_image 工具）', value: 'tool' },
                          { label: '忽略模式（仅替换为 [图片]）', value: 'ignore' },
                        ]"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:12 m:12" label="视觉模型渠道">
                      <NSelect
                        v-model:value="config.vision.visionChannelId"
                        :options="visionChannelOptions"
                        placeholder="选择视觉渠道，或保留自动选择"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:12 m:12" label="图片描述模型">
                      <NSelect
                        v-model:value="config.vision.imageDescriptionModel"
                        :options="visionModelOptions"
                        :disabled="!config.vision.visionChannelId"
                        placeholder="先选择视觉渠道，或保持自动"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="图片描述系统提示词">
                      <NInput
                        v-model:value="config.vision.imageDescriptionSystemPrompt"
                        type="textarea"
                        :rows="3"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="默认图片提问">
                      <NInput
                        v-model:value="config.vision.defaultQuestion"
                        type="textarea"
                        :rows="2"
                        placeholder="未指定 question 时的默认提问"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:12 m:12" label="群聊最近图片数 (张)">
                      <div style="display: flex; align-items: center; width: 100%;">
                        <NInputNumber
                          v-model:value="config.vision.maxRecentImages"
                          :min="1"
                          :max="20"
                          style="flex: 1;"
                        />
                        <NTooltip placement="top" trigger="hover">
                          <template #trigger>
                            <NIcon size="18" style="margin-left: 8px; cursor: pointer; flex-shrink: 0;">
                              <InformationCircleOutline />
                            </NIcon>
                          </template>
                          <span>群聊中仅保留最近 N 张图片作为多模态输入，更早的图片将自动转为文本引用，以避免消耗过大 Token。</span>
                        </NTooltip>
                      </div>
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:12 m:12" label="群聊上下文图片">
                      <div style="display: flex; align-items: center; height: 34px;">
                        <NSwitch v-model:value="config.vision.enableGroupContextImages" />
                        <NTooltip placement="top" trigger="hover">
                          <template #trigger>
                            <NIcon size="18" style="margin-left: 8px; cursor: pointer;">
                              <InformationCircleOutline />
                            </NIcon>
                          </template>
                          <span>开启后群聊历史记录中的图片会进入多模态主干对话上下文。</span>
                        </NTooltip>
                      </div>
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>
            </NTabPane>

            <!-- 日志与调试配置选项卡 -->
            <NTabPane name="logging" tab="日志与调试">
              <NCard class="inner-card">
                <template #header>
                  <span>日志系统配置</span>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.logging">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24 s:12 m:12" label="开启请求与调试日志">
                      <NSwitch v-model:value="config.logging.enabled" />
                      <span class="text-xs ml-2">开启后完整记录模型调用、伪人插话及错误追踪</span>
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:12 m:12" label="最大保留记录条数 (FIFO)">
                      <NInputNumber
                        v-model:value="config.logging.maxRecords"
                        :min="50"
                        :max="10000"
                        style="width: 100%"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24">
                      <NAlert type="info">
                        日志采用循环覆盖 (FIFO) 存储，超限自动删除最老记录；Base64 图片在详情中已默认紧凑折叠并支持一键预览与复制，避免卡顿与磁盘暴涨。
                      </NAlert>
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>
            </NTabPane>

            <!-- 存储与维护选项卡 -->
            <NTabPane name="maintenance" tab="存储与维护">
              <NSpace vertical size="large">
                <NCard class="inner-card">
                  <template #header>
                    <div class="card-header">
                      <div class="card-title">数据状态概览</div>
                      <div class="card-subtitle">实时查看当前历史消息和图片缓存存储情况</div>
                    </div>
                  </template>
                  <template #header-extra>
                    <NButton size="small" :loading="maintenanceStatsLoading" @click="loadMaintenanceStats">
                      刷新状态
                    </NButton>
                  </template>
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24 s:8 m:8" label="历史消息总数">
                      <div style="font-size: 20px; font-weight: bold; color: #18a058;">
                        {{ maintenanceStats.totalMessages }} 条
                      </div>
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:8 m:8" label="本地缓存图片数">
                      <div style="font-size: 20px; font-weight: bold; color: #2080f0;">
                        {{ maintenanceStats.totalImages }} 张
                      </div>
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:8 m:8" label="图片磁盘占用">
                      <div style="font-size: 20px; font-weight: bold; color: #f0a020;">
                        {{ formatBytes(maintenanceStats.imagesSizeBytes) }}
                      </div>
                    </NFormItemGridItem>
                  </NGrid>
                </NCard>

                <NCard class="inner-card">
                  <template #header>
                    <div class="card-header">
                      <div class="card-title">自动清理策略</div>
                      <div class="card-subtitle">配置历史消息及孤立图片的定期维护规则</div>
                    </div>
                  </template>
                  <NForm label-placement="left" label-width="auto" :model="config.maintenance">
                    <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                      <NFormItemGridItem span="24 s:12 m:12" label="会话历史保留天数">
                        <div style="display: flex; align-items: center; width: 100%;">
                          <NInputNumber
                            v-model:value="config.maintenance.historyRetentionDays"
                            :min="0"
                            :max="3650"
                            placeholder="如: 30"
                            style="flex: 1;"
                          />
                          <span class="text-xs ml-2" style="white-space: nowrap;">天（填 0 为永久保留不清理）</span>
                        </div>
                      </NFormItemGridItem>
                      <NFormItemGridItem span="24 s:12 m:12" label="自动清理孤立图片">
                        <div style="display: flex; align-items: center; gap: 12px;">
                          <NSwitch v-model:value="config.maintenance.autoCleanImages" />
                          <span class="text-xs">定时维护与历史清理时，自动从磁盘删除无引用的孤立图片</span>
                        </div>
                      </NFormItemGridItem>
                      <NFormItemGridItem span="24">
                        <NAlert type="info">
                          系统每天会在后台自动执行一次定期维护；当历史消息因过期被清理后，若开启了孤立图片清理，与该消息关联的本地图片文件也会被自动删除并回收磁盘。
                        </NAlert>
                      </NFormItemGridItem>
                    </NGrid>
                  </NForm>
                </NCard>

                <NCard class="inner-card">
                  <template #header>
                    <div class="card-header">
                      <div class="card-title">手动数据维护</div>
                      <div class="card-subtitle">立即触发清理操作释放磁盘空间</div>
                    </div>
                  </template>
                  <NSpace size="large">
                    <NButton
                      type="warning"
                      :loading="cleanImagesLoading"
                      @click="handleCleanImages"
                    >
                      立即清理未引用的孤立图片
                    </NButton>
                    <NButton
                      type="error"
                      :loading="pruneHistoryLoading"
                      @click="handlePruneHistory"
                    >
                      按保留期立即清理历史消息
                    </NButton>
                  </NSpace>
                </NCard>
              </NSpace>
            </NTabPane>
            <!-- 安全与更新选项卡 -->
            <NTabPane name="security" tab="安全与更新">
              <!-- 修改管理员密码 -->
              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      管理密码设置
                    </div>
                    <div class="card-subtitle">
                      修改 Chaite 控制台的访问密码。修改成功后将自动退出登录，请使用新密码重新登录。
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="pwdForm">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24 s:24 m:12" label="原密码" path="oldPassword">
                      <NInput
                        v-model:value="pwdForm.oldPassword"
                        type="password"
                        show-password-on="click"
                        placeholder="初次未设置密码可留空"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="新密码" path="newPassword">
                      <NInput
                        v-model:value="pwdForm.newPassword"
                        type="password"
                        show-password-on="click"
                        placeholder="请输入新管理密码"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="确认新密码" path="confirmPassword">
                      <NInput
                        v-model:value="pwdForm.confirmPassword"
                        type="password"
                        show-password-on="click"
                        placeholder="请再次输入新密码核对"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24">
                      <NButton
                        type="primary"
                        :loading="pwdLoading"
                        @click="handleChangePassword"
                      >
                        修改密码并重新登录
                      </NButton>
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <!-- Chaite 系统在线更新 -->
              <NCard class="inner-card">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      Chaite 在线更新
                    </div>
                    <div class="card-subtitle">
                      一键自动拉取最新版本更新。自适应 Git 源码独立部署版与 npm/pnpm 宿主依赖包。
                    </div>
                  </div>
                </template>
                <NSpace vertical size="large">
                  <NAlert title="更新机制说明" type="info">
                    点击更新后，系统会自动侦测当前部署环境：若为独立 Git 仓库将执行 <code>git pull</code>；若为宿主插件依赖引入则会自动执行包管理器更新 <code>@syfantasy/chaite@latest</code>，并在更新完成后自动退出进程由守护程序（如 systemd/pm2）自动拉起新版本。
                  </NAlert>

                  <NSpace align="center">
                    <NButton
                      type="warning"
                      :loading="updateLoading"
                      @click="handleSystemUpdate"
                    >
                      一键检查并更新 Chaite
                    </NButton>
                    <span v-if="restartCountdown > 0" class="text-sm text-green-500 font-medium">
                      更新成功！服务正在重启，{{ restartCountdown }} 秒后自动刷新页面...
                    </span>
                  </NSpace>

                  <div v-if="updateLog">
                    <div class="text-xs text-gray-400 mb-1">
                      执行输出日志：
                    </div>
                    <pre class="bg-black/80 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-60">{{ updateLog }}</pre>
                  </div>
                </NSpace>
              </NCard>
            </NTabPane>
          </NTabs>

          <div class="action-bar">
            <NSpace>
              <!--              <NButton type="default" @click="resetConfig"> -->
              <!--                重置配置 -->
              <!--              </NButton> -->
              <NButton type="primary" @click="updateConfig">
                保存配置
              </NButton>
            </NSpace>
          </div>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.config-container {
  margin: 20px;
}

.main-card {
  margin-bottom: 24px;
}

.layout-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Switch to side-by-side layout for wider screens */
@media (min-width: 992px) {
  .layout-container {
    flex-direction: row;
  }

  .sidebar {
    width: 200px;
    flex-shrink: 0;
  }

  .content-area {
    flex: 1;
    padding-left: 20px;
  }

  /* Hide tab headers in wider layout since we use side menu */
  .responsive-tabs :deep(.n-tabs-tab) {
    display: none;
  }
}

.sidebar {
  display: none;
}

@media (min-width: 992px) {
  .sidebar {
    display: block;
    border-right: 1px solid #eee;
    padding-right: 20px;
  }
}

.simple-extension-status {
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.6;
}

.simple-extension-paths {
  margin-top: 8px;
}

.simple-extension-paths div {
  word-break: break-all;
}

.inner-card {
  margin-bottom: 16px;
}

.card-header {
  margin-bottom: 8px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.card-subtitle {
  font-size: 12px;
  color: #8e8e8e;
  margin-top: 4px;
}

.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background: var(--n-color);
  padding: 12px 0;
  border-top: 1px solid rgba(140, 140, 140, 0.15);
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.mb-4 {
  margin-bottom: 16px;
}

.version-info {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #999;
  text-align: center;
}

/* Visual elements */
.demo-box {
  margin-top: 16px;
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.demo-content {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
}

.demo-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: #666;
}

.highlight {
  color: #18a058;
  font-weight: 500;
}

.demo-text {
  line-height: 1.8;
}

.form-hint {
  font-size: 12px;
  color: #999;
}

.preset-map-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-map-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 8px;
}

.preset-map-keyword-container {
  width: 40%;
}

.preset-map-keywords {
  width: 100%;
}

.preset-map-arrow {
  color: #999;
  flex-shrink: 0;
}

.preset-map-preset {
  width: 25%;
}

.preset-map-priority {
  width: 15%;
}

.preset-map-recall {
  flex-shrink: 0;
  margin-left: 8px;
}

.preset-map-delete {
  flex-shrink: 0;
}
</style>
