<script lang="ts" setup>
import { NAlert, NButton, NFlex, NInput, NModal, NSpin, useMessage } from 'naive-ui'
import { ref, watch } from 'vue'
import { fetchToolConfigFile, saveToolConfigFile } from '@/service/api/tools'

const props = defineProps<{ show: boolean; tool?: Shareable.ToolModel }>()
const emit = defineEmits<{ 'update:show': [value: boolean]; saved: [] }>()

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const filePath = ref('')
const configText = ref('')

async function load() {
  if (!props.show || !props.tool?.id) return
  loading.value = true
  filePath.value = ''
  configText.value = ''
  try {
    const rsp = await fetchToolConfigFile(props.tool.id)
    if (rsp.code === 0 && rsp.data) {
      filePath.value = rsp.data.filePath || ''
      configText.value = rsp.data.rawText || '{}'
    } else {
      message.error(rsp.message || '读取工具配置文件失败')
    }
  } catch (error: any) {
    message.error(error?.message || '读取工具配置文件失败')
  } finally {
    loading.value = false
  }
}

function formatJson() {
  try {
    const parsed = JSON.parse(configText.value)
    configText.value = JSON.stringify(parsed, null, 2)
    message.success('JSON 格式化成功')
  } catch (err: any) {
    message.error(`JSON 语法错误: ${err?.message || err}`)
  }
}

async function handleSave() {
  if (!props.tool?.id) return
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
    :title="`配置文件 · ${tool?.name || ''}`"
    style="width: min(800px, calc(100vw - 32px))"
    @update:show="emit('update:show', $event)"
  >
    <NSpin :show="loading">
      <NAlert type="info" :show-icon="false" style="margin-bottom: 12px">
        <span>当前配置文件路径：<code style="background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 4px">{{ filePath || '加载中...' }}</code></span>
      </NAlert>

      <div style="margin-bottom: 16px">
        <NInput
          v-model:value="configText"
          type="textarea"
          :autosize="{ minRows: 12, maxRows: 24 }"
          placeholder="请输入 JSON 格式的配置内容..."
          style="font-family: monospace; font-size: 13px"
        />
      </div>

      <NFlex justify="space-between" align="center">
        <NButton secondary size="small" @click="formatJson">
          格式化 JSON
        </NButton>
        <NFlex align="center">
          <NButton @click="emit('update:show', false)">
            取消
          </NButton>
          <NButton type="primary" :loading="saving" @click="handleSave">
            保存配置
          </NButton>
        </NFlex>
      </NFlex>
    </NSpin>
  </NModal>
</template>
