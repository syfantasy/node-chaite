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
  NTag,
  useMessage,
} from 'naive-ui'
import { computed, reactive, ref, watch } from 'vue'
import { fetchToolConfigFile, saveToolConfigFile } from '@/service/api/tools'

const props = defineProps<{ show: boolean; tool?: Shareable.ToolModel }>()
const emit = defineEmits<{ 'update:show': [value: boolean]; saved: [] }>()

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const filePath = ref('')
const viewMode = ref<'form' | 'json'>('form')

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

// 推导字段呈现类型
function inferFieldType(key: string, val: any): 'boolean' | 'number' | 'textarea' | 'string' | 'complex' {
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
  Object.keys(formData).forEach(k => delete formData[k])
  try {
    const rsp = await fetchToolConfigFile(props.tool.id)
    if (rsp.code === 0 && rsp.data) {
      filePath.value = rsp.data.filePath || ''
      configText.value = rsp.data.rawText || '{}'
      syncTextToForm()
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
    style="width: min(850px, calc(100vw - 32px))"
    @update:show="emit('update:show', $event)"
  >
    <NSpin :show="loading">
      <!-- 头部控制栏：路径与视图切换 -->
      <NFlex justify="space-between" align="center" style="margin-bottom: 16px">
        <NAlert type="info" :show-icon="false" style="padding: 6px 12px">
          <span>文件路径：<code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px; font-weight: 500">{{ filePath || '加载中...' }}</code></span>
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
      <div v-if="viewMode === 'form'" style="min-height: 260px">
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
            <NFlex justify="space-between" align="center" style="margin-bottom: 8px">
              <NFlex align="center" size="small">
                <span style="font-weight: 600; font-size: 14px">{{ getFieldLabel(String(key)) }}</span>
                <NTag size="tiny" secondary>
                  {{ typeof val }}
                </NTag>
              </NFlex>
              <NPopconfirm @positive-click="handleRemoveField(String(key))">
                <template #trigger>
                  <NButton size="tiny" tertiary type="error">
                    删除
                  </NButton>
                </template>
                确定从配置文件中移除此项吗？
              </NPopconfirm>
            </NFlex>

            <!-- 布尔开关 -->
            <template v-if="inferFieldType(String(key), val) === 'boolean'">
              <NSwitch v-model:value="formData[key]" @update:value="syncFormToText" />
            </template>

            <!-- 数字输入 -->
            <template v-else-if="inferFieldType(String(key), val) === 'number'">
              <NInputNumber
                v-model:value="formData[key]"
                style="width: 100%"
                @update:value="syncFormToText"
              />
            </template>

            <!-- 长文本/Cookie/Token -->
            <template v-else-if="inferFieldType(String(key), val) === 'textarea'">
              <NInput
                v-model:value="formData[key]"
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 8 }"
                placeholder="请输入配置内容..."
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
                style="font-family: monospace; font-size: 12px"
                @update:value="(text: string) => { try { formData[key] = JSON.parse(text); syncFormToText(); } catch {} }"
              />
            </template>

            <!-- 普通单行文本 -->
            <template v-else>
              <NInput
                v-model:value="formData[key]"
                placeholder="请输入值..."
                @update:value="syncFormToText"
              />
            </template>
          </div>

          <!-- 添加新项抽屉/表单 -->
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
            ➕ 添加配置项
          </NButton>
        </NForm>
      </div>

      <!-- 视图 2: 原生 JSON 编辑器 -->
      <div v-else>
        <NInput
          v-model:value="configText"
          type="textarea"
          :autosize="{ minRows: 12, maxRows: 24 }"
          placeholder="请输入 JSON 格式的配置内容..."
          style="font-family: monospace; font-size: 13px"
        />
      </div>

      <!-- 弹窗底部操作栏 -->
      <template #footer>
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
              取消
            </NButton>
            <NButton type="primary" :loading="saving" @click="handleSave">
              保存配置
            </NButton>
          </NFlex>
        </NFlex>
      </template>
    </NSpin>
  </NModal>
</template>
