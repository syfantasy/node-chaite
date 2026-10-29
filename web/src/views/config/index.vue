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
import IconLinkMemory from '~icons/icon-park-outline/brain'
import IconLinkVision from '~icons/icon-park-outline/preview-open'
import type { CustomConfig } from '@/service/api/config'
import { fetchConfig, saveConfig } from '@/service/api/config'
import { fetchAllPresetList } from '@/service/api/presets'
import { fetchVisionChannelModels } from '@/service/api/channels'
import { cleanUnusedImages, fetchMaintenanceStats, pruneHistory } from '@/service/api/maintenance'
import type { MaintenanceStats } from '@/service/api/maintenance'
import type { DownloadSimpleExtensionParams, MemoryConfig, SimpleExtensionStatus } from '@/service/api/memory'
import {
  downloadSimpleExtension,
  fetchMemoryConfig,
  fetchSimpleExtensionStatus,
  updateMemoryConfig,
} from '@/service/api/memory'
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
    label: '记忆配置',
    key: 'memory',
    icon: renderIcon(IconLinkMemory),
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
    label: 'Chaite配置',
    key: 'chaite',
    icon: renderIcon(IconLinkStar),
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
    embeddingModel: 'gemini-embedding-exp-03-07',
    dimensions: 0,
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

// Memory configuration (separate API)
const memoryConfig = reactive({
  database: 'data/memory.db',
  vectorDimensions: 1536,
  group: {
    enable: false,
    enabledGroups: [],
    extractionModel: '',
    extractionPresetId: '',
    minMessageCount: 80,
    maxMessageWindow: 300,
    retrievalMode: 'hybrid' as 'vector' | 'keyword' | 'hybrid',
    hybridPrefer: 'vector-first' as 'vector-first' | 'keyword-first',
    historyPollInterval: 300,
    historyBatchSize: 120,
    promptHeader: '# 群聊长期记忆',
    promptItemTemplate: '- ${fact}${topicSuffix}',
    promptFooter: '',
    extractionSystemPrompt: '',
    extractionUserPrompt: '',
    vectorMaxDistance: 0,
    textMaxBm25Score: 0,
    maxFactsPerInjection: 5,
    minImportanceForInjection: 0.3,
  },
  user: {
    enable: false,
    whitelist: [],
    blacklist: [],
    extractionModel: '',
    extractionPresetId: '',
    maxItemsPerInjection: 5,
    maxRelevantItemsPerQuery: 3,
    minImportanceForInjection: 0,
    promptHeader: '# 用户画像',
    promptItemTemplate: '- ${value}',
    promptFooter: '',
    extractionSystemPrompt: '',
    extractionUserPrompt: '',
  },
  extensions: {
    simple: {
      enable: false,
      libraryPath: '',
      dictPath: '',
      useJieba: false,
    },
  },
}) as MemoryConfig

const simpleAssetOptions = [
  { label: '自动识别 (推荐)', value: 'auto' },
  { label: 'Linux x64', value: 'linux-x64' },
  { label: 'Linux ARM64', value: 'linux-arm64' },
  { label: 'Windows x64', value: 'win32-x64' },
  { label: 'Windows x86 (32位)', value: 'win32-ia32' },
  { label: 'Windows ARM64', value: 'win32-arm64' },
  { label: 'macOS x64', value: 'darwin-x64' },
] as const

const simpleStatus = ref<SimpleExtensionStatus | null>(null)
const simpleStatusLoading = ref(false)
const simpleDownloadLoading = ref(false)
const simpleSelectedAsset = ref<typeof simpleAssetOptions[number]['value']>('auto')
const simpleCustomAssetName = ref('')
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

function applyMemoryConfigPayload(payload?: Partial<MemoryConfig>) {
  if (!payload) {
    return
  }
  if (typeof payload.database === 'string') {
    memoryConfig.database = payload.database
  }
  if (typeof payload.vectorDimensions === 'number') {
    memoryConfig.vectorDimensions = payload.vectorDimensions
  }
  if (payload.group) {
    Object.assign(memoryConfig.group, payload.group)
  }
  if (payload.user) {
    Object.assign(memoryConfig.user, payload.user)
  }
  if (payload.extensions?.simple) {
    Object.assign(memoryConfig.extensions.simple, payload.extensions.simple)
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
    groupContext: {
      ...config.groupContext,
      ...(data.data?.groupContext || {}),
    },
    maintenance: {
      ...config.maintenance,
      ...(data.data?.maintenance || {}),
    },
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

// Memory config functions
// eslint-disable-next-line unused-imports/no-unused-vars
async function getMemoryConfig() {
  try {
    const data = await fetchMemoryConfig()
    if (data.isSuccess) {
      applyMemoryConfigPayload(data.data)
    }
    else {
      message.error('记忆配置加载失败')
    }
  }
  catch (error) {
    console.error('Failed to load memory config:', error)
  }
}

// eslint-disable-next-line unused-imports/no-unused-vars
async function updateMemoryConfigData() {
  try {
    const res = await updateMemoryConfig(memoryConfig)
    if (res.isSuccess) {
      message.success('记忆配置保存成功')
      applyMemoryConfigPayload(res.data)
      await refreshSimpleExtensionStatus()
    }
    else {
      message.error(res.message || '记忆配置保存失败')
    }
  }
  catch (error) {
    console.error('Failed to update memory config:', error)
    message.error('记忆配置保存失败')
  }
}

async function refreshSimpleExtensionStatus() {
  simpleStatusLoading.value = true
  try {
    const res = await fetchSimpleExtensionStatus()
    if (res.isSuccess) {
      simpleStatus.value = res.data
    }
  }
  catch (error) {
    console.warn('Simple extension not active or installed:', error)
  }
  finally {
    simpleStatusLoading.value = false
  }
}

async function handleDownloadSimpleExtension() {
  const payload: DownloadSimpleExtensionParams = {}
  if (simpleSelectedAsset.value !== 'auto') {
    payload.assetKey = simpleSelectedAsset.value
  }
  if (simpleCustomAssetName.value.trim().length > 0) {
    payload.assetName = simpleCustomAssetName.value.trim()
  }
  simpleDownloadLoading.value = true
  try {
    const res = await downloadSimpleExtension(payload)
    if (res.isSuccess) {
      message.success('扩展下载完成，记得保存配置并启用分词。')
      if (res.data.assetKey && simpleAssetOptions.some(option => option.value === res.data.assetKey)) {
        simpleSelectedAsset.value = res.data.assetKey as typeof simpleAssetOptions[number]['value']
      } else {
        simpleSelectedAsset.value = 'auto'
      }
      simpleCustomAssetName.value = ''
      memoryConfig.extensions.simple.libraryPath = res.data.libraryPath
      memoryConfig.extensions.simple.dictPath = res.data.dictPath
      await refreshSimpleExtensionStatus()
    }
    else {
      message.error(res.message || '扩展下载失败')
    }
  }
  catch (error) {
    console.error('Failed to download simple extension:', error)
    message.error('扩展下载失败')
  }
  finally {
    simpleDownloadLoading.value = false
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
  try {
    await Promise.all([getConfig(), getMemoryConfig(), loadVisionChannels()])
    fetchPresets()
    await refreshSimpleExtensionStatus()
  }
  catch (error) {
    console.error('加载配置失败:', error)
    message.error('配置加载失败')
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
                      设置默认使用的模型和嵌入模型
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.llm">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <!--                    <NFormItemGridItem span="24 s:24 m:12" label="默认模型" path="defaultModel"> -->
                    <!--                      <NInput v-model:value="config.llm.defaultModel" placeholder="输入默认模型名称" /> -->
                    <!--                    </NFormItemGridItem> -->

                    <NFormItemGridItem span="24 s:24 m:12" label="嵌入模型" path="embeddingModel">
                      <NInput v-model:value="config.llm.embeddingModel" placeholder="输入嵌入模型名称" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="嵌入维度" path="dimensions">
                      <NInputNumber
                        v-model:value="config.llm.dimensions"
                        clearable
                        placeholder="0表示自动"
                        :min="0"
                        style="width: 100%"
                      />
                    </NFormItemGridItem>

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
                <NForm label-placement="left" label-width="auto" :model="config.groupContext">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
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

            <!-- 记忆配置选项卡 -->
            <NTabPane name="memory" tab="记忆配置">
              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      基础配置
                    </div>
                    <div class="card-subtitle">
                      配置记忆系统的基础参数
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="memoryConfig">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24 s:24 m:12" label="数据库路径" path="database">
                      <NInput v-model:value="memoryConfig.database" placeholder="data/memory.db" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="向量维度" path="vectorDimensions">
                      <NInputNumber v-model:value="memoryConfig.vectorDimensions" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      群组记忆配置
                    </div>
                    <div class="card-subtitle">
                      配置群组事实记忆的提取和检索参数
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="memoryConfig.group">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24 s:24 m:12" label="启用群组记忆" path="enable">
                      <NSwitch v-model:value="memoryConfig.group.enable" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="启用的群组" path="enabledGroups">
                      <NDynamicTags v-model:value="memoryConfig.group.enabledGroups" placeholder="输入群组ID并按回车添加" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="提取模型" path="extractionModel">
                      <NInput v-model:value="memoryConfig.group.extractionModel" placeholder="模型名称" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="提取预设ID" path="extractionPresetId">
                      <NSelect
                        v-model:value="memoryConfig.group.extractionPresetId"
                        :options="presetOptions"
                        filterable
                        placeholder="选择预设"
                        clearable
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="最少消息数" path="minMessageCount">
                      <NInputNumber v-model:value="memoryConfig.group.minMessageCount" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="最大消息窗口" path="maxMessageWindow">
                      <NInputNumber v-model:value="memoryConfig.group.maxMessageWindow" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="历史轮询间隔(秒)" path="historyPollInterval">
                      <NInputNumber
                        v-model:value="memoryConfig.group.historyPollInterval"
                        :min="0"
                        style="width: 100%"
                      >
                        <template #suffix>
                          秒
                        </template>
                      </NInputNumber>
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="历史采样条数" path="historyBatchSize">
                      <NInputNumber v-model:value="memoryConfig.group.historyBatchSize" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="检索模式" path="retrievalMode">
                      <NSelect
                        v-model:value="memoryConfig.group.retrievalMode"
                        :options="[
                          { label: '向量检索', value: 'vector' },
                          { label: '关键词检索', value: 'keyword' },
                          { label: '混合检索', value: 'hybrid' },
                        ]"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="混合检索优先" path="hybridPrefer">
                      <NSelect
                        v-model:value="memoryConfig.group.hybridPrefer"
                        :options="[
                          { label: '向量优先', value: 'vector-first' },
                          { label: '关键词优先', value: 'keyword-first' },
                        ]"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="每次注入最多Facts数" path="maxFactsPerInjection">
                      <NInputNumber v-model:value="memoryConfig.group.maxFactsPerInjection" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="注入最低重要度" path="minImportanceForInjection">
                      <NInputNumber v-model:value="memoryConfig.group.minImportanceForInjection" :min="0" :max="1" :step="0.1" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="向量距离阈值" path="vectorMaxDistance">
                      <NInputNumber
                        v-model:value="memoryConfig.group.vectorMaxDistance"
                        :min="0"
                        :step="0.01"
                        style="width: 100%"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="文本BM25阈值" path="textMaxBm25Score">
                      <NInputNumber
                        v-model:value="memoryConfig.group.textMaxBm25Score"
                        :min="0"
                        :step="0.1"
                        style="width: 100%"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Prompt标题模板" path="promptHeader">
                      <NInput
                        v-model:value="memoryConfig.group.promptHeader"
                        type="textarea"
                        :autosize="{ minRows: 1, maxRows: 3 }"
                        placeholder="例如：# 群聊长期记忆"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Prompt条目模板" path="promptItemTemplate">
                      <NInput
                        v-model:value="memoryConfig.group.promptItemTemplate"
                        type="textarea"
                        :autosize="{ minRows: 2, maxRows: 6 }"
                        placeholder="可使用占位符：${fact}、${topicSuffix}、${order}、${distance} 等"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Prompt结束模板" path="promptFooter">
                      <NInput
                        v-model:value="memoryConfig.group.promptFooter"
                        type="textarea"
                        :autosize="{ minRows: 1, maxRows: 3 }"
                        placeholder="可选"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="抽取系统提示" path="extractionSystemPrompt">
                      <NInput
                        v-model:value="memoryConfig.group.extractionSystemPrompt"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 8 }"
                        placeholder="可选，覆盖内置的群记忆抽取系统提示"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="抽取用户提示模板" path="extractionUserPrompt">
                      <NInput
                        v-model:value="memoryConfig.group.extractionUserPrompt"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 8 }"
                        placeholder="可选，可使用 ${messages} 作为占位符"
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      用户记忆配置
                    </div>
                    <div class="card-subtitle">
                      配置用户个性化记忆的提取参数
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="memoryConfig.user">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24 s:24 m:12" label="启用用户记忆" path="enable">
                      <NSwitch v-model:value="memoryConfig.user.enable" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="白名单用户" path="whitelist">
                      <NDynamicTags v-model:value="memoryConfig.user.whitelist" placeholder="输入用户ID并按回车添加" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="黑名单用户" path="blacklist">
                      <NDynamicTags v-model:value="memoryConfig.user.blacklist" placeholder="输入用户ID并按回车添加" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="提取模型" path="extractionModel">
                      <NInput v-model:value="memoryConfig.user.extractionModel" placeholder="模型名称" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="提取预设ID" path="extractionPresetId">
                      <NSelect
                        v-model:value="memoryConfig.user.extractionPresetId"
                        :options="presetOptions"
                        filterable
                        placeholder="选择预设"
                        clearable
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="每次注入最多条目数" path="maxItemsPerInjection">
                      <NInputNumber v-model:value="memoryConfig.user.maxItemsPerInjection" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="检索返回数量" path="maxRelevantItemsPerQuery">
                      <NInputNumber v-model:value="memoryConfig.user.maxRelevantItemsPerQuery" :min="0" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="最低重要度" path="minImportanceForInjection">
                      <NInputNumber v-model:value="memoryConfig.user.minImportanceForInjection" :min="0" :max="1" :step="0.1" style="width: 100%" />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Prompt标题模板" path="promptHeader">
                      <NInput
                        v-model:value="memoryConfig.user.promptHeader"
                        type="textarea"
                        :autosize="{ minRows: 1, maxRows: 3 }"
                        placeholder="例如：# 用户画像"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Prompt条目模板" path="promptItemTemplate">
                      <NInput
                        v-model:value="memoryConfig.user.promptItemTemplate"
                        type="textarea"
                        :autosize="{ minRows: 2, maxRows: 6 }"
                        placeholder="可使用占位符：${value}、${order}、${importance} 等"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Prompt结束模板" path="promptFooter">
                      <NInput
                        v-model:value="memoryConfig.user.promptFooter"
                        type="textarea"
                        :autosize="{ minRows: 1, maxRows: 3 }"
                        placeholder="可选"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="抽取系统提示" path="extractionSystemPrompt">
                      <NInput
                        v-model:value="memoryConfig.user.extractionSystemPrompt"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 8 }"
                        placeholder="可选，覆盖内置的用户记忆抽取系统提示"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="抽取用户提示模板" path="extractionUserPrompt">
                      <NInput
                        v-model:value="memoryConfig.user.extractionUserPrompt"
                        type="textarea"
                        :autosize="{ minRows: 3, maxRows: 8 }"
                        placeholder="可选，可使用 ${messages} 作为占位符"
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>
              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      中文分词扩展（Simple）
                    </div>
                    <div class="card-subtitle">
                      可选安装的 FTS5 中文 tokenizer，提升检索效果
                    </div>
                  </div>
                </template>
                <NSpace vertical :size="16">
                  <NAlert show-icon type="info">
                    该扩展来自 <a href="https://github.com/wangfenjin/simple" target="_blank" rel="noopener noreferrer">wangfenjin/simple</a> 项目，
                    用于提供中文和拼音分词能力。点击下方按钮自动下载，也可以手动填写库文件路径和词典目录。
                  </NAlert>
                  <NForm label-placement="left" label-width="auto" :model="memoryConfig.extensions.simple">
                    <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                      <NFormItemGridItem span="24 s:24 m:12" label="启用扩展" path="enable">
                        <NSwitch v-model:value="memoryConfig.extensions.simple.enable" />
                      </NFormItemGridItem>
                      <NFormItemGridItem span="24 s:24 m:12" label="使用结巴分词" path="useJieba">
                        <NSwitch v-model:value="memoryConfig.extensions.simple.useJieba" />
                      </NFormItemGridItem>
                      <NFormItemGridItem span="24 s:24 m:12" label="库文件路径" path="libraryPath">
                        <NInput
                          v-model:value="memoryConfig.extensions.simple.libraryPath"
                          placeholder="相对于插件目录或绝对路径，例如 resources/simple/linux-x64/libsimple.so"
                        />
                      </NFormItemGridItem>
                      <NFormItemGridItem span="24 s:24 m:12" label="词典目录" path="dictPath">
                        <NInput
                          v-model:value="memoryConfig.extensions.simple.dictPath"
                          placeholder="可选，使用结巴分词时需要，例如 resources/simple/linux-x64/dict"
                        />
                      </NFormItemGridItem>
                    </NGrid>
                  </NForm>
                  <NForm label-placement="left" label-width="auto">
                    <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                      <NFormItemGridItem span="24 s:24 m:12" label="目标平台">
                        <NSelect v-model:value="simpleSelectedAsset" :options="simpleAssetOptions" />
                      </NFormItemGridItem>
                      <NFormItemGridItem span="24 s:24 m:12" label="自定义文件名">
                        <NInput
                          v-model:value="simpleCustomAssetName"
                          placeholder="可选，例如 libsimple-osx-x64.zip"
                        />
                      </NFormItemGridItem>
                      <NFormItemGridItem span="24" label=" ">
                        <NSpace>
                          <NButton type="primary" :loading="simpleDownloadLoading" @click="handleDownloadSimpleExtension">
                            下载扩展
                          </NButton>
                          <NButton :loading="simpleStatusLoading" @click="refreshSimpleExtensionStatus">
                            刷新状态
                          </NButton>
                        </NSpace>
                      </NFormItemGridItem>
                    </NGrid>
                  </NForm>
                  <div class="simple-extension-status">
                    <NSpace align="center" wrap>
                      <span>当前状态：</span>
                      <NTag v-if="simpleStatus?.loaded" type="success">已加载</NTag>
                      <NTag v-else-if="simpleStatus?.enabled" type="warning">等待加载</NTag>
                      <NTag v-else type="default">未启用</NTag>
                      <NTag v-if="simpleStatus?.libraryExists" type="success">库文件存在</NTag>
                      <NTag v-else type="error">库文件缺失</NTag>
                      <NTag
                        v-if="memoryConfig.extensions.simple.useJieba"
                        :type="simpleStatus?.dictExists ? 'success' : 'warning'"
                      >
                        词典{{ simpleStatus?.dictExists ? '可用' : '缺失' }}
                      </NTag>
                    </NSpace>
                    <div class="simple-extension-paths">
                      <div>
                        库文件：{{ simpleStatus?.resolvedLibraryPath || '未配置' }}
                      </div>
                      <div>
                        词典目录：{{ simpleStatus?.resolvedDictPath || '未配置' }}
                      </div>
                      <div>
                        服务器平台：{{ simpleStatus?.platform || '未知' }} / {{ simpleStatus?.arch || '' }}
                      </div>
                      <div v-if="simpleStatus?.error">
                        <NTag type="error" size="small">{{ simpleStatus.error }}</NTag>
                      </div>
                    </div>
                  </div>
                </NSpace>
              </NCard>
              <div class="action-bar" style="margin-top: 16px;">
                <NSpace>
                  <NButton type="primary" @click="updateMemoryConfigData">
                    保存记忆配置
                  </NButton>
                </NSpace>
              </div>
              <NCard class="inner-card" title="说明">
                <p>记忆功能配置通过独立的API接口管理（/api/memory/config）。</p>
                <p>
                  记忆数据的管理请前往 <router-link to="/memory">
                    记忆管理
                  </router-link> 页面。
                </p>
              </NCard>
            </NTabPane>

            <!-- Chaite配置选项卡 -->
            <NTabPane name="chaite" tab="Chaite配置">
              <NCard class="inner-card mb-4">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      文件与目录
                    </div>
                    <div class="card-subtitle">
                      设置Chaite相关文件目录
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.chaite">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24 s:24 m:12" label="数据目录" path="dataDir">
                      <NInput v-model:value="config.chaite.dataDir" placeholder="相对于插件目录" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="处理器目录" path="processorsDirPath">
                      <NInput v-model:value="config.chaite.processorsDirPath" placeholder="相对于插件目录" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="工具目录" path="toolsDirPath">
                      <NInput v-model:value="config.chaite.toolsDirPath" placeholder="相对于插件目录" />
                    </NFormItemGridItem>
                  </NGrid>
                </NForm>
              </NCard>

              <NCard class="inner-card">
                <template #header>
                  <div class="card-header">
                    <div class="card-title">
                      API与管理面板
                    </div>
                    <div class="card-subtitle">
                      设置云端API和管理面板配置
                    </div>
                  </div>
                </template>
                <NForm label-placement="left" label-width="auto" :model="config.chaite">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                    <NFormItemGridItem span="24" label="云端API URL" path="cloudBaseUrl">
                      <NInput v-model:value="config.chaite.cloudBaseUrl" placeholder="输入云端API URL" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="云端API Key" path="cloudApiKey">
                      <NInput
                        v-model:value="config.chaite.cloudApiKey"
                        type="password"
                        show-password-on="click"
                        placeholder="输入云端API Key"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="认证密钥" path="authKey">
                      <NInput
                        v-model:value="config.chaite.authKey"
                        type="password"
                        show-password-on="click"
                        placeholder="非必要勿修改"
                      />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="监听地址" path="host">
                      <NInput v-model:value="config.chaite.host" placeholder="管理面板监听地址" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24 s:24 m:12" label="监听端口" path="port">
                      <NInputNumber
                        v-model:value="config.chaite.port"
                        :min="1"
                        :max="65535"
                        style="width: 100%"
                        placeholder="输入监听端口"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:24 m:12" label="日志保存条数" path="operationLogLimit">
                      <NInputNumber
                        v-model:value="config.chaite.operationLogLimit"
                        :min="0"
                        :precision="0"
                        style="width: 100%"
                        placeholder="50000；设为 0 不自动清理"
                      />
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
