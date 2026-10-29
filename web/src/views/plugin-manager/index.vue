<script lang="ts" setup>
import {
  NButton,
  NCard,
  NCheckbox,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NModal,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NSwitch,
  NTabs,
  NTabPane,
  NTag,
  NCode,
  useMessage,
} from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  fetchPluginCode,
  fetchPlugins,
  importPlugin,
  reloadPlugin,
  savePluginCode,
  savePluginConfig,
  togglePlugin,
  type PluginConfigField,
  type PluginMeta,
} from '@/service/api/pluginManager'

const router = useRouter()
const message = useMessage()
const loading = ref(false)
const plugins = ref<PluginMeta[]>([])
const activeTab = ref<'single-file' | 'directory'>('single-file')

const singleFilePlugins = computed(() => plugins.value.filter(p => p.type === 'single-file'))
const directoryPlugins = computed(() => plugins.value.filter(p => p.type === 'directory'))

// --- 开发文档抽屉 ---
const docsDrawerVisible = ref(false)

// --- 代码编辑器弹窗 ---
const codeModalVisible = ref(false)
const currentPluginId = ref('')
const currentPluginName = ref('')
const codeContent = ref('')
const savingCode = ref(false)

// --- 可视化 / JSON 配置弹窗 ---
const configModalVisible = ref(false)
const configPlugin = ref<PluginMeta | null>(null)
const configFormData = ref<Record<string, any>>({})
const configRawJson = ref('')
const configMode = ref<'form' | 'json'>('form')
const savingConfig = ref(false)

// --- 新建插件弹窗 ---
const createModalVisible = ref(false)
const newPluginId = ref('')
const newPluginCode = ref(`// @name 我的自定义插件
// @author Chaite
// @description 单文件指令插件

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

// --- 导出插件弹窗 ---
const exportModalVisible = ref(false)
const exportTargetPlugin = ref<PluginMeta | null>(null)
const exportIncludeConfig = ref(true)
const exportFormat = ref<'zip' | 'raw'>('zip')

// --- 导入插件 ---
const fileInputRef = ref<HTMLInputElement | null>(null)

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

function hasPluginConfig(plugin: PluginMeta): boolean {
  if (plugin.configSchema && plugin.configSchema.length > 0) return true
  const cfg = plugin.config
  if (cfg && typeof cfg === 'object') {
    return Object.keys(cfg).length > 0
  }
  return false
}

function openConfigModal(plugin: PluginMeta) {
  configPlugin.value = plugin
  let currentCfg = plugin.config || {}
  while (
    currentCfg &&
    typeof currentCfg === 'object' &&
    'config' in currentCfg &&
    Object.keys(currentCfg).length === 1 &&
    typeof (currentCfg as any).config === 'object'
  ) {
    currentCfg = (currentCfg as any).config
  }
  configFormData.value = { ...currentCfg }
  configRawJson.value = JSON.stringify(currentCfg, null, 2)

  if (plugin.configSchema && plugin.configSchema.length > 0) {
    configMode.value = 'form'
  } else if (hasPluginConfig(plugin)) {
    configMode.value = 'json'
  } else {
    configMode.value = 'none'
  }
  configModalVisible.value = true
}

async function handleSaveConfig() {
  if (!configPlugin.value) return
  savingConfig.value = true
  try {
    let finalCfg: Record<string, any> = {}
    if (configMode.value === 'json') {
      try {
        finalCfg = JSON.parse(configRawJson.value)
      } catch (e: any) {
        message.error(`JSON 格式错误: ${e.message}`)
        savingConfig.value = false
        return
      }
    } else {
      finalCfg = configFormData.value
    }

    const res = await savePluginConfig(configPlugin.value.id, finalCfg)
    if (res.code === 0) {
      message.success(`插件 ${configPlugin.value.name} 配置已更新！`)
      configPlugin.value.config = finalCfg
      configModalVisible.value = false
      await loadList()
    } else {
      message.error(res.message || '保存配置失败')
    }
  } catch (err: any) {
    message.error(`保存配置失败: ${err.message}`)
  } finally {
    savingConfig.value = false
  }
}

function openExportModal(plugin: PluginMeta) {
  exportTargetPlugin.value = plugin
  exportIncludeConfig.value = true
  exportFormat.value = plugin.type === 'single-file' ? 'raw' : 'zip'
  exportModalVisible.value = true
}

function executeExport() {
  if (!exportTargetPlugin.value) return
  const id = exportTargetPlugin.value.id
  const url = `/api/plugins/${id}/export?includeConfig=${exportIncludeConfig.value}&format=${exportFormat.value}`
  window.open(url, '_blank')
  exportModalVisible.value = false
}

function triggerImport() {
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
    fileInputRef.value.click()
  }
}

async function handleFileSelected(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return

  const file = files[0]
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const base64 = (reader.result as string).split(',')[1]
      const res = await importPlugin(activeTab.value, file.name, base64)
      if (res.code === 0) {
        message.success(`插件 ${file.name} 导入成功！`)
        await loadList()
      } else {
        message.error(res.message || '导入失败')
      }
    } catch (err: any) {
      message.error(`导入插件出错: ${err.message}`)
    }
  }
  reader.readAsDataURL(file)
}

async function handleCreatePlugin() {
  const id = newPluginId.value.trim()
  if (!id) {
    message.warning('请输入插件英文标识')
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
          单文件脚本与多文件工程包独立管理。支持在线编辑、独立配置、导入/导出与实时热重载。
        </p>
      </div>
      <NSpace align="center">
        <NButton secondary @click="router.push('/chaite')">🛍️ 安装插件</NButton>
        <NButton secondary @click="docsDrawerVisible = true">📖 开发文档</NButton>
        <NButton secondary @click="triggerImport">导入插件</NButton>
        <NButton type="primary" @click="createModalVisible = true">新建单文件插件</NButton>
        <NButton secondary @click="loadList" :loading="loading">刷新</NButton>
      </NSpace>
      <input
        ref="fileInputRef"
        type="file"
        style="display: none"
        :accept="activeTab === 'single-file' ? '.js,.zip' : '.zip'"
        @change="handleFileSelected"
      />
    </header>

    <NTabs v-model:value="activeTab" type="line" animated size="large">
      <!-- Tab 1: 单文件 JS 插件 -->
      <NTabPane name="single-file" :tab="`单文件 JS 插件 (${singleFilePlugins.length})`">
        <div v-if="singleFilePlugins.length === 0 && !loading" class="empty-box">
          <NEmpty description="暂无单文件插件，点击右上角新建或导入一个吧" />
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

              <p class="plugin-desc">{{ plugin.description || '轻量单文件脚本，存放在独立目录并支持专属配置' }}</p>

              <template #action>
                <NSpace justify="space-between" align="center">
                  <span class="plugin-id-tag">scripts/{{ plugin.id }}/</span>
                  <NSpace size="small">
                    <NTooltip trigger="hover">
                      <template #trigger>
                        <NButton
                          size="small"
                          :type="hasPluginConfig(plugin) ? 'info' : 'default'"
                          secondary
                          @click="openConfigModal(plugin)"
                        >
                          {{ hasPluginConfig(plugin) ? '配置' : '免配置' }}
                        </NButton>
                      </template>
                      {{ hasPluginConfig(plugin) ? '修改运行参数与个性化配置' : '该插件无需额外配置，启用后开箱即用' }}
                    </NTooltip>
                    <NButton size="small" type="primary" secondary @click="openCodeEditor(plugin)">
                      代码
                    </NButton>
                    <NButton size="small" secondary @click="openExportModal(plugin)">
                      导出
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
          <NEmpty description="暂无目录工程包插件（位于 runner/plugins/apps/<目录名>/）" />
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
                  <span class="plugin-id-tag">apps/{{ plugin.id }}/</span>
                  <NSpace size="small">
                    <NTooltip trigger="hover">
                      <template #trigger>
                        <NButton
                          size="small"
                          :type="hasPluginConfig(plugin) ? 'info' : 'default'"
                          secondary
                          @click="openConfigModal(plugin)"
                        >
                          {{ hasPluginConfig(plugin) ? '配置' : '免配置' }}
                        </NButton>
                      </template>
                      {{ hasPluginConfig(plugin) ? '修改运行参数与个性化配置' : '该插件无需额外配置，启用后开箱即用' }}
                    </NTooltip>
                    <NButton size="small" secondary @click="openExportModal(plugin)">
                      导出
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
    </NTabs>

    <!-- 配置弹窗（支持 Schema 可视化表单与 JSON 直调） -->
    <NModal
      v-model:show="configModalVisible"
      preset="card"
      :title="`插件配置: ${configPlugin?.name || ''}`"
      style="width: 680px; max-width: 95vw;"
    >
      <div v-if="configPlugin">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span style="font-size: 13px; color: #888;">
            配置文件：<code>{{ configPlugin.type === 'directory' ? 'apps' : 'scripts' }}/{{ configPlugin.id }}/config.json</code>
          </span>
          <NRadioGroup v-if="configPlugin.configSchema && configPlugin.configSchema.length > 0" v-model:value="configMode" size="small">
            <NRadio value="form">表单视图</NRadio>
            <NRadio value="json">JSON 视图</NRadio>
          </NRadioGroup>
          <NButton
            v-else-if="configMode === 'json' && !hasPluginConfig(configPlugin)"
            size="tiny"
            secondary
            @click="configMode = 'none'"
          >
            返回提示
          </NButton>
        </div>

        <!-- 视图 0: 无需配置的友好空状态 -->
        <div v-if="configMode === 'none'" style="text-align: center; padding: 36px 16px;">
          <NEmpty description="本插件开箱即用，无需任何额外配置！">
            <template #extra>
              <NButton size="small" secondary @click="configMode = 'json'">
                🛠️ 高级开发者设置 (自定义 JSON)
              </NButton>
            </template>
          </NEmpty>
        </div>

        <!-- 视图 1: Schema 可视化表单 -->
        <NForm v-else-if="configMode === 'form'" label-placement="left" label-width="120">
          <NFormItem
            v-for="field in configPlugin.configSchema"
            :key="field.key"
            :label="field.label"
            :feedback="field.description"
          >
            <template v-if="field.type === 'boolean'">
              <NSwitch v-model:value="configFormData[field.key]" />
            </template>
            <template v-else-if="field.type === 'number'">
              <NInputNumber v-model:value="configFormData[field.key]" style="width: 100%;" />
            </template>
            <template v-else-if="field.type === 'select'">
              <NSelect
                v-model:value="configFormData[field.key]"
                :options="field.options || []"
              />
            </template>
            <template v-else-if="field.type === 'textarea'">
              <NInput
                v-model:value="configFormData[field.key]"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 6 }"
              />
            </template>
            <template v-else>
              <NInput v-model:value="configFormData[field.key]" />
            </template>
          </NFormItem>
        </NForm>

        <!-- 视图 2: 原生 JSON 编辑器 -->
        <div v-else>
          <NInput
            v-model:value="configRawJson"
            type="textarea"
            :autosize="{ minRows: 8, maxRows: 16 }"
            style="font-family: monospace;"
            placeholder="请输入合法的 JSON 配置"
          />
        </div>
      </div>
      <template #footer>
        <NSpace justify="end">
          <template v-if="configMode === 'none'">
            <NButton type="primary" @click="configModalVisible = false">我知道了</NButton>
          </template>
          <template v-else>
            <NButton @click="configModalVisible = false">取消</NButton>
            <NButton type="primary" :loading="savingConfig" @click="handleSaveConfig">保存配置</NButton>
          </template>
        </NSpace>
      </template>
    </NModal>

    <!-- 导出插件弹窗 -->
    <NModal
      v-model:show="exportModalVisible"
      preset="card"
      :title="`导出插件: ${exportTargetPlugin?.name || ''}`"
      style="width: 500px; max-width: 95vw;"
    >
      <NForm label-placement="left" label-width="120">
        <NFormItem label="导出格式">
          <NRadioGroup v-model:value="exportFormat">
            <NRadio v-if="exportTargetPlugin?.type === 'single-file'" value="raw">纯 JS 脚本 (.js)</NRadio>
            <NRadio value="zip">压缩包 (.zip)</NRadio>
          </NRadioGroup>
        </NFormItem>
        <NFormItem label="包含配置">
          <NCheckbox v-model:checked="exportIncludeConfig">
            同时导出该插件的配置文件 (config.json)
          </NCheckbox>
        </NFormItem>
      </NForm>
      <p style="font-size: 12px; color: #888; margin-top: 8px;">
        导出为 zip 压缩包后，可直接在其他机器或 Bot 控制台一键导入，免重新配置。
      </p>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="exportModalVisible = false">取消</NButton>
          <NButton type="primary" @click="executeExport">立即下载</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Code Editor Modal -->
    <NModal
      v-model:show="codeModalVisible"
      preset="card"
      :title="`编辑代码: ${currentPluginName} (${currentPluginId}/index.js)`"
      style="width: 860px; max-width: 95vw;"
    >
      <div class="editor-container">
        <p class="tip-text">代码修改后点击下方保存，系统将即时完成热重载并生效。</p>
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
            placeholder="例如: weather-cmd (将生成 scripts/weather-cmd/index.js)"
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

    <!-- 侧拉自用开发文档抽屉 -->
    <NDrawer v-model:show="docsDrawerVisible" width="680" placement="right">
      <NDrawerContent title="📖 Chaite 插件开发手册 (自用速查)">
        <div class="drawer-doc">
          <h3>1. 目录规范与存放</h3>
          <ul>
            <li><strong>单 JS 脚本插件</strong>：<code>runner/plugins/scripts/&lt;id&gt;/index.js</code>（同目录下放 <code>config.json</code>）</li>
            <li><strong>工程包插件</strong>：<code>runner/plugins/apps/&lt;id&gt;/</code>（含 <code>package.json</code> 与 <code>index.js</code>）</li>
          </ul>

          <h3 style="margin-top: 20px;">2. 最小实例代码</h3>
          <NCode
            language="javascript"
            code="// runner/plugins/scripts/hello/index.js
export const name = '问候插件'
export const version = '1.0.0'

export default function setup(ctx) {
  // 1. 读取配置
  const prefix = ctx.config.prefix || '#打招呼'

  // 2. 注册指令
  ctx.registerCommand(prefix, async (e) => {
    await e.reply(`你好呀，${e.sender.nickname || e.userId}！`)
    return true
  })
}"
          />

          <h3 style="margin-top: 20px;">3. 统一事件对象 (ChaiteEvent) 速查</h3>
          <table class="mini-table">
            <tr><td><code>e.userId</code></td><td>发送者 QQ 号 / 用户 ID</td></tr>
            <tr><td><code>e.groupId</code></td><td>群号（私聊为 null）</td></tr>
            <tr><td><code>e.isGroup / e.isPrivate</code></td><td>是否为群聊 / 私聊</td></tr>
            <tr><td><code>e.text</code></td><td>去除 @ 和指令前缀后的纯文本</td></tr>
            <tr><td><code>e.sender</code></td><td>名片信息：<code>{ nickname, card, role }</code></td></tr>
            <tr><td><code>await e.reply(content)</code></td><td>跨协议统一回复（文本 / 结构化 at / 图片）</td></tr>
            <tr><td><code>await e.queryAI(prompt, [opt])</code></td><td>单轮问答（支持指定预设或纯净基元对话）</td></tr>
            <tr><td><code>await e.askWithContext(prompt, [opt])</code></td><td>携带当前群聊双水位线上下文发问</td></tr>
          </table>

          <p style="font-size: 13px; color: #666; margin-top: 10px;">
            <strong>跨协议回复规范 (推荐结构化传参，无需手拼 CQ 码)：</strong>
          </p>
          <NCode
            language="javascript"
            code="// 1. 结构化艾特回复 (框架自动向协议端转换原生 @)
await e.reply({ text: '查询成功！', at: true })

// 2. 取消引用回复 (默认 reply: true 带引用，设为 false 即单发)
await e.reply({ text: '不带引用的独立消息', reply: false })

// 3. 图文混合回复
await e.reply({ text: '图片如下：', images: ['https://example.com/pic.png'] })

// 注：手写 [CQ:at,qq=...] 亦会被底层内置解析器自动转为原生段兼容"
          />

          <h3 style="margin-top: 20px;">4. queryAI 高级调用模式</h3>
          <p style="font-size: 13px; color: #666;">
            当群聊默认预设性格活泼/不听话，而插件需要执行严谨任务时，推荐以下两种方式：
          </p>
          <NCode
            language="javascript"
            code="// 方式 1: 指定严肃/听话的预设 ID (预设已绑定好渠道与参数)
const res = await e.queryAI('帮我提取关键词', { presetId: 'translator' })

// 方式 2: 纯净基元调用 (完全不走预设人设，直接走指定渠道/模型，适合严格任务)
const pureRes = await e.queryAI('请将以下内容转为 JSON', {
  pure: true, // 开启纯净模式
  systemPrompt: '你是一个只输出 JSON 的高精度助手',
  temperature: 0.1
})"
          />

          <h3 style="margin-top: 20px;">5. 插件配置与 Schema 声明</h3>
          <p style="font-size: 13px; color: #666;">
            插件目录下放置 <code>config.json</code>，即可在代码中通过 <code>ctx.config</code> 读取。如需可视化表单，同级创建 <code>schema.json</code>：
          </p>
          <NCode
            language="json"
            code='[
  { "key": "apiKey", "label": "第三方 API 密钥", "type": "string" },
  { "key": "enableAt", "label": "是否艾特发送者", "type": "boolean", "default": true }
]'
          />

          <h3 style="margin-top: 20px;">5. 轻量持久化 KV (ctx.storage)</h3>
          <NCode
            language="javascript"
            code="// 读取数据 (支持默认值)
const score = await ctx.storage.get('score_' + e.userId, 0)
// 保存数据
await ctx.storage.set('score_' + e.userId, score + 1)
// 删除
await ctx.storage.delete('score_' + e.userId)"
          />

          <h3 style="margin-top: 20px;">6. 注册 Function Calling 工具给大模型</h3>
          <NCode
            language="javascript"
            code="ctx.registerTool({
  name: 'get_time',
  description: '获取当前精准时间',
  parameters: { type: 'object', properties: {} }
}, async () => ({ time: new Date().toISOString() }))"
          />
        </div>
      </NDrawerContent>
    </NDrawer>
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
.drawer-doc {
  font-size: 14px;
  line-height: 1.6;
}
.drawer-doc h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 8px 0;
}
.drawer-doc ul {
  padding-left: 18px;
  margin: 0;
}
.mini-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-top: 8px;
}
.mini-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #eee;
}
.mini-table code {
  background: rgba(120, 120, 120, 0.1);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
