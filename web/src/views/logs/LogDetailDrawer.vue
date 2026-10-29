<script lang="ts" setup>
import { computed, ref } from 'vue'
import {
  NAlert,
  NBadge,
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NFlex,
  NIcon,
  NImage,
  NModal,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  useMessage,
} from 'naive-ui'
import type { OperationLog } from '@/service/api/logs'

const props = defineProps<{
  show: boolean
  log: OperationLog | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
}>()

const message = useMessage()
const activeTab = ref('request')
const previewImageSrc = ref('')
const showImageModal = ref(false)
const showRawBase64Map = ref<Record<string, boolean>>({})

const visible = computed({
  get: () => props.show,
  set: (val: boolean) => emit('update:show', val),
})

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(
    () => message.success('已复制到剪贴板'),
    () => message.error('复制失败')
  )
}

function openImagePreview(src: string) {
  previewImageSrc.value = src
  showImageModal.value = true
}

function toggleRawBase64(key: string) {
  showRawBase64Map.value[key] = !showRawBase64Map.value[key]
}

const reqPayload = computed(() => {
  return (props.log?.metadata as any)?.requestPayload || null
})

const respPayload = computed(() => {
  return (props.log?.metadata as any)?.responsePayload || null
})

const errorPayload = computed(() => {
  return (props.log?.metadata as any)?.error || null
})

const requestContents = computed(() => {
  const contents = reqPayload.value?.userMessage?.content
  if (Array.isArray(contents)) return contents
  if (typeof contents === 'string') return [{ type: 'text', text: contents }]
  return []
})

const responseContents = computed(() => {
  const contents = respPayload.value?.contents
  if (Array.isArray(contents)) return contents
  return []
})

const toolCalls = computed(() => {
  const tc = respPayload.value?.toolCalls || (respPayload.value?.params as any)?.toolCalls
  if (Array.isArray(tc)) return tc
  return []
})

function foldBase64InObject(obj: any) {
  if (!obj || typeof obj !== 'object') return
  for (const key of Object.keys(obj)) {
    const val = obj[key]
    if (typeof val === 'string') {
      if (val.startsWith('data:image/') || (val.length > 200 && /^[A-Za-z0-9+/=]+$/.test(val.slice(0, 100)))) {
        obj[key] = `[🖼️ Base64 Data (${Math.round((val.length / 1024) * 10) / 10} KB) - 在请求选项卡中查看或预览]`
      }
    } else if (typeof val === 'object') {
      foldBase64InObject(val)
    }
  }
}

const rawRequestData = computed(() => {
  return (props.log?.metadata as any)?.rawRequest || null
})

const rawResponseData = computed(() => {
  return (props.log?.metadata as any)?.rawResponse || null
})

const foldedRawRequest = computed(() => {
  const target = rawRequestData.value || reqPayload.value
  if (!target) return ''
  const clone = JSON.parse(JSON.stringify(target))
  foldBase64InObject(clone)
  return JSON.stringify(clone, null, 2)
})

const foldedRawResponse = computed(() => {
  const target = rawResponseData.value || respPayload.value
  if (!target) return ''
  const clone = JSON.parse(JSON.stringify(target))
  foldBase64InObject(clone)
  return JSON.stringify(clone, null, 2)
})
</script>

<template>
  <NDrawer v-model:show="visible" :width="760" placement="right">
    <NDrawerContent v-if="log" closable>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding-right: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <NTag :type="log.level === 'error' ? 'error' : 'info'" size="small">
              {{ log.type }}
            </NTag>
            <NTag v-if="(log.metadata as any)?.status" :type="(log.metadata as any)?.status === 200 ? 'success' : 'error'" size="small">
              {{ (log.metadata as any)?.status }}
            </NTag>
            <span style="font-weight: 600; font-size: 15px;">日志详情 ({{ log.id.slice(0, 8) }})</span>
          </div>
          <div style="font-size: 12px; color: #888;">
            {{ new Date(log.timestamp).toLocaleString() }}
          </div>
        </div>
      </template>

      <!-- Overview Info Grid -->
      <NCard size="small" class="mb-3" style="background-color: var(--n-color-embedded, #f8f9fa);">
        <NDescriptions :column="3" label-placement="left" size="small">
          <NDescriptionsItem label="模型">
            <NTag size="small" type="primary">{{ log.model || '未指定' }}</NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="渠道">
            <span>{{ log.channelName || log.channelId || '默认渠道' }}</span>
          </NDescriptionsItem>
          <NDescriptionsItem label="耗时">
            <span>{{ log.durationMs != null ? `${log.durationMs} ms` : '—' }}</span>
          </NDescriptionsItem>

          <NDescriptionsItem label="预设">
            <span>{{ log.presetName || log.presetId || '默认预设' }}</span>
          </NDescriptionsItem>
          <NDescriptionsItem label="触发机制">
            <NTag size="small" :type="(log.metadata as any)?.isBymMode ? 'warning' : 'default'">
              {{ (log.metadata as any)?.isBymMode ? '伪人模式' : ((log.metadata as any)?.triggerType || '普通触发') }}
            </NTag>
          </NDescriptionsItem>
          <NDescriptionsItem label="Tokens">
            <span>{{ log.inputTokens || 0 }} in / {{ log.outputTokens || 0 }} out (共 {{ log.totalTokens || 0 }})</span>
          </NDescriptionsItem>

          <NDescriptionsItem label="群聊 / 用户" :span="3">
            <span>{{ log.groupId ? `群 ${log.groupId}` : '私聊 / 控制台' }} · 用户 {{ log.userId || '—' }}</span>
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <!-- Drawer Tabs -->
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- Tab 1: 请求报文 -->
        <NTabPane name="request" tab="请求内容">
          <div class="space-y-3">
            <div style="font-weight: 600; font-size: 13px; color: #555; margin-bottom: 6px;">
              用户输入与多模态数据：
            </div>

            <!-- Content list -->
            <div v-if="requestContents.length === 0" class="text-gray-400 text-xs">
              {{ log.summary }}
            </div>

            <div v-for="(item, idx) in requestContents" :key="idx" class="mb-3">
              <!-- Text content -->
              <div v-if="item.type === 'text'" class="p-3 rounded bg-gray-50 dark:bg-gray-800 border text-sm whitespace-pre-wrap leading-relaxed">
                {{ item.text }}
              </div>

              <!-- Base64 Image Capsule (PrismCat style) -->
              <div v-else-if="item.type === 'image'" class="p-2 border rounded bg-blue-50/40 dark:bg-blue-950/20">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 16px;">🖼️</span>
                    <NTag size="small" type="info">{{ item.mimeType || 'image/jpeg' }}</NTag>
                    <span style="font-size: 12px; color: #666;">
                      {{ Math.round(((item.image?.length || 0) * 0.75) / 1024) }} KB
                    </span>
                  </div>
                  <div style="display: flex; gap: 6px;">
                    <NButton size="tiny" type="primary" secondary @click="openImagePreview(`data:${item.mimeType || 'image/jpeg'};base64,${item.image}`)">
                      👁️ 预览图片
                    </NButton>
                    <NButton size="tiny" secondary @click="copyText(item.image)">
                      📋 复制 Base64
                    </NButton>
                    <NButton size="tiny" tertiary @click="toggleRawBase64(`req_img_${idx}`)">
                      {{ showRawBase64Map[`req_img_${idx}`] ? '收起文本' : '展开数据' }}
                    </NButton>
                  </div>
                </div>

                <!-- Foldable Raw Text -->
                <div v-if="showRawBase64Map[`req_img_${idx}`]" class="mt-2 p-2 bg-gray-100 rounded text-xs font-mono break-all max-h-40 overflow-y-auto">
                  {{ item.image }}
                </div>
              </div>
            </div>

            <!-- Request Options -->
            <NCollapse v-if="reqPayload?.sendOptions" class="mt-4">
              <NCollapseItem title="请求参数与模型配置 (Options)" name="options">
                <pre class="text-xs bg-gray-50 p-2 rounded overflow-x-auto">{{ JSON.stringify(reqPayload.sendOptions, null, 2) }}</pre>
              </NCollapseItem>
            </NCollapse>
          </div>
        </NTabPane>

        <!-- Tab 2: 响应结果 -->
        <NTabPane name="response" tab="模型响应">
          <div class="space-y-3">
            <div v-if="responseContents.length === 0 && !log.detail" class="text-gray-400 text-xs">
              无模型响应数据
            </div>

            <div v-for="(item, idx) in responseContents" :key="idx" class="mb-3">
              <!-- Thinking / Reasoning Block -->
              <div v-if="item.reasoning" class="mb-3 p-3 border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 rounded">
                <div style="font-size: 12px; font-weight: 600; color: #d97706; margin-bottom: 4px;">
                  💭 思考过程 (Reasoning Process):
                </div>
                <div class="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {{ item.reasoning }}
                </div>
              </div>

              <!-- Reply Text -->
              <div v-if="item.text" class="p-3 border rounded bg-white dark:bg-gray-800 text-sm whitespace-pre-wrap leading-relaxed shadow-sm">
                {{ item.text }}
              </div>
            </div>

            <!-- Token Usage Summary -->
            <div v-if="respPayload?.usage" class="p-2 border rounded bg-gray-50 text-xs text-gray-600">
              <span>输入 Token: {{ respPayload.usage.inputTokens }}</span> ·
              <span>输出 Token: {{ respPayload.usage.outputTokens }}</span> ·
              <span>总 Token: {{ respPayload.usage.totalTokens }}</span>
              <span v-if="respPayload.usage.reasoningTokens"> · 思考 Token: {{ respPayload.usage.reasoningTokens }}</span>
            </div>

            <!-- Tool Calls Section -->
            <div v-if="toolCalls.length > 0" class="mt-3">
              <div style="font-size: 12px; font-weight: 600; color: #2563eb; margin-bottom: 6px;">
                🛠️ 工具调用参数 (Tool Calls):
              </div>
              <div v-for="(tc, tcIdx) in toolCalls" :key="tcIdx" class="p-2 border rounded bg-blue-50/30 dark:bg-blue-950/20 mb-2 text-xs">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                  <NTag size="small" type="primary">{{ tc.function?.name || tc.name || '工具调用' }}</NTag>
                  <span v-if="tc.id" style="color: #888;">ID: {{ tc.id }}</span>
                </div>
                <pre class="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto text-xs font-mono">{{ typeof tc.function?.arguments === 'string' ? tc.function.arguments : JSON.stringify(tc.function?.arguments || tc.args || {}, null, 2) }}</pre>
              </div>
            </div>

            <!-- Response Parameters & Metadata -->
            <NCollapse v-if="respPayload" class="mt-4">
              <NCollapseItem title="模型返回参数与元数据 (Parameters)" name="respParams">
                <pre class="text-xs bg-gray-50 p-2 rounded overflow-x-auto">{{ JSON.stringify(respPayload.params || { model: respPayload.model, finishReason: respPayload.finishReason, usage: respPayload.usage }, null, 2) }}</pre>
              </NCollapseItem>
            </NCollapse>
          </div>
        </NTabPane>

        <!-- Tab 3: 原始发给 AI 的请求 -->
        <NTabPane name="rawRequest" tab="原始请求 (AI)">
          <div style="position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="text-xs text-gray-500">
                {{ rawRequestData ? '直接发送给大模型 API / SDK 的原生请求报文' : '当前日志未捕获原生 SDK 请求体（显示为插件构造体）' }}
              </span>
              <NButton size="tiny" secondary @click="copyText(JSON.stringify(rawRequestData || reqPayload, null, 2))">
                复制原始请求 JSON
              </NButton>
            </div>
            <pre class="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto max-h-[500px] font-mono leading-relaxed">{{ foldedRawRequest || '暂无请求报文' }}</pre>
          </div>
        </NTabPane>

        <!-- Tab 4: 原始 AI 返回的响应 -->
        <NTabPane name="rawResponse" tab="原始响应 (AI)">
          <div style="position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="text-xs text-gray-500">
                {{ rawResponseData ? '大模型 API / SDK 直接返回的原生完整响应报文' : '当前日志未捕获原生 SDK 响应体（显示为插件提取体）' }}
              </span>
              <NButton size="tiny" secondary @click="copyText(JSON.stringify(rawResponseData || respPayload, null, 2))">
                复制原始响应 JSON
              </NButton>
            </div>
            <pre class="p-3 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto max-h-[500px] font-mono leading-relaxed">{{ foldedRawResponse || '暂无响应报文' }}</pre>
          </div>
        </NTabPane>

        <!-- Tab 5: 错误追踪 -->
        <NTabPane v-if="log.level === 'error' || errorPayload || log.detail" name="error" tab="错误追踪">
          <NAlert type="error" title="执行异常" class="mb-3">
            {{ errorPayload?.message || log.detail || log.summary }}
          </NAlert>
          <pre v-if="errorPayload?.stack || log.detail" class="p-3 bg-red-950/20 text-red-600 rounded text-xs overflow-x-auto font-mono">
{{ errorPayload?.stack || log.detail }}
          </pre>
        </NTabPane>
      </NTabs>
    </NDrawerContent>
  </NDrawer>

  <!-- Image Preview Modal -->
  <NModal v-model:show="showImageModal" preset="card" style="width: 600px; max-width: 90vw;" title="图片预览">
    <div style="display: flex; justify-content: center; align-items: center; max-height: 70vh; overflow: auto;">
      <img :src="previewImageSrc" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px;" />
    </div>
  </NModal>
</template>

<style scoped>
pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
