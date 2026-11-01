<script lang="ts" setup>
import {
  NAlert,
  NButton,
  NCard,
  NDivider,
  NEmpty,
  NFlex,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NPopconfirm,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSpace,
  NSpin,
  NSwitch,
  NTabs,
  NTabPane,
  NTag,
  useMessage,
} from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { fetchToolConfigFile, saveToolConfigFile } from '@/service/api/tools'

const props = defineProps<{ show: boolean; tool?: Shareable.ToolModel }>()
const emit = defineEmits<{ 'update:show': [value: boolean]; saved: [] }>()

const router = useRouter()
const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const filePath = ref('')
const viewMode = ref<'form' | 'json'>('form')
const schemaConfig = ref<Record<string, any>>({})
const managedByPlugin = ref<string | null>(null)
const pluginId = ref<string | null>(null)
const toolMeta = ref<{ name: string; description: string; parameters: any } | null>(null)
const activeTab = ref<'config' | 'statement'>('config')

// 原始 JSON 字符串
const configText = ref('')
// 表单数据对象
const formData = reactive<Record<string, any>>({})

// 添加新字段的相关状态
const newFieldKey = ref('')
const newFieldType = ref<'string' | 'number' | 'boolean' | 'textarea'>('string')
const showAddField = ref(false)

const isFormSupported = computed(() => {
  try {
    const parsed = JSON.parse(configText.value || '{}')
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
  } catch {
    return false
  }
})

// 字段友好标签映射
function getFieldLabel(key: string): string {
  if (schemaConfig.value[key]?.label) {
    return schemaConfig.value[key].label
  }
  const map: Record<string, string> = {
    cookie_str: '网易云 Cookie (cookie_str)',
    cookie: '登录 Cookie',
    token: '鉴权 Token',
    api_key: 'API Key',
    apiKey: 'API Key',
    secret: '密钥 Secret',
    user_id: '默认用户 QQ',
    group_id: '默认群号',
  }
  return map[key] || key
}

function getFieldDescription(key: string): string {
  return schemaConfig.value[key]?.description || ''
}

function normalizeSelectOptions(options?: any[]): Array<{ label: string; value: any }> {
  if (!Array.isArray(options)) return []
  return options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        label: opt.label ?? String(opt.value),
        value: opt.value ?? opt.label,
      }
    }
    return { label: String(opt), value: opt }
  })
}

// 推导字段呈现类型
function inferFieldType(key: string, val: any): 'boolean' | 'number' | 'textarea' | 'string' | 'select' | 'complex' {
  const schemaType = schemaConfig.value[key]?.type
  if (schemaType === 'select') return 'select'
  if (schemaType === 'switch' || schemaType === 'boolean') return 'boolean'
  if (schemaType === 'number') return 'number'
  if (schemaType === 'textarea') return 'textarea'

  if (typeof val === 'boolean') return 'boolean'
  if (typeof val === 'number') return 'number'
  if (val !== null && typeof val === 'object') return 'complex'
  if (typeof val === 'string') {
    if (val.length > 50 || /cookie|token|key|secret|prompt|desc/i.test(key)) {
      return 'textarea'
    }
    return 'string'
  }
  return 'string'
}

function syncTextToForm() {
  try {
    const parsed = JSON.parse(configText.value || '{}')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      Object.keys(formData).forEach(k => delete formData[k])
      Object.assign(formData, parsed)
    }
  } catch {}
}

function syncFormToText() {
  configText.value = JSON.stringify(formData, null, 2)
}

async function load() {
  if (!props.show || !props.tool?.id) return
  loading.value = true
  filePath.value = ''
  configText.value = '{}'
  schemaConfig.value = {}
  managedByPlugin.value = null
  pluginId.value = null
  toolMeta.value = null
  activeTab.value = 'config'
  Object.keys(formData).forEach(k => delete formData[k])
  try {
    const rsp = await fetchToolConfigFile(props.tool.id)
    if (rsp.code === 0 && rsp.data) {
      filePath.value = rsp.data.filePath || ''
      configText.value = rsp.data.rawText || '{}'
      schemaConfig.value = rsp.data.schema || {}
      managedByPlugin.value = rsp.data.managedByPlugin || null
      pluginId.value = (rsp.data as any).pluginId || null
      toolMeta.value = (rsp.data as any).toolMeta || null
      syncTextToForm()
      // 如果 schema 中有默认字段且 formData 中不存在，则填补默认值
      if (schemaConfig.value && typeof schemaConfig.value === 'object') {
        let changed = false
        for (const [k, sDef] of Object.entries(schemaConfig.value)) {
          if (!(k in formData) && (sDef as any)?.default !== undefined) {
            formData[k] = (sDef as any).default
            changed = true
          }
        }
        if (changed) {
          syncFormToText()
        }
      }
      viewMode.value = isFormSupported.value ? 'form' : 'json'
    } else {
      message.error(rsp.message || '读取工具配置文件失败')
    }
  } catch (error: any) {
    message.error(error?.message || '读取工具配置文件失败')
  } finally {
    loading.value = false
  }
}

function goToPluginManager() {
  emit('update:show', false)
  router.push('/plugin-manager')
}

function handleModeChange(mode: 'form' | 'json') {
  if (mode === 'form') {
    try {
      const parsed = JSON.parse(configText.value)
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        message.warning('当前 JSON 不是键值对对象结构，无法使用表单视图展示')
        return
      }
      syncTextToForm()
      viewMode.value = 'form'
    } catch (err: any) {
      message.error(`JSON 语法有误，无法切换到表单视图: ${err?.message || err}`)
    }
  } else {
    syncFormToText()
    viewMode.value = 'json'
  }
}

function formatJson() {
  try {
    const parsed = JSON.parse(configText.value)
    configText.value = JSON.stringify(parsed, null, 2)
    syncTextToForm()
    message.success('JSON 格式化成功')
  } catch (err: any) {
    message.error(`JSON 语法错误: ${err?.message || err}`)
  }
}

function handleRemoveField(key: string) {
  delete formData[key]
  syncFormToText()
  message.info(`已移除配置项 "${key}"`)
}

function handleAddNewField() {
  const key = newFieldKey.value.trim()
  if (!key) {
    message.warning('请输入配置项名称')
    return
  }
  if (key in formData) {
    message.warning('已存在同名配置项')
    return
  }
  if (newFieldType.value === 'boolean') {
    formData[key] = false
  } else if (newFieldType.value === 'number') {
    formData[key] = 0
  } else {
    formData[key] = ''
  }
  newFieldKey.value = ''
  showAddField.value = false
  syncFormToText()
  message.success(`成功添加配置项 "${key}"`)
}

async function handleSave() {
  if (!props.tool?.id) return
  if (viewMode.value === 'form') {
    syncFormToText()
  }

  let parsed: any
  try {
    parsed = JSON.parse(configText.value)
  } catch (err: any) {
    message.error(`保存失败，JSON 格式有误: ${err?.message || err}`)
    return
  }

  saving.value = true
  try {
    const rsp = await saveToolConfigFile(props.tool.id, {
      rawText: configText.value,
      config: parsed,
    })
    if (rsp.code === 0) {
      message.success('工具配置文件已成功保存')
      emit('update:show', false)
      emit('saved')
    } else {
      message.error(rsp.message || '保存工具配置文件失败')
    }
  } catch (err: any) {
    message.error(err?.message || '保存工具配置文件失败')
  } finally {
    saving.value = false
  }
}

watch(() => props.show, (val) => {
  if (val) load()
})
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    :title="`工具配置 · ${tool?.name || ''}`"
    style="width: min(880px, calc(100vw - 32px)); max-height: 88vh; display: flex; flex-direction: column;"
    :content-style="{ overflowY: 'auto', flex: 1, paddingRight: '6px' }"
    @update:show="emit('update:show', $event)"
  >
    <NSpin :show="loading">
      <!-- 插件托管提示 -->
      <NAlert
        v-if="managedByPlugin"
        type="warning"
        style="margin-bottom: 14px"
        :bordered="false"
      >
        <template #header>
          <NFlex justify="space-between" align="center">
            <span>💡 插件统一托管声明</span>
            <NButton size="tiny" type="warning" secondary @click="goToPluginManager">
              前往【插件管理】修改配置
            </NButton>
          </NFlex>
        </template>
        该工具由插件 <strong>【{{ managedByPlugin }}】</strong> 统一注册并托管配置，当前为<strong>只读展示</strong>状态。如需调整服务接口、超时或搜图张数等核心参数，请前往插件管理面板。
      </NAlert>

      <!-- Tab 切换：参数配置与调用规范声明 -->
      <NTabs v-model:value="activeTab" type="segment" size="small" style="margin-bottom: 14px;">
        <NTabPane name="config" tab="⚙️ 参数配置">
          <!-- 头部控制栏：路径与视图切换 -->
          <NFlex justify="space-between" align="center" style="margin-bottom: 14px">
            <NAlert type="info" :show-icon="false" style="padding: 4px 10px">
              <span style="font-size: 12px">文件路径：<code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-weight: 500">{{ filePath || '加载中...' }}</code></span>
            </NAlert>
            <NRadioGroup :value="viewMode" size="small" @update:value="handleModeChange">
              <NRadioButton value="form">
                📝 表单视图
              </NRadioButton>
              <NRadioButton value="json">
                📄 源码视图 (JSON)
              </NRadioButton>
            </NRadioGroup>
          </NFlex>

          <!-- 视图 1: 表单视图 (类插件管理风格) -->
          <div v-if="viewMode === 'form'" style="min-height: 240px">
            <div v-if="Object.keys(formData).length === 0" style="padding: 32px 0">
              <NEmpty description="当前配置文件为空，点击下方添加配置项">
                <template #extra>
                  <NButton size="small" type="primary" @click="showAddField = true">
                    添加配置项
                  </NButton>
                </template>
              </NEmpty>
            </div>

            <NForm v-else label-placement="top">
              <div
                v-for="(val, key) in formData"
                :key="key"
                style="background: rgba(120, 120, 120, 0.04); border: 1px solid rgba(120, 120, 120, 0.12); border-radius: 8px; padding: 12px 16px; margin-bottom: 12px"
              >
                <NFlex justify="space-between" align="center" style="margin-bottom: 6px">
                  <NFlex align="center" size="small">
                    <span style="font-weight: 600; font-size: 14px">{{ getFieldLabel(String(key)) }}</span>
                    <span v-if="schemaConfig[String(key)]?.label" style="font-size: 12px; color: #888">({{ key }})</span>
                    <NTag size="tiny" secondary>
                      {{ inferFieldType(String(key), val) }}
                    </NTag>
                  </NFlex>
                  <NPopconfirm v-if="!managedByPlugin" @positive-click="handleRemoveField(String(key))">
                    <template #trigger>
                      <NButton size="tiny" tertiary type="error">
                        删除
                      </NButton>
                    </template>
                    确定从配置文件中移除此项吗？
                  </NPopconfirm>
                </NFlex>

                <!-- 字段描述说明 -->
                <div
                  v-if="getFieldDescription(String(key))"
                  style="font-size: 12px; color: #777; margin-bottom: 8px; line-height: 1.4"
                >
                  {{ getFieldDescription(String(key)) }}
                </div>

                <!-- 下拉选择器 -->
                <template v-if="inferFieldType(String(key), val) === 'select'">
                  <NSelect
                    v-model:value="formData[key]"
                    :options="normalizeSelectOptions(schemaConfig[String(key)]?.options)"
                    :disabled="Boolean(managedByPlugin)"
                    @update:value="syncFormToText"
                  />
                </template>

                <!-- 布尔开关 -->
                <template v-else-if="inferFieldType(String(key), val) === 'boolean'">
                  <NSwitch
                    v-model:value="formData[key]"
                    :disabled="Boolean(managedByPlugin)"
                    @update:value="syncFormToText"
                  />
                </template>

                <!-- 数字输入 -->
                <template v-else-if="inferFieldType(String(key), val) === 'number'">
                  <NInputNumber
                    v-model:value="formData[key]"
                    style="width: 100%"
                    :disabled="Boolean(managedByPlugin)"
                    @update:value="syncFormToText"
                  />
                </template>

                <!-- 长文本/Cookie/Token -->
                <template v-else-if="inferFieldType(String(key), val) === 'textarea'">
                  <NInput
                    v-model:value="formData[key]"
                    type="textarea"
                    :autosize="{ minRows: 3, maxRows: 8 }"
                    :placeholder="schemaConfig[String(key)]?.placeholder || '请输入配置内容...'"
                    :disabled="Boolean(managedByPlugin)"
                    style="font-family: monospace; font-size: 13px"
                    @update:value="syncFormToText"
                  />
                </template>

                <!-- 复杂对象/数组 -->
                <template v-else-if="inferFieldType(String(key), val) === 'complex'">
                  <NInput
                    :value="JSON.stringify(formData[key], null, 2)"
                    type="textarea"
                    :autosize="{ minRows: 2, maxRows: 6 }"
                    :disabled="Boolean(managedByPlugin)"
                    style="font-family: monospace; font-size: 12px"
                    @update:value="(text: string) => { try { formData[key] = JSON.parse(text); syncFormToText(); } catch {} }"
                  />
                </template>

                <!-- 普通单行文本 -->
                <template v-else>
                  <NInput
                    v-model:value="formData[key]"
                    :placeholder="schemaConfig[String(key)]?.placeholder || '请输入值...'"
                    :disabled="Boolean(managedByPlugin)"
                    @update:value="syncFormToText"
                  />
                </template>
              </div>

              <!-- 添加新项抽屉/表单 -->
              <template v-if="!managedByPlugin">
                <div v-if="showAddField" style="border: 1px dashed rgba(24, 160, 88, 0.6); background: rgba(24, 160, 88, 0.04); border-radius: 8px; padding: 12px 16px; margin-bottom: 12px">
                  <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px">
                    新增配置项
                  </div>
                  <NFlex align="center" style="margin-bottom: 8px">
                    <NInput v-model:value="newFieldKey" placeholder="配置项键名 (Key)，例如 secret_key" style="flex: 2" />
                    <NSelect
                      v-model:value="newFieldType"
                      style="flex: 1"
                      :options="[
                        { label: '单行文本 (string)', value: 'string' },
                        { label: '多行文本 (textarea)', value: 'textarea' },
                        { label: '数字 (number)', value: 'number' },
                        { label: '布尔开关 (boolean)', value: 'boolean' },
                      ]"
                    />
                  </NFlex>
                  <NFlex justify="end" size="small">
                    <NButton size="small" @click="showAddField = false">
                      取消
                    </NButton>
                    <NButton size="small" type="primary" @click="handleAddNewField">
                      确定添加
                    </NButton>
                  </NFlex>
                </div>

                <NButton
                  v-else
                  dashed
                  block
                  style="margin-top: 8px"
                  @click="showAddField = true"
                >
                  + 添加配置项
                </NButton>
              </template>
            </NForm>
          </div>

          <!-- 视图 2: 原生 JSON 编辑器 -->
          <div v-else>
            <NInput
              v-model:value="configText"
              type="textarea"
              :autosize="{ minRows: 12, maxRows: 24 }"
              :disabled="Boolean(managedByPlugin)"
              placeholder="请输入 JSON 格式的配置内容..."
              style="font-family: monospace; font-size: 13px"
            />
          </div>
        </NTabPane>

        <!-- Tab 2: 工具声明与规范 -->
        <NTabPane name="statement" tab="📋 工具声明与调用规范">
          <NSpace vertical :size="12">
            <NAlert type="info" :bordered="false" title="📌 工具能力与模型调用规范">
              <div style="font-size: 13px; line-height: 1.65;">
                • <strong>AI 动态调度决策</strong>：大模型在会话中具备自主调用本工具的能力。对于图片搜索类工具，<strong>大模型可自主根据用户提问决定下发张数（1-5 张）</strong>；若需要更多结果可多步推理再次调用。<br>
                • <strong>反爬与网络安全合规</strong>：所有外部请求均由无头安全代理通道统一渲染，防止目标站点反爬拦截并保护本地会话隐私，请遵守相关法律法规及 Robots 规范。<br>
                • <strong>双协议与多端适配</strong>：原生兼容 OneBot 与 ICQQ 协议，网络图片与详细正文自动按客户端渲染能力分别通过原生媒体或合并转发聊天记录下发。
              </div>
            </NAlert>

            <div style="background: rgba(120, 120, 120, 0.05); border: 1px solid rgba(120, 120, 120, 0.12); border-radius: 8px; padding: 14px 16px;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
                <span>当前工具：<code>{{ tool?.name }}</code></span>
                <NTag size="tiny" :type="managedByPlugin ? 'info' : 'success'">
                  {{ managedByPlugin ? `插件托管 (${managedByPlugin})` : '本地独立脚本' }}
                </NTag>
              </div>
              <div style="font-size: 13px; color: #666; line-height: 1.5; margin-bottom: 10px;">
                {{ toolMeta?.description || tool?.description || '暂无详细描述说明' }}
              </div>

              <div v-if="toolMeta?.parameters" style="margin-top: 10px;">
                <div style="font-size: 12px; font-weight: 600; color: #888; margin-bottom: 4px;">
                  大模型调用函数签名 (JSON Schema Parameters)：
                </div>
                <NInput
                  :value="JSON.stringify(toolMeta.parameters, null, 2)"
                  type="textarea"
                  :autosize="{ minRows: 4, maxRows: 10 }"
                  readonly
                  style="font-family: monospace; font-size: 12px"
                />
              </div>
            </div>
          </NSpace>
        </NTabPane>
      </NTabs>
    </NSpin>

    <!-- 弹窗底部操作栏（吸底常驻） -->
    <template #action>
      <NFlex justify="space-between" align="center" style="width: 100%">
        <div>
          <NButton
            v-if="viewMode === 'json'"
            secondary
            size="small"
            @click="formatJson"
          >
            格式化 JSON
          </NButton>
        </div>
        <NFlex align="center">
          <NButton @click="emit('update:show', false)">
            {{ managedByPlugin ? '关闭' : '取消' }}
          </NButton>
          <NButton
            v-if="!managedByPlugin"
            type="primary"
            :loading="saving"
            @click="handleSave"
          >
            保存配置
          </NButton>
          <NButton
            v-else
            disabled
            secondary
          >
            插件统一托管（只读）
          </NButton>
        </NFlex>
      </NFlex>
    </template>
  </NModal>
</template>
