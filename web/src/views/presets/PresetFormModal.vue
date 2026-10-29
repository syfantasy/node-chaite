<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NButton,
  NCard,
  NCheckbox,
  NCheckboxGroup,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItemGridItem,
  NGrid,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NPopover,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NSwitch,
  NTabPane,
  NTabs,
  NTooltip,
  NAlert,
} from 'naive-ui'
import { InformationCircleOutline } from '@vicons/ionicons5'
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import type { FormInst } from 'naive-ui'
import { HarmBlockThreshold, HarmCategory } from '@/utils/constants'
import type { Shareable } from '@/typings/entities/shareable'
import { fetchAllMcpServerList, fetchSkillList } from '@/service/api/agent'

const props = defineProps({
  show: Boolean,
  editMode: Boolean,
  initialData: {
    type: Object,
    default: () => ({}),
  },
  preProcessorOptions: {
    type: Array,
    default: () => [],
  },
  postProcessorOptions: {
    type: Array,
    default: () => [],
  },
  toolsOptions: {
    type: Array,
    default: () => [],
  },
  modelOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:show', 'submit'])

const formRef = ref<FormInst | null>()

const showModal = computed({
  get: () => props.show,
  set: value => emit('update:show', value),
})

const groupContextOptions = [
  { label: '禁用', value: 'disable' },
  { label: '启用', value: 'enabled' },
  { label: '使用全局配置', value: 'use_system' },
]

const geminiBuiltinToolOptions = [
  { label: 'Google Search', value: 'googleSearch' },
  { label: 'Google Maps', value: 'googleMaps' },
  { label: '代码执行', value: 'codeExecution' },
  { label: '网址上下文', value: 'urlContext' },
]

const responseModalitiesOptions = [
  { label: '文本', value: 'text' },
  { label: '图片', value: 'image' },
]

const reasoningEffortOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
  { label: '最小', value: 'minimal' },
]

const toolChoiceTypeOptions = [
  { label: '无', value: 'none' },
  { label: 'ANY', value: 'any' },
  { label: 'AUTO', value: 'auto' },
  { label: '指定', value: 'specified' },
]

const geminiThinkingLevelOptions = [
  { label: 'MINIMAL (极低)', value: 'minimal' },
  { label: 'LOW (低)', value: 'low' },
  { label: 'MEDIUM (中)', value: 'medium' },
  { label: 'HIGH (高)', value: 'high' },
]

const claudeThinkingModeOptions = [
  { label: '自动探测', value: 'auto' },
  { label: '自适应 (adaptive)', value: 'adaptive' },
  { label: '强制开启 (enabled)', value: 'enabled' },
  { label: '禁用思考 (disabled)', value: 'disabled' },
  { label: '工具调用间思考 (between_tools)', value: 'between_tools' },
]

const claudeEffortOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Max', value: 'max' },
]

const openaiMaxTokenFieldOptions = [
  { label: 'max_completion_tokens (新推理模型)', value: 'max_completion_tokens' },
  { label: 'max_tokens (标准)', value: 'max_tokens' },
]

// Add options for safety settings
const harmCategoryOptions = Object.entries(HarmCategory)
  .map(([label, value]) => ({ label, value }))

const harmBlockThresholdOptions = Object.entries(HarmBlockThreshold)
  .map(([label, value]) => ({ label, value }))

const channelRules = {
  'name': {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入预设名称',
  },
  'description': {
    required: true,
    trigger: ['blur', 'change'],
    message: '请选择客户端类型',
  },
  'prefix': {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入基础URL',
  },
  'sendMessageOption.model': {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入模型',
  },
}

// Form data
const customOptionsText = ref('')
const prefixTags = ref<string[]>([])
const fallbackModelList = ref<string[]>([])
const whiteGroupTags = ref<string[]>([])
const blackGroupTags = ref<string[]>([])
const whiteUserTags = ref<string[]>([])
const blackUserTags = ref<string[]>([])

const mcpOptions = ref<Array<{ label: string; value: string }>>([])
const skillOptions = ref<Array<{ label: string; value: string }>>([])

function loadMcpAndSkills() {
  fetchAllMcpServerList().then((items) => {
    mcpOptions.value = (items || []).map(s => ({
      label: `${s.name} (${s.transport === 'stdio' ? (s.command || '') : (s.url || '')})`,
      value: s.id,
    }))
  }).catch(() => {})

  fetchSkillList({}).then((res) => {
    if (res.code === 0 && res.data?.items) {
      skillOptions.value = res.data.items.map(sk => ({
        label: `${sk.frontmatter.name || sk.id} (${(sk.frontmatter.keywords || []).join('、') || '无暗号'})`,
        value: sk.id,
      }))
    }
  }).catch(() => {})
}

watch(() => props.show, (val) => {
  if (val)
    loadMcpAndSkills()
}, { immediate: true })

function addFallbackModel() {
  fallbackModelList.value.push('')
}

function removeFallbackModel(index: number) {
  fallbackModelList.value.splice(index, 1)
}

const addPreset = ref<Partial<Shareable.PresetModel>>({
  modelType: 'settings',
  name: '',
  embedded: false,
  description: '',
  isBymMode: false,
  showThinking: false,
  customOptions: undefined,
  autoTriggerProbability: 0,
  enableRetry: false,
  maxRetries: 2,
  enableFallback: false,
  fallbackModel: '',
  prefixAnywhere: true,
  sendMessageOption: {
    systemOverride: '',
    temperature: 0.6,
    model: '',
    maxToken: 4000,
    stream: true,
    enableReasoning: false,
    reasoningEffort: 'medium',
    reasoningBudgetTokens: 2000,
    openaiMaxTokenField: 'max_completion_tokens',
    claudeThinkingMode: 'auto',
    claudeEffort: 'medium',
    geminiThinkingLevel: 'medium',
    toolChoice: {
      type: 'auto',
      tools: [],
    } as Shareable.ToolChoice,
    toolGroupId: ['default_local'],
    toolMountMode: 'basic',
    mcpServerIds: [],
    enabledSkills: [],
    geminiBuiltinTools: [],
    responseModalities: undefined,
    safetySettings: undefined,
  } as Shareable.SendMessageOption,
  prefix: '',
  local: true,
  groupContext: 'use_system',
  builtinToolCategories: [],
})

// Initialize form when in edit mode
watch(() => props.initialData, (newVal) => {
  if (props.editMode && newVal) {
    // Ensure all required nested properties exist
    const data = { ...newVal }
    if (!data.sendMessageOption) {
      data.sendMessageOption = {}
    }

    if (!data.sendMessageOption.toolChoice) {
      data.sendMessageOption.toolChoice = { type: 'auto', tools: [] }
    }

    if (!data.sendMessageOption.toolMountMode) {
      data.sendMessageOption.toolMountMode = 'basic'
    }
    if (!Array.isArray(data.sendMessageOption.mcpServerIds)) {
      data.sendMessageOption.mcpServerIds = []
    }
    if (!Array.isArray(data.sendMessageOption.enabledSkills)) {
      data.sendMessageOption.enabledSkills = []
    }

    if (!Array.isArray(data.builtinToolCategories)) {
      data.builtinToolCategories = []
    }
    if (!Array.isArray(data.sendMessageOption.geminiBuiltinTools)) {
      data.sendMessageOption.geminiBuiltinTools = []
    }
    if (data.isBymMode === undefined) {
      data.isBymMode = !!data.disableConversationContext
    }
    if (data.prefixAnywhere === undefined) {
      data.prefixAnywhere = true
    }
    if (data.quoteReply === undefined) {
      data.quoteReply = false
    }
    if (data.showThinking === undefined) {
      data.showThinking = false
    }
    if (data.autoTriggerProbability === undefined) {
      data.autoTriggerProbability = 0
    }
    if (data.enableRetry === undefined) {
      data.enableRetry = false
    }
    if (data.maxRetries === undefined) {
      data.maxRetries = 2
    }
    if (data.enableFallback === undefined) {
      data.enableFallback = false
    }
    if (data.fallbackModel === undefined) {
      data.fallbackModel = ''
    }

    // 规范化前缀为 tags
    if (Array.isArray(data.prefixes) && data.prefixes.length > 0) {
      prefixTags.value = [...data.prefixes]
    } else if (data.prefix && typeof data.prefix === 'string') {
      prefixTags.value = [data.prefix]
    } else {
      prefixTags.value = []
    }

    // 规范化顺延备用模型
    if (Array.isArray(data.fallbackModels) && data.fallbackModels.length > 0) {
      fallbackModelList.value = [...data.fallbackModels]
    } else if (data.fallbackModel) {
      fallbackModelList.value = [data.fallbackModel]
    } else {
      fallbackModelList.value = []
    }

    // 规范化群/员黑白名单
    whiteGroupTags.value = Array.isArray(data.whiteGroups) ? [...data.whiteGroups] : []
    blackGroupTags.value = Array.isArray(data.blackGroups) ? [...data.blackGroups] : []
    whiteUserTags.value = Array.isArray(data.whiteUsers) ? [...data.whiteUsers] : []
    blackUserTags.value = Array.isArray(data.blackUsers) ? [...data.blackUsers] : []

    // 自动为旧模型补全渠道前缀
    if (data.sendMessageOption?.model && !data.sendMessageOption.model.includes('/')) {
      const curModel = data.sendMessageOption.model
      for (const opt of (props.modelOptions as any[] || [])) {
        if (opt.children) {
          const match = opt.children.find((c: any) => c.value?.endsWith(`/${curModel}`))
          if (match) {
            data.sendMessageOption.model = match.value
            break
          }
        }
      }
    }

    customOptionsText.value = data.customOptions ? JSON.stringify(data.customOptions, null, 2) : ''

    addPreset.value = data
  }
}, { immediate: true })

// Add safety setting
function addSafetySetting() {
  if (!addPreset.value.sendMessageOption!.safetySettings) {
    addPreset.value.sendMessageOption!.safetySettings = []
  }

  addPreset.value.sendMessageOption!.safetySettings.push({
    // method: HarmBlockMethod.HARM_BLOCK_METHOD_UNSPECIFIED,
    category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
    threshold: HarmBlockThreshold.HARM_BLOCK_THRESHOLD_UNSPECIFIED,
  })
}

// Remove safety setting
function removeSafetySetting(index: number) {
  if (addPreset.value.sendMessageOption?.safetySettings) {
    addPreset.value.sendMessageOption.safetySettings.splice(index, 1)
  }
}

function handleAddPreset() {
  if (customOptionsText.value.trim()) {
    try {
      addPreset.value.customOptions = JSON.parse(customOptionsText.value.trim())
    } catch (e: any) {
      message.error(`自定义参数 JSON 解析失败: ${e.message}`)
      return
    }
  } else {
    addPreset.value.customOptions = undefined
  }

  formRef.value?.validate().then((errors) => {
    if (Array.isArray(errors)) {
      console.error(errors)
      return
    }
    addPreset.value.prefixes = [...prefixTags.value]
    addPreset.value.prefix = prefixTags.value[0] || ''
    addPreset.value.fallbackModels = fallbackModelList.value.filter(m => m && m.trim().length > 0)
    addPreset.value.fallbackModel = addPreset.value.fallbackModels[0] || ''
    addPreset.value.whiteGroups = [...whiteGroupTags.value]
    addPreset.value.blackGroups = [...blackGroupTags.value]
    addPreset.value.whiteUsers = [...whiteUserTags.value]
    addPreset.value.blackUsers = [...blackUserTags.value]

    emit('submit', addPreset.value)
    showModal.value = false
  })
}

// Reset form when modal is closed
watch(showModal, (val) => {
  if (!val && !props.editMode) {
    addPreset.value = {
      modelType: 'settings',
      name: '',
      embedded: false,
      description: '',
      sendMessageOption: {
        systemOverride: '',
        temperature: 0.6,
        model: '',
        maxToken: 4000,
        isThinkingModel: false,
        disableHistoryRead: false,
        disableHistorySave: false,
        stream: true,
        enableReasoning: false,
        reasoningEffort: 'medium',
        reasoningBudgetTokens: 2000,
        toolChoice: {
          type: 'auto',
          tools: [],
        },
        toolGroupId: ['default_local'],
        toolMountMode: 'basic',
        mcpServerIds: [],
        enabledSkills: [],
        geminiBuiltinTools: [],
        responseModalities: undefined,
        safetySettings: undefined,
      },
      prefix: '',
      local: true,
      groupContext: 'use_system',
      builtinToolCategories: [],
      disableSystemInstructions: false,
      disableConversationContext: false,
      quoteReply: false,
      showThinking: false,
      customOptions: undefined,
      autoTriggerProbability: 0,
      enableRetry: false,
      maxRetries: 2,
      enableFallback: false,
      fallbackModel: '',
      groupContextMinMessages: undefined,
      groupContextMinTokens: undefined,
      groupContextMaxMessages: undefined,
      groupContextMaxTokens: undefined,
    }
  }
})
</script>

<template>
  <div>
    <NModal v-model:show="showModal" preset="card" style="width: 700px; max-width: 90vw">
      <NCard :title="editMode ? '编辑预设' : '添加预设'">
        <NForm ref="formRef" :rules="channelRules" :model="addPreset">
          <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="self" item-responsive>
            <!-- 预设名称 -->
            <NFormItemGridItem span="12 s:8 m:8" label="名称" path="name">
              <NInput v-model:value="addPreset.name" placeholder="请输入预设名称" />
            </NFormItemGridItem>

            <!-- 预设前缀 -->
            <NFormItemGridItem span="12 s:8 m:8" label="前缀 (触发词)" path="prefix">
              <div style="width: 100%;">
                <NDynamicTags v-model:value="prefixTags" />
                <div class="text-xs text-gray-400 mt-1">支持配置多个触发前缀词（回车添加）</div>
              </div>
            </NFormItemGridItem>

            <!-- 任意位置匹配前缀 -->
            <NFormItemGridItem span="12 s:8 m:8" label="任意位置匹配前缀" path="prefixAnywhere">
              <div style="display: flex; align-items: center; height: 34px;">
                <NSwitch v-model:value="addPreset.prefixAnywhere" />
                <NTooltip placement="top" trigger="hover">
                  <template #trigger>
                    <NIcon size="18" style="margin-left: 8px; cursor: pointer;">
                      <InformationCircleOutline />
                    </NIcon>
                  </template>
                  <span>开启后，群消息任意位置包含该前缀即可触发对话（如'群友问小誓约吃了吗'）；关闭则仅在消息以该前缀开头时才触发。默认开启。</span>
                </NTooltip>
              </div>
            </NFormItemGridItem>

            <!-- 伪人模式 -->
            <NFormItemGridItem span="12 s:8 m:8" label="伪人模式" path="isBymMode">
              <div style="display: flex; align-items: center; height: 34px;">
                <NSwitch v-model:value="addPreset.isBymMode" />
                <NTooltip placement="top" trigger="hover">
                  <template #trigger>
                    <NIcon size="18" style="margin-left: 8px; cursor: pointer;">
                      <InformationCircleOutline />
                    </NIcon>
                  </template>
                  <span>开启后作为独立群友插话：单轮独立响应，不绑定多轮记忆，且不向数据库写入死历史。</span>
                </NTooltip>
              </div>
            </NFormItemGridItem>

            <!-- 引用原消息 -->
            <NFormItemGridItem span="12 s:8 m:8" label="引用原消息" path="quoteReply">
              <div style="display: flex; align-items: center; height: 34px;">
                <NSwitch v-model:value="addPreset.quoteReply" />
                <NTooltip placement="top" trigger="hover">
                  <template #trigger>
                    <NIcon size="18" style="margin-left: 8px; cursor: pointer;">
                      <InformationCircleOutline />
                    </NIcon>
                  </template>
                  <span>开启后回复时会带上原消息的引用；关闭则直接发送内容，不产生引用回复。默认关闭。</span>
                </NTooltip>
              </div>
            </NFormItemGridItem>

            <!-- 自动触发概率 -->
            <NFormItemGridItem span="12 s:8 m:8" label="自动触发概率 (0~1)" path="autoTriggerProbability">
              <div style="display: flex; align-items: center; width: 100%;">
                <NInputNumber
                  v-model:value="addPreset.autoTriggerProbability"
                  :min="0"
                  :max="1"
                  :step="0.01"
                  placeholder="0 (不自动触发)"
                  style="flex: 1;"
                />
                <NTooltip placement="top" trigger="hover">
                  <template #trigger>
                    <NIcon size="18" style="margin-left: 8px; cursor: pointer; flex-shrink: 0;">
                      <InformationCircleOutline />
                    </NIcon>
                  </template>
                  <span>群消息无需命中前缀或 @，以此概率随机自动唤醒该预设（0 为不自动触发，1 为 100% 触发）。不论是否开启伪人模式均生效。</span>
                </NTooltip>
              </div>
            </NFormItemGridItem>

            <!-- 模型 -->
            <NFormItemGridItem span="12 s:8 m:8" label="模型" path="sendMessageOption.model">
              <NSelect
                v-model:value="addPreset.sendMessageOption!!.model"
                :options="modelOptions as SelectMixedOption[]"
                filterable
                tag
                clearable
                placeholder="选择 渠道/模型，或直接输入"
              />
            </NFormItemGridItem>

            <!-- 温度 -->
            <NFormItemGridItem span="12 s:8 m:8" label="温度" path="sendMessageOption.temperature">
              <div style="display: flex; align-items: center; width: 100%;">
                <NInputNumber v-model:value="addPreset.sendMessageOption!!.temperature" placeholder="请输入温度" style="flex: 1;" />
                <NTooltip placement="top" trigger="hover">
                  <template #trigger>
                    <NIcon size="18" style="margin-left: 8px; cursor: pointer; flex-shrink: 0;">
                      <InformationCircleOutline />
                    </NIcon>
                  </template>
                  <span>采样温度（0 ~ 2）。数值越低输出越稳定严谨，数值越高输出越富创造力与随机性。</span>
                </NTooltip>
              </div>
            </NFormItemGridItem>

            <!-- 最大Token -->
            <NFormItemGridItem span="12 s:8 m:8" label="最大Token" path="sendMessageOption.maxToken">
              <div style="display: flex; align-items: center; width: 100%;">
                <NInputNumber v-model:value="addPreset.sendMessageOption!!.maxToken" placeholder="最大Token数" style="flex: 1;" />
                <NTooltip placement="top" trigger="hover">
                  <template #trigger>
                    <NIcon size="18" style="margin-left: 8px; cursor: pointer; flex-shrink: 0;">
                      <InformationCircleOutline />
                    </NIcon>
                  </template>
                  <span>模型单次回答允许生成的最大 Token 数量。</span>
                </NTooltip>
              </div>
            </NFormItemGridItem>

            <NFormItemGridItem span="12 s:12 m:6" label="输出思考内容" path="showThinking">
              <div style="display: flex; align-items: center;">
                <NCheckbox v-model:checked="addPreset.showThinking">
                  以合并转发输出思考
                </NCheckbox>
                <NTooltip placement="top" trigger="hover">
                  <template #trigger>
                    <NIcon size="18" style="margin-left: 8px; cursor: pointer; flex-shrink: 0;">
                      <InformationCircleOutline />
                    </NIcon>
                  </template>
                  <span>开启后，若模型输出包含思考/推理过程（如 DeepSeek/Gemini/Claude），将以合并转发聊天记录的形式随消息单独发送。默认关闭。</span>
                </NTooltip>
              </div>
            </NFormItemGridItem>

            <!-- 系统提示词 -->
            <NFormItemGridItem span="24" label="系统提示词" path="sendMessageOption.systemOverride">
              <div style="width: 100%;">
                <NInput v-model:value="addPreset.sendMessageOption!!.systemOverride" type="textarea" placeholder="请输入提示词（赋予机器人特定人格、语气或规则）" :autosize="{ minRows: 3, maxRows: 12 }" />
              </div>
            </NFormItemGridItem>
          </NGrid>

          <!-- Advanced Settings in Collapsible Panel with Decoupled Tabs -->
          <NCollapse class="mt-4">
            <NCollapseItem title="高级设置与渠道规范" name="advanced">
              <NTabs type="segment" animated>
                <!-- 通用设置 -->
                <NTabPane name="common" tab="通用设置">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive class="pt-2">
                    <!-- 流模式 -->
                    <NFormItemGridItem span="12 s:12 m:6" label="流模式" path="sendMessageOption.stream">
                      <NCheckbox v-model:checked="addPreset.sendMessageOption!!.stream">
                        启用流模式
                      </NCheckbox>
                    </NFormItemGridItem>

                    <!-- 携带群聊上下文 -->
                    <NFormItemGridItem span="12 s:12 m:12" label="携带群聊上下文" path="groupContext">
                      <NSelect
                        v-model:value="addPreset.groupContext"
                        :options="groupContextOptions"
                        placeholder="请选择群聊上下文设置"
                      />
                    </NFormItemGridItem>

                    <!-- 群聊上下文覆盖配置（选填，留空继承全局） -->
                    <NFormItemGridItem v-if="addPreset.groupContext !== 'disable'" span="24" label="群聊上下文覆盖阈值（选填，留空继承全局）">
                      <NGrid :cols="24" :x-gap="12" responsive="screen">
                        <NFormItemGridItem span="12 s:6 m:6" label="最低条数">
                          <NInputNumber v-model:value="addPreset.groupContextMinMessages" placeholder="全局: 20" :min="1" clearable style="width: 100%;" />
                        </NFormItemGridItem>
                        <NFormItemGridItem span="12 s:6 m:6" label="最低Token">
                          <NInputNumber v-model:value="addPreset.groupContextMinTokens" placeholder="全局: 2000" :min="100" clearable style="width: 100%;" />
                        </NFormItemGridItem>
                        <NFormItemGridItem span="12 s:6 m:6" label="上限条数">
                          <NInputNumber v-model:value="addPreset.groupContextMaxMessages" placeholder="全局: 100" :min="1" clearable style="width: 100%;" />
                        </NFormItemGridItem>
                        <NFormItemGridItem span="12 s:6 m:6" label="上限Token">
                          <NInputNumber v-model:value="addPreset.groupContextMaxTokens" placeholder="全局: 10000" :min="500" clearable style="width: 100%;" />
                        </NFormItemGridItem>
                      </NGrid>
                    </NFormItemGridItem>

                    <!-- 处理器设置 -->
                    <NFormItemGridItem span="24 s:12 m:12" label="处理器" path="processors">
                      <NSpace>
                        <NPopover trigger="hover" placement="bottom" :width="260">
                          <template #trigger>
                            <NButton size="small">
                              前处理器
                            </NButton>
                          </template>
                          <NSelect
                            v-model:value="addPreset.sendMessageOption!!.preProcessorIds"
                            multiple
                            placeholder="请选择前处理器"
                            :options="preProcessorOptions as SelectMixedOption[]"
                          />
                        </NPopover>
                        <NPopover trigger="hover" placement="bottom" :width="260">
                          <template #trigger>
                            <NButton size="small">
                              后处理器
                            </NButton>
                          </template>
                          <NSelect
                            v-model:value="addPreset.sendMessageOption!!.postProcessorIds"
                            multiple
                            placeholder="请选择后处理器"
                            :options="postProcessorOptions as SelectMixedOption[]"
                          />
                        </NPopover>
                      </NSpace>
                    </NFormItemGridItem>

                    <!-- 工具与能力装配分区 -->
                    <NFormItemGridItem span="24" label="工具与能力装配模式">
                      <NRadioGroup v-model:value="addPreset.sendMessageOption!!.toolMountMode">
                        <NSpace>
                          <NRadio value="basic">
                            🟢 基础常驻模式 (常规全量携带 · 开箱即用)
                          </NRadio>
                          <NRadio value="skill">
                            🟡 智能技能模式 (进阶按需唤醒 · 极致省 Token)
                          </NRadio>
                        </NSpace>
                      </NRadioGroup>
                    </NFormItemGridItem>

                    <!-- 基础模式下的配置 -->
                    <template v-if="addPreset.sendMessageOption!!.toolMountMode === 'basic'">
                      <NFormItemGridItem span="24 s:12 m:12" label="常驻本地工具组">
                        <NSelect
                          v-model:value="addPreset.sendMessageOption!!.toolGroupId"
                          multiple
                          filterable
                          placeholder="选择每轮对话常驻携带的工具组"
                          :options="toolsOptions as SelectMixedOption[]"
                        />
                      </NFormItemGridItem>

                      <NFormItemGridItem span="24 s:12 m:12" label="常驻 MCP 服务">
                        <NSelect
                          v-model:value="addPreset.sendMessageOption!!.mcpServerIds"
                          multiple
                          filterable
                          placeholder="选择每轮对话常驻挂载的 MCP 服务"
                          :options="mcpOptions as SelectMixedOption[]"
                        />
                      </NFormItemGridItem>
                    </template>

                    <!-- 智能技能模式下的配置 -->
                    <template v-else>
                      <NFormItemGridItem span="24" label="技能动态唤醒说明">
                        <NAlert type="info" :show-icon="true">
                          智能技能模式下，闲聊对话仅携带轻量常驻底座；当用户触发特定暗号或意图时，Chaite 会自动动态加载对应技能绑定的工具及 MCP 服务，有效避免上下文膨胀与误调用。
                        </NAlert>
                      </NFormItemGridItem>

                      <NFormItemGridItem span="24 s:12 m:12" label="轻量常驻底座 (高频基础工具)">
                        <NSelect
                          v-model:value="addPreset.sendMessageOption!!.toolGroupId"
                          multiple
                          filterable
                          placeholder="日常轻量工具组（如表情包、日常问候）"
                          :options="toolsOptions as SelectMixedOption[]"
                        />
                      </NFormItemGridItem>

                      <NFormItemGridItem span="24 s:12 m:12" label="允许动态唤醒的技能 (Skills)">
                        <NSelect
                          v-model:value="addPreset.sendMessageOption!!.enabledSkills"
                          multiple
                          filterable
                          placeholder="留空表示允许唤醒所有已配置技能"
                          :options="skillOptions as SelectMixedOption[]"
                        />
                      </NFormItemGridItem>
                    </template>

                    <!-- 工具选择 -->
                    <NFormItemGridItem span="24" label="工具选择策略" path="sendMessageOption.toolChoice">
                      <div style="display: flex; align-items: center; width: 100%;">
                        <NSelect
                          v-model:value="addPreset.sendMessageOption!!.toolChoice!.type"
                          :options="toolChoiceTypeOptions"
                          placeholder="请选择工具选择类型"
                          style="flex: 1;"
                        />
                        <NTooltip placement="top" trigger="hover">
                          <template #trigger>
                            <NIcon size="18" class="ml-2" style="margin-left: 8px; cursor: pointer;">
                              <InformationCircleOutline />
                            </NIcon>
                          </template>
                          <span>如果选择了"任意"，toolcall下一轮会自动变回"自动"模式，防止无限循环。</span>
                        </NTooltip>
                      </div>
                    </NFormItemGridItem>

                    <!-- 容灾顺延与错误重试 -->
                    <NFormItemGridItem span="24 s:12 m:12" label="错误自动重试">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <NSwitch v-model:value="addPreset.enableRetry" />
                        <span class="text-xs text-gray-500">接口报错时自动按次数重试</span>
                      </div>
                    </NFormItemGridItem>
                    <NFormItemGridItem v-if="addPreset.enableRetry" span="24 s:12 m:12" label="单模型最大重试次数">
                      <NInputNumber v-model:value="addPreset.maxRetries" :min="1" :max="5" placeholder="默认 2 次" style="width: 100%;" />
                    </NFormItemGridItem>

                    <NFormItemGridItem span="24" label="失败降级到备用模型（顺延链）">
                      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <NSwitch v-model:value="addPreset.enableFallback" />
                        <span class="text-xs text-gray-500">主模型失败或重试耗尽后，按顺序依次顺延尝试备用模型</span>
                        <NButton v-if="addPreset.enableFallback" size="tiny" type="primary" dashed @click="addFallbackModel">
                          + 添加备用模型
                        </NButton>
                      </div>
                      <div v-if="addPreset.enableFallback" style="display: flex; flex-direction: column; gap: 8px; width: 100%;">
                        <div v-for="(_, idx) in fallbackModelList" :key="idx" style="display: flex; align-items: center; gap: 8px;">
                          <span style="font-size: 12px; color: #888; width: 68px;">顺延 {{ idx + 1 }}:</span>
                          <NSelect
                            v-model:value="fallbackModelList[idx]"
                            :options="modelOptions as SelectMixedOption[]"
                            filterable
                            tag
                            clearable
                            placeholder="选择 渠道/模型 或直接输入"
                            style="flex: 1;"
                          />
                          <NButton size="small" type="error" text @click="removeFallbackModel(idx)">
                            删除
                          </NButton>
                        </div>
                        <div v-if="fallbackModelList.length === 0" class="text-xs text-gray-400">
                          暂未添加顺延备用模型，点击上方“+ 添加备用模型”进行添加。
                        </div>
                      </div>
                    </NFormItemGridItem>

                    <!-- 预设专属群聊/群员黑白名单 -->
                    <NFormItemGridItem span="24 s:12 m:12" label="预设群聊白名单">
                      <div style="width: 100%;">
                        <NDynamicTags v-model:value="whiteGroupTags" />
                        <div class="text-xs text-gray-400 mt-1">留空表示所有群聊均允许触发该预设</div>
                      </div>
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:12 m:12" label="预设群聊黑名单">
                      <div style="width: 100%;">
                        <NDynamicTags v-model:value="blackGroupTags" />
                        <div class="text-xs text-gray-400 mt-1">命中黑名单的群聊将禁止唤醒该预设</div>
                      </div>
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:12 m:12" label="预设群员白名单">
                      <div style="width: 100%;">
                        <NDynamicTags v-model:value="whiteUserTags" />
                        <div class="text-xs text-gray-400 mt-1">留空表示所有群员均允许触发</div>
                      </div>
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:12 m:12" label="预设群员黑名单">
                      <div style="width: 100%;">
                        <NDynamicTags v-model:value="blackUserTags" />
                        <div class="text-xs text-gray-400 mt-1">命中黑名单的用户将无法唤醒该预设</div>
                      </div>
                    </NFormItemGridItem>
                  </NGrid>
                </NTabPane>

                <!-- OpenAI 规范 -->
                <NTabPane name="openai" tab="OpenAI">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive class="pt-2">
                    <NFormItemGridItem span="24 s:8 m:8" label="启用推理" path="sendMessageOption.enableReasoning">
                      <NCheckbox v-model:checked="addPreset.sendMessageOption!!.enableReasoning">
                        启用推理 (Reasoning)
                      </NCheckbox>
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:8 m:8" label="推理强度 (reasoning_effort)" path="sendMessageOption.reasoningEffort">
                      <NSelect
                        v-model:value="addPreset.sendMessageOption!!.reasoningEffort"
                        :options="reasoningEffortOptions"
                        placeholder="请选择推理强度"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:8 m:8" label="推理 Token 预算" path="sendMessageOption.reasoningBudgetTokens">
                      <NInputNumber
                        v-model:value="addPreset.sendMessageOption!!.reasoningBudgetTokens"
                        placeholder="推理Token预算"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:12 m:12" label="最大 Token 字段" path="sendMessageOption.openaiMaxTokenField">
                      <NSelect
                        v-model:value="addPreset.sendMessageOption!!.openaiMaxTokenField"
                        :options="openaiMaxTokenFieldOptions"
                        placeholder="选择最大 Token 字段"
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NTabPane>

                <!-- Gemini 规范 -->
                <NTabPane name="gemini" tab="Gemini">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive class="pt-2">
                    <NFormItemGridItem span="24 s:12 m:12" label="思考级别 (thinkingLevel)" path="sendMessageOption.geminiThinkingLevel">
                      <NSelect
                        v-model:value="addPreset.sendMessageOption!!.geminiThinkingLevel"
                        :options="geminiThinkingLevelOptions"
                        placeholder="请选择思考级别"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:12 m:12" label="响应模态 (responseModalities)" path="sendMessageOption.responseModalities">
                      <NSelect
                        v-model:value="addPreset.sendMessageOption!!.responseModalities"
                        multiple
                        placeholder="请选择响应模态"
                        :options="responseModalitiesOptions"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24" label="Gemini 内置工具" path="sendMessageOption.geminiBuiltinTools">
                      <NCheckboxGroup v-model:value="addPreset.sendMessageOption!!.geminiBuiltinTools">
                        <NSpace>
                          <NCheckbox
                            v-for="option in geminiBuiltinToolOptions"
                            :key="option.value"
                            :value="option.value"
                          >
                            {{ option.label }}
                          </NCheckbox>
                        </NSpace>
                      </NCheckboxGroup>
                    </NFormItemGridItem>
                    <!-- 安全设置 -->
                    <NFormItemGridItem span="24" label="安全设置" path="sendMessageOption.safetySettings">
                      <div style="width: 100%;">
                        <NButton size="small" type="primary" style="margin-bottom: 12px" @click="addSafetySetting">
                          添加安全设置
                        </NButton>
                        <div v-if="!addPreset.sendMessageOption?.safetySettings?.length" class="text-xs text-gray-500">
                          未添加安全设置（使用官方默认级别）
                        </div>
                        <div
                          v-for="(setting, index) in addPreset.sendMessageOption?.safetySettings"
                          :key="index"
                          class="mb-2 p-2 border rounded"
                        >
                          <NGrid :cols="24" :x-gap="8">
                            <NFormItemGridItem span="11" label="有害类别">
                              <NSelect
                                v-model:value="setting.category"
                                :options="harmCategoryOptions"
                                placeholder="选择有害类别"
                              />
                            </NFormItemGridItem>
                            <NFormItemGridItem span="11" label="拦截阈值">
                              <NSelect
                                v-model:value="setting.threshold"
                                :options="harmBlockThresholdOptions"
                                placeholder="选择拦截阈值"
                              />
                            </NFormItemGridItem>
                            <NFormItemGridItem span="2" label="操作">
                              <NButton size="small" type="error" @click="removeSafetySetting(index)">
                                删除
                              </NButton>
                            </NFormItemGridItem>
                          </NGrid>
                        </div>
                      </div>
                    </NFormItemGridItem>
                  </NGrid>
                </NTabPane>

                <!-- Claude 规范 -->
                <NTabPane name="claude" tab="Claude">
                  <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive class="pt-2">
                    <NFormItemGridItem span="24 s:8 m:8" label="思考模式 (thinkingMode)" path="sendMessageOption.claudeThinkingMode">
                      <NSelect
                        v-model:value="addPreset.sendMessageOption!!.claudeThinkingMode"
                        :options="claudeThinkingModeOptions"
                        placeholder="请选择思考模式"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:8 m:8" label="思考强度 (effort)" path="sendMessageOption.claudeEffort">
                      <NSelect
                        v-model:value="addPreset.sendMessageOption!!.claudeEffort"
                        :options="claudeEffortOptions"
                        placeholder="请选择思考强度"
                      />
                    </NFormItemGridItem>
                    <NFormItemGridItem span="24 s:8 m:8" label="思考预算 Token (>=1024)" path="sendMessageOption.reasoningBudgetTokens">
                      <NInputNumber
                        v-model:value="addPreset.sendMessageOption!!.reasoningBudgetTokens"
                        placeholder="如 2000"
                        :min="1024"
                      />
                    </NFormItemGridItem>
                  </NGrid>
                </NTabPane>
              </NTabs>
            </NCollapseItem>
          </NCollapse>

          <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
            <NSpace>
              <NButton @click="showModal = false">
                取消
              </NButton>
              <NButton type="primary" @click="handleAddPreset">
                确定
              </NButton>
            </NSpace>
          </div>
        </NForm>
      </NCard>
    </NModal>
  </div>
</template>

<style scoped>
.text-xs {
  font-size: 12px;
}
</style>
