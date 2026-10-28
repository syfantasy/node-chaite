<script lang="ts" setup>
import {
  NButton,
  NCard,
  NEmpty,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NModal,
  NSpace,
  NSwitch,
  NTabs,
  NTabPane,
  NTag,
  useMessage,
} from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import {
  fetchPluginCode,
  fetchPlugins,
  reloadPlugin,
  savePluginCode,
  togglePlugin,
  type PluginMeta,
} from '@/service/api/pluginManager'

const message = useMessage()
const loading = ref(false)
const plugins = ref<PluginMeta[]>([])

const singleFilePlugins = computed(() => plugins.value.filter(p => p.type === 'single-file'))
const directoryPlugins = computed(() => plugins.value.filter(p => p.type === 'directory'))

// Code Editor Modal
const codeModalVisible = ref(false)
const currentPluginId = ref('')
const currentPluginName = ref('')
const codeContent = ref('')
const savingCode = ref(false)

// Create Plugin Modal
const createModalVisible = ref(false)
const newPluginId = ref('')
const newPluginCode = ref(`// @name 我的自定义插件
// @author Chaite
// @description 一个轻量的单文件指令插件

export const name = '自定义插件'
export const version = '1.0.0'
export const description = '一个自定义单文件插件'

export default function setup(ctx) {
  ctx.logger.info('插件已启动！')

  // 注册指令
  ctx.registerCommand('#测试', async (e) => {
    await e.reply('收到测试指令喵！')
    return true
  })
}
`)

async function loadList() {
  loading.value = true
  try {
    const res = await fetchPlugins()
    if (res.code === 0 && Array.isArray(res.data)) {
      plugins.value = res.data
    } else {
      plugins.value = []
    }
  } catch (err: any) {
    message.error(`加载插件列表失败: ${err.message}`)
  } finally {
    loading.value = false
  }
}

async function handleToggle(plugin: PluginMeta, checked: boolean) {
  try {
    const res = await togglePlugin(plugin.id, checked)
    if (res.code === 0) {
      plugin.enabled = checked
      message.success(`插件 ${plugin.name} 已${checked ? '启用' : '禁用'}`)
    } else {
      message.error(res.message || '操作失败')
    }
  } catch (err: any) {
    message.error(`切换状态失败: ${err.message}`)
  }
}

async function handleReload(plugin: PluginMeta) {
  try {
    const res = await reloadPlugin(plugin.id)
    if (res.code === 0) {
      message.success(`插件 ${plugin.name} 重载成功`)
      await loadList()
    } else {
      message.error(res.message || '重载失败')
    }
  } catch (err: any) {
    message.error(`重载失败: ${err.message}`)
  }
}

async function openCodeEditor(plugin: PluginMeta) {
  currentPluginId.value = plugin.id
  currentPluginName.value = plugin.name
  try {
    const res = await fetchPluginCode(plugin.id)
    if (res.code === 0) {
      codeContent.value = res.data.code
      codeModalVisible.value = true
    } else {
      message.error(res.message || '获取插件源码失败')
    }
  } catch (err: any) {
    message.error(`获取源码失败: ${err.message}`)
  }
}

async function handleSaveCode() {
  if (!currentPluginId.value) return
  savingCode.value = true
  try {
    const res = await savePluginCode(currentPluginId.value, codeContent.value)
    if (res.code === 0) {
      message.success('代码保存成功并已完成热重载！')
      codeModalVisible.value = false
      await loadList()
    } else {
      message.error(res.message || '保存失败')
    }
  } catch (err: any) {
    message.error(`保存失败: ${err.message}`)
  } finally {
    savingCode.value = false
  }
}

async function handleCreatePlugin() {
  const id = newPluginId.value.trim()
  if (!id) {
    message.warning('请输入插件英文唯一标识（如 custom-cmd）')
    return
  }
  try {
    const res = await savePluginCode(id, newPluginCode.value)
    if (res.code === 0) {
      message.success(`插件 ${id} 创建成功！`)
      createModalVisible.value = false
      newPluginId.value = ''
      await loadList()
    } else {
      message.error(res.message || '创建失败')
    }
  } catch (err: any) {
    message.error(`创建失败: ${err.message}`)
  }
}

onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="plugin-manager-page">
    <header class="header-section">
      <div>
        <h1 class="page-title">插件管理</h1>
        <p class="page-desc">
          基于统一 ChaiteEvent 驱动的插件体系。替代旧触发器，支持单文件即写即用与多文件工程包独立管理。
        </p>
      </div>
      <NSpace>
        <NButton secondary @click="loadList" :loading="loading">刷新列表</NButton>
        <NButton type="primary" @click="createModalVisible = true">新建单文件插件</NButton>
      </NSpace>
    </header>

    <NTabs type="line" animated size="large">
      <!-- Tab 1: 单文件 JS 插件 -->
      <NTabPane name="single-file" :tab="`单文件 JS 插件 (${singleFilePlugins.length})`">
        <div v-if="singleFilePlugins.length === 0 && !loading" class="empty-box">
          <NEmpty description="暂无单文件插件，点击右上角新建一个吧" />
        </div>
        <NGrid v-else :x-gap="16" :y-gap="16" cols="1 s:2 m:2 l:3" responsive="screen">
          <NGridItem v-for="plugin in singleFilePlugins" :key="plugin.id">
            <NCard class="plugin-card" :title="plugin.name">
              <template #header-extra>
                <NSwitch :value="plugin.enabled" @update:value="(val) => handleToggle(plugin, val)" />
              </template>

              <div class="plugin-meta-row">
                <NTag size="small" type="info">单文件 JS</NTag>
                <span class="plugin-version" v-if="plugin.version">v{{ plugin.version }}</span>
                <span class="plugin-author" v-if="plugin.author">by {{ plugin.author }}</span>
              </div>

              <p class="plugin-desc">{{ plugin.description || '轻量单文件脚本，支持在线查看与实时编辑' }}</p>

              <template #action>
                <NSpace justify="space-between" align="center">
                  <span class="plugin-id-tag">{{ plugin.id }}.js</span>
                  <NSpace size="small">
                    <NButton size="small" type="primary" secondary @click="openCodeEditor(plugin)">
                      编辑代码
                    </NButton>
                    <NButton size="small" secondary @click="handleReload(plugin)">
                      重载
                    </NButton>
                  </NSpace>
                </NSpace>
              </template>
            </NCard>
          </NGridItem>
        </NGrid>
      </NTabPane>

      <!-- Tab 2: 目录工程包插件 -->
      <NTabPane name="directory" :tab="`目录工程包插件 (${directoryPlugins.length})`">
        <div v-if="directoryPlugins.length === 0 && !loading" class="empty-box">
          <NEmpty description="暂无目录工程包插件（位于 runner/plugins/<目录名>/）" />
        </div>
        <NGrid v-else :x-gap="16" :y-gap="16" cols="1 s:2 m:2 l:3" responsive="screen">
          <NGridItem v-for="plugin in directoryPlugins" :key="plugin.id">
            <NCard class="plugin-card" :title="plugin.name">
              <template #header-extra>
                <NSwitch :value="plugin.enabled" @update:value="(val) => handleToggle(plugin, val)" />
              </template>

              <div class="plugin-meta-row">
                <NTag size="small" type="success">工程目录包</NTag>
                <span class="plugin-version" v-if="plugin.version">v{{ plugin.version }}</span>
                <span class="plugin-author" v-if="plugin.author">by {{ plugin.author }}</span>
              </div>

              <p class="plugin-desc">{{ plugin.description || '多文件完整工程模块' }}</p>

              <template #action>
                <NSpace justify="space-between" align="center">
                  <span class="plugin-id-tag">plugins/{{ plugin.id }}/</span>
                  <NSpace size="small">
                    <NButton size="small" secondary @click="handleReload(plugin)">
                      重载模块
                    </NButton>
                  </NSpace>
                </NSpace>
              </template>
            </NCard>
          </NGridItem>
        </NGrid>
      </NTabPane>
    </NTabs>

    <!-- Code Editor Modal -->
    <NModal
      v-model:show="codeModalVisible"
      preset="card"
      :title="`编辑单文件插件: ${currentPluginName} (${currentPluginId}.js)`"
      style="width: 860px; max-width: 95vw;"
    >
      <div class="editor-container">
        <p class="tip-text">在下方直接修改代码，保存后系统将即时热重载生效。</p>
        <NInput
          v-model:value="codeContent"
          type="textarea"
          :autosize="{ minRows: 16, maxRows: 26 }"
          class="code-textarea"
          placeholder="编写插件代码..."
        />
      </div>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="codeModalVisible = false">取消</NButton>
          <NButton type="primary" :loading="savingCode" @click="handleSaveCode">
            保存并热重载
          </NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Create Plugin Modal -->
    <NModal
      v-model:show="createModalVisible"
      preset="card"
      title="新建单文件 JS 插件"
      style="width: 720px; max-width: 95vw;"
    >
      <NForm label-placement="top">
        <NFormItem label="插件唯一标识 (英文 ID)" required>
          <NInput
            v-model:value="newPluginId"
            placeholder="例如: weather-cmd (将生成 weather-cmd.js)"
          />
        </NFormItem>
        <NFormItem label="初始代码模版">
          <NInput
            v-model:value="newPluginCode"
            type="textarea"
            :autosize="{ minRows: 12, maxRows: 18 }"
            class="code-textarea"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="createModalVisible = false">取消</NButton>
          <NButton type="primary" @click="handleCreatePlugin">创建并启用</NButton>
        </NSpace>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.plugin-manager-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 6px 0;
}
.page-desc {
  font-size: 14px;
  color: var(--n-text-color-3, #888);
  margin: 0;
}
.empty-box {
  padding: 80px 0;
  display: flex;
  justify-content: center;
}
.plugin-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.plugin-meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.plugin-version,
.plugin-author {
  font-size: 12px;
  color: var(--n-text-color-3, #999);
}
.plugin-desc {
  font-size: 13px;
  color: var(--n-text-color-2, #666);
  min-height: 38px;
  margin: 0 0 16px 0;
  line-height: 1.5;
}
.plugin-id-tag {
  font-size: 12px;
  color: var(--n-text-color-3, #aaa);
  font-family: monospace;
}
.editor-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tip-text {
  font-size: 13px;
  color: var(--n-text-color-3, #888);
  margin: 0;
}
.code-textarea :deep(textarea) {
  font-family: 'Fira Code', Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
}
</style>
