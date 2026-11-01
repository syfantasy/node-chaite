<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NFlex,
  NForm,
  NFormItemGridItem,
  NGrid,
  NGridItem,
  NInput,
  NModal,
  NPagination,
  NPopover,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  useMessage,
} from 'naive-ui'
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { ListToolModels } from '@/service/api/tools'
import {
  createTool,
  deleteTool,
  fetchAllToolList,
  fetchToolList,
  updateTool,
  uploadToolToCloud,
} from '@/service/api/tools'
import ToolFormModal from './ToolFormModal.vue'
import ToolTestModal from './ToolTestModal.vue'
import ToolConfigModal from './ToolConfigModal.vue'
import {
  createToolGroup,
  deleteToolGroup,
  fetchAllToolGroupList,
  updateToolGroup,
} from '@/service/api/toolGroup'
import ToolGroupFormModal from '@/views/tools/ToolGroupFormModal.vue'
import IconLinkCloudSuccess from '~icons/icon-park-outline/cloudy'
import type { Shareable } from '@/typings/entities/shareable'

const router = useRouter()
const message = useMessage()

// 本地工具列定义
function createColumns({
  upload,
  edit,
  config,
  test,
  remove,
}: {
  upload: (row: Shareable.ToolModel) => void
  edit: (row: Shareable.ToolModel) => void
  config: (row: Shareable.ToolModel) => void
  test: (row: Shareable.ToolModel) => void
  remove: (row: Shareable.ToolModel) => void
}): DataTableColumns<Shareable.ToolModel> {
  return [
    {
      title: 'ID',
      key: 'id',
      width: 140,
      ellipsis: { tooltip: true },
    },
    {
      title: '名称',
      key: 'name',
      render(row: Shareable.ToolModel) {
        const children = [
          h('span', { style: { fontWeight: '600' } }, row.name),
        ] as any[]
        if (row.uploader) {
          children.push(
            h(
              NPopover,
              { trigger: 'hover' },
              { trigger: () => h(IconLinkCloudSuccess, { style: { color: 'green', marginLeft: '6px' } }), default: () => '云端工具' },
            ),
          )
        }
        return h(NFlex, { align: 'center' }, { default: () => children })
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      render(row: Shareable.ToolModel) {
        return row.status === 'disabled'
          ? h(NPopover, { trigger: 'hover' }, { trigger: h(NTag, { type: 'error' }, { default: () => '禁用' }), default: () => '已禁用，不会被任何工具组使用' })
          : h(NTag, { type: 'success' }, { default: () => '正常' })
      },
    },
    {
      title: '描述',
      key: 'description',
      ellipsis: { tooltip: true },
    },
    {
      title: '创建日期',
      key: 'createdAt',
      width: 170,
    },
    {
      title: '操作',
      key: 'actions',
      width: 250,
      render(row: any) {
        return [
          h(
            NButton,
            {
              type: 'primary',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => upload(row),
              disabled: !!row.uploader?.username,
            },
            { default: () => '上传' },
          ),
          h(
            NButton,
            {
              type: 'info',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => edit(row),
            },
            { default: () => '修改' },
          ),
          h(
            NButton,
            {
              type: 'warning',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => config(row),
            },
            { default: () => '配置' },
          ),
          h(NButton, { type: 'success', strong: true, tertiary: true, size: 'small', onClick: () => test(row) }, { default: () => '测试' }),
          h(
            NButton,
            {
              type: 'error',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => remove(row),
            },
            { default: () => '删除' },
          ),
        ]
      },
    },
  ]
}

// 插件工具列定义
function createPluginToolColumns({
  inspect,
  config,
  test,
}: {
  inspect: (row: any) => void
  config: (row: any) => void
  test: (row: any) => void
}): DataTableColumns<any> {
  return [
    {
      title: '工具标识 (Name)',
      key: 'name',
      width: 190,
      render(row: any) {
        return h('code', { style: { fontWeight: '600', color: '#18a058' } }, row.name)
      },
    },
    {
      title: '传递给大模型的描述 (Description)',
      key: 'description',
      ellipsis: { tooltip: true },
    },
    {
      title: '所属插件',
      key: 'pluginName',
      width: 200,
      render(row: any) {
        return h(NTag, { type: 'info', size: 'small', secondary: true }, { default: () => `${row.pluginName || row.pluginId}` })
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render() {
        return h(NTag, { type: 'success', bordered: false }, { default: () => '插件已注册' })
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 230,
      render(row: any) {
        return [
          h(
            NButton,
            {
              type: 'primary',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => inspect(row),
            },
            { default: () => '📋 模型声明' },
          ),
          h(
            NButton,
            {
              type: 'warning',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => config(row),
            },
            { default: () => '⚙️ 配置' },
          ),
          h(
            NButton,
            {
              type: 'success',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => test(row),
            },
            { default: () => '🧪 测试' },
          ),
        ]
      },
    },
  ]
}

// 工具组列定义
function createGroupColumns({
  upload,
  edit,
  remove,
}: {
  upload: (row: Shareable.ToolsGroupModel) => void
  edit: (row: Shareable.ToolsGroupModel) => void
  remove: (row: Shareable.ToolsGroupModel) => void
}): DataTableColumns<Shareable.ToolsGroupModel> {
  return [
    {
      title: 'ID',
      key: 'id',
      resizable: true,
    },
    {
      title: '组名称',
      key: 'name',
      render(row) {
        return h('div', {}, row.name)
      },
      resizable: true,
    },
    {
      title: '描述',
      key: 'description',
      width: 500,
    },
    {
      title: '工具数量',
      key: 'toolCount',
      render(row) {
        return h('div', {}, row.isDefault ? '-' : (row.toolIds?.length || 0))
      },
    },
    {
      title: '创建日期',
      key: 'createdAt',
      resizable: true,
    },
    {
      title: '操作',
      key: 'actions',
      render(row) {
        return [
          h(
            NButton,
            {
              type: 'info',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => edit(row),
              disabled: row.isDefault,
            },
            { default: () => '修改' },
          ),
          h(
            NButton,
            {
              type: 'error',
              strong: true,
              tertiary: true,
              size: 'small',
              onClick: () => remove(row),
              disabled: row.isDefault,
            },
            { default: () => '删除' },
          ),
        ]
      },
    },
  ]
}

const data = reactive({ value: [] as Shareable.ToolModel[] })
const availableTools = ref([] as Shareable.ToolModel[])
const showModal = ref(false)
const editMode = ref(false)
const defaultTool = {
  modelType: 'settings',
  name: '',
  code: '',
  description: '',
  uploader: undefined,
} as Shareable.ToolModel
const currentTool = ref<Shareable.ToolModel>(JSON.parse(JSON.stringify(defaultTool)))
const loading = ref(false)
const showTestModal = ref(false)
const showConfigModal = ref(false)
const testingTool = ref<Shareable.ToolModel>()
const configuringTool = ref<Shareable.ToolModel>()

// 插件工具查看声明
const inspectingTool = ref<any>(null)
const showInspectModal = ref(false)
const selectedPluginId = ref<string>('')

// 工具组相关状态
const groupData = reactive({ value: [] as Shareable.ToolsGroupModel[] })
const showGroupModal = ref(false)
const editGroupMode = ref(false)
const defaultGroup = {
  name: '',
  description: '',
  toolIds: [],
  modelType: 'settings',
  embedded: false,
} as Shareable.ToolsGroupModel
const currentGroup = ref<Shareable.ToolsGroupModel>(JSON.parse(JSON.stringify(defaultGroup)))
const groupLoading = ref(false)
const toolPage = ref(1)
const toolPageSize = ref(20)
const toolTotal = ref(0)
const activeTab = ref('tools')

interface BuiltinToolRow {
  name: string
  description: string
  visibility: string
  source: string
}

const builtinTools: BuiltinToolRow[] = [
  { name: 'remember', description: '记录或更新长期事实记忆（支持百分制重要度与优先置换淘汰，后台静默执行）。', visibility: '开启记忆的预设对话', source: '内置长期记忆' },
  { name: 'update_memory_importance', description: '微调已有记忆的重要度（1~100），动态影响淘汰优先级。', visibility: '开启记忆的预设对话', source: '内置长期记忆' },
  { name: 'get_memories', description: '主动检索当前群或用户已保存的长期事实清单。', visibility: '开启记忆的预设对话', source: '内置长期记忆' },
  { name: 'forget_memory', description: '主动遗忘或删除已失效的特定事实记忆。', visibility: '开启记忆的预设对话', source: '内置长期记忆' },
  { name: 'search_mcp_tools', description: '搜索已配置 MCP Server 中的可用工具，不预先加载全量 schema。', visibility: '所有启用 MCP 的对话', source: 'MCP 运行时' },
  { name: 'activate_mcp_tools', description: '按需激活指定的少量 MCP 工具，下一轮模型直接可用。', visibility: '所有启用 MCP 的对话', source: 'MCP 运行时' },
  { name: 'list_mcp_servers', description: '查看配置的 MCP Server 及已缓存工具数，不泄露凭据。', visibility: '仅机器人主人', source: 'MCP 管理' },
  { name: 'draft_mcp_server', description: '生成 MCP 配置草案，主人确认后写入。', visibility: '仅机器人主人', source: 'MCP 管理' },
  { name: 'list_skills', description: '列出已加载的 Skill 列表及元数据。', visibility: '仅机器人主人', source: 'Skill 管理' },
  { name: 'create_skill / update_skill / delete_skill', description: '动态创建、修改或删除 Skill 文件。', visibility: '仅机器人主人', source: 'Skill 管理' },
  { name: 'create_workflow / run_skill', description: '编排复杂工作流或按需直接执行 Skill。', visibility: '仅机器人主人', source: 'Skill 管理' },
  { name: 'schedule_task / cancel_scheduled_task / list_scheduled_tasks', description: '创建与维护基于自然语言的定时调度任务。', visibility: '主人与受信任对话', source: '系统调度' },
  { name: 'spawn_background_task / check_job_status', description: '派发耗时异步后台任务并追踪进度。', visibility: '主人与受信任对话', source: '任务与执行' },
]

const builtinColumns: DataTableColumns<BuiltinToolRow> = [
  { title: '工具', key: 'name', width: 250 },
  { title: '作用', key: 'description' },
  { title: '可见范围', key: 'visibility', width: 180 },
  { title: '来源', key: 'source', width: 150 },
]

// 所有插件注册的工具
const allPluginTools = computed(() => {
  return availableTools.value.filter((t: any) => Boolean(t.isPluginTool))
})

// 注册了工具的插件下拉选项
const pluginOptions = computed(() => {
  const map = new Map<string, string>()
  for (const t of allPluginTools.value) {
    const pid = (t as any).pluginId || 'unknown'
    const pname = (t as any).pluginName || pid
    if (!map.has(pid)) {
      map.set(pid, pname)
    }
  }
  return Array.from(map.entries()).map(([pid, pname]) => ({
    label: `${pname} (${pid})`,
    value: pid,
  }))
})

// 当前选中的插件注册的所有工具
const currentPluginTools = computed(() => {
  if (!selectedPluginId.value) return allPluginTools.value
  return allPluginTools.value.filter((t: any) => (t as any).pluginId === selectedPluginId.value)
})

watch(pluginOptions, (opts) => {
  if (opts.length > 0 && (!selectedPluginId.value || !opts.some(o => o.value === selectedPluginId.value))) {
    selectedPluginId.value = opts[0].value
  }
}, { immediate: true })

function fetchTools(filter?: any) {
  loading.value = true
  fetchToolList({
    ...filter,
    toolType: 'local', // 本地工具 Tab 只加载本地独立工具
    page: toolPage.value,
    pageSize: toolPageSize.value,
  }).then((res) => {
    data.value = res.data.items
    toolTotal.value = res.data.total
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

function fetchAvailableTools() {
  fetchAllToolList().then((items) => {
    availableTools.value = items
  }).catch(() => {})
}

function handleRemoveTool(row: Shareable.ToolModel) {
  window.$dialog.warning({
    title: '确认删除',
    content: `确定要删除工具 "${row.name}" 吗？此操作不可恢复`,
    positiveText: '确认删除',
    onPositiveClick: () => {
      deleteTool(row.id as string).then((res) => {
        if (res.code === 0) {
          message.success('删除成功')
          fetchTools()
        }
      }).finally(() => (loading.value = false))
    },
  })
}

function handleSubmitTool(toolData: Shareable.ToolModel) {
  loading.value = true
  const action = editMode.value && toolData.id
    ? updateTool(toolData.id, toolData)
    : createTool(toolData)
  action.then((res) => {
    if (res.code === 0) {
      message.success(editMode.value ? '修改成功' : '创建成功')
      fetchTools()
    }
    else {
      message.error(res.message || '操作失败')
    }
  }).finally(() => {
    loading.value = false
    showModal.value = false
  })
}

const columns = createColumns({
  upload(row) {
    uploadToolToCloud(row as { id: string }).then((res) => {
      if (res.code === 0) {
        message.success('上传成功')
      }
    })
  },
  edit(row) {
    editMode.value = true
    currentTool.value = { ...row }
    showModal.value = true
  },
  config(row) {
    configuringTool.value = row
    showConfigModal.value = true
  },
  test(row) {
    testingTool.value = row
    showTestModal.value = true
  },
  remove: handleRemoveTool,
})

const pluginColumns = createPluginToolColumns({
  inspect(row) {
    inspectingTool.value = row
    showInspectModal.value = true
  },
  config(row) {
    configuringTool.value = row
    showConfigModal.value = true
  },
  test(row) {
    testingTool.value = row
    showTestModal.value = true
  },
})

function handleAddTool() {
  editMode.value = false
  currentTool.value = JSON.parse(JSON.stringify(defaultTool)) as Shareable.ToolModel
  showModal.value = true
}

function fetchToolGroups(filter?: any) {
  groupLoading.value = true
  fetchAllToolGroupList(filter).then((items) => {
    groupData.value = items
    groupLoading.value = false
  }).catch(() => {
    groupLoading.value = false
  })
}

function handleViewToolGroup(row: Shareable.ToolsGroupModel) {
  message.info(`查看工具组: ${row.name}，包含 ${row.toolIds?.length || 0} 个工具`)
}

function handleRemoveToolGroup(row: Shareable.ToolsGroupModel) {
  window.$dialog.warning({
    title: '确认删除',
    content: `确定要删除工具组 "${row.name}" 吗？此操作不可恢复`,
    positiveText: '确认删除',
    onPositiveClick: () => {
      groupLoading.value = true
      deleteToolGroup(row.id as string).then((res) => {
        if (res.code === 0) {
          message.success('删除成功')
          fetchToolGroups()
        }
      }).finally(() => (groupLoading.value = false))
    },
  })
}

function handleSubmitToolGroup(gData: Shareable.ToolsGroupModel) {
  groupLoading.value = true
  const action = editGroupMode.value && gData.id
    ? updateToolGroup(gData.id, gData)
    : createToolGroup(gData)
  action.then((res) => {
    if (res.code === 0) {
      message.success(editGroupMode.value ? '修改成功' : '创建成功')
      fetchToolGroups()
    }
    else {
      message.error(res.message || '操作失败')
    }
  }).finally(() => {
    groupLoading.value = false
    showGroupModal.value = false
  })
}

const groupColumns = createGroupColumns({
  upload: handleViewToolGroup,
  edit(row) {
    fetchAvailableTools()
    editGroupMode.value = true
    currentGroup.value = { ...row }
    showGroupModal.value = true
  },
  remove: handleRemoveToolGroup,
})

function handleAddToolGroup() {
  fetchAvailableTools()
  editGroupMode.value = false
  currentGroup.value = JSON.parse(JSON.stringify(defaultGroup)) as Shareable.ToolsGroupModel
  showGroupModal.value = true
}

onMounted(() => {
  fetchTools()
  fetchAvailableTools()
  fetchToolGroups()
})

// 搜索本地工具
const searchModel = reactive({
  name: undefined,
} as ListToolModels)

function handleResetSearch() {
  searchModel.name = undefined
  toolPage.value = 1
  fetchTools(searchModel)
}

function handleToolSearch() {
  toolPage.value = 1
  fetchTools(searchModel)
}

function handleToolPageChange(page: number) {
  toolPage.value = page
  fetchTools(searchModel)
}

function handleToolPageSizeChange(pageSize: number) {
  toolPageSize.value = pageSize
  toolPage.value = 1
  fetchTools(searchModel)
}
</script>

<template>
  <div class="chaite-page">
    <header class="chaite-page-header" data-tour="tools">
      <div>
        <h1>工具与分组</h1>
        <p>维护模型可调用的能力，并通过工具组快速关联到预设。</p>
      </div>
      <NSpace>
        <NButton secondary @click="router.push('/agent?tab=mcp')">
          <template #icon><icon-park-outline-connection /></template>
          MCP 服务器
        </NButton>
        <NButton type="primary" @click="handleAddTool">
          <template #icon><icon-park-outline-add-one /></template>
          创建工具
        </NButton>
      </NSpace>
    </header>

    <NSpace vertical size="large">
      <NCard class="chaite-panel" :bordered="false">
        <NTabs v-model:value="activeTab" type="line" animated>
          <!-- 1. 本地独立工具管理 -->
          <NTabPane name="tools" tab="本地工具管理">
            <NSpace vertical size="large">
              <NForm :model="searchModel" label-placement="left" inline :show-feedback="false">
                <NGrid cols="1 s:2 m:3 l:6" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
                  <NFormItemGridItem span="2" label="名称" path="name">
                    <NInput v-model:value="searchModel.name" placeholder="请输入要搜索的本地工具名称关键词" />
                  </NFormItemGridItem>
                  <NGridItem span="1">
                    <NFlex class="ml-auto">
                      <NButton type="primary" @click="handleToolSearch">
                        <template #icon><icon-park-outline-search /></template>
                        搜索
                      </NButton>
                      <NButton strong secondary @click="handleResetSearch">
                        <template #icon><icon-park-outline-redo /></template>
                        重置
                      </NButton>
                    </NFlex>
                  </NGridItem>
                </NGrid>
              </NForm>

              <div class="flex gap-4">
                <NButton type="primary" @click="handleAddTool">
                  <template #icon><icon-park-outline-add-one /></template>
                  新建工具
                </NButton>
              </div>

              <NDataTable :columns="columns" :data="data.value" :loading="loading" />

              <NPagination
                :page="toolPage"
                :page-size="toolPageSize"
                :item-count="toolTotal"
                show-size-picker
                :page-sizes="[10, 20, 50, 100]"
                @update:page="handleToolPageChange"
                @update:page-size="handleToolPageSizeChange"
              />
            </NSpace>
          </NTabPane>

          <!-- 2. 插件注册托管工具 -->
          <NTabPane name="plugin_tools" tab="插件注册工具">
            <NSpace vertical size="large">
              <NFlex justify="space-between" align="center" style="background: rgba(120, 120, 120, 0.04); padding: 12px 16px; border-radius: 8px;">
                <NFlex align="center" size="medium">
                  <span style="font-weight: 600; font-size: 14px;">选择已注册工具的插件：</span>
                  <NSelect
                    v-model:value="selectedPluginId"
                    :options="pluginOptions"
                    placeholder="请选择插件..."
                    style="width: 320px;"
                  />
                  <NTag type="info" secondary>
                    共 {{ currentPluginTools.length }} 个工具
                  </NTag>
                </NFlex>

                <NButton
                  secondary
                  type="warning"
                  @click="router.push('/plugin-manager')"
                >
                  前往【插件管理】修改配置
                </NButton>
              </NFlex>

              <div v-if="pluginOptions.length === 0" style="padding: 40px 0; text-align: center;">
                <NEmpty description="当前暂无注册了工具的插件" />
              </div>

              <NDataTable
                v-else
                :columns="pluginColumns"
                :data="currentPluginTools"
              />
            </NSpace>
          </NTabPane>

          <!-- 3. 工具组管理 -->
          <NTabPane name="groups" tab="工具组管理">
            <NSpace vertical size="large">
              <div class="flex gap-4">
                <NButton type="primary" @click="handleAddToolGroup">
                  <template #icon><icon-park-outline-add-one /></template>
                  新建工具组
                </NButton>
              </div>
              <NDataTable :columns="groupColumns" :data="groupData.value" :loading="groupLoading" />
            </NSpace>
          </NTabPane>

          <!-- 4. 内置工具 -->
          <NTabPane name="builtins" tab="内置工具">
            <NSpace vertical size="large">
              <NAlert type="info" :show-icon="false">
                内置工具由 Chaite 在运行时按权限注入，不会写入本地工具数据库，也无需加入工具组。MCP 的真实工具只有在对应 Skill 被激活后才会临时出现。
              </NAlert>
              <NDataTable :columns="builtinColumns" :data="builtinTools" />
            </NSpace>
          </NTabPane>
        </NTabs>
      </NCard>

      <!-- 本地工具表单弹窗 -->
      <ToolFormModal
        v-model:show="showModal"
        :edit-mode="editMode"
        :initial-data="currentTool"
        @submit="handleSubmitTool"
      />

      <!-- 工具测试弹窗 -->
      <ToolTestModal v-model:show="showTestModal" :tool="testingTool" />

      <!-- 工具配置弹窗 -->
      <ToolConfigModal v-model:show="showConfigModal" :tool="configuringTool" />

      <!-- 工具组编辑弹窗 -->
      <ToolGroupFormModal
        v-model:show="showGroupModal"
        :edit-mode="editGroupMode"
        :initial-data="currentGroup"
        :available-tools="availableTools"
        @submit="handleSubmitToolGroup"
      />

      <!-- 插件工具模型调用声明查看弹窗 -->
      <NModal
        v-model:show="showInspectModal"
        preset="card"
        :title="`工具模型调用声明 · ${inspectingTool?.name || ''}`"
        style="width: 720px; max-width: 95vw;"
      >
        <div v-if="inspectingTool">
          <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
            <span style="font-weight: 600; font-size: 15px;">{{ inspectingTool.name }}</span>
            <NTag type="info" size="small" secondary>
              所属插件: {{ inspectingTool.pluginName || inspectingTool.pluginId }}
            </NTag>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="font-size: 13px; font-weight: 600; color: #555; margin-bottom: 4px;">
              传递给大模型的工具描述 (Description)：
            </div>
            <div style="background: rgba(120, 120, 120, 0.06); padding: 10px 14px; border-radius: 6px; font-size: 13px; line-height: 1.5; color: #333;">
              {{ inspectingTool.description || '暂无描述' }}
            </div>
          </div>

          <div>
            <div style="font-size: 13px; font-weight: 600; color: #555; margin-bottom: 4px;">
              传递给大模型的参数规范 (JSON Schema Parameters)：
            </div>
            <NInput
              :value="JSON.stringify(inspectingTool.parameters || { type: 'object', properties: {} }, null, 2)"
              type="textarea"
              :autosize="{ minRows: 6, maxRows: 16 }"
              readonly
              style="font-family: monospace; font-size: 12px;"
            />
          </div>
        </div>

        <template #action>
          <NFlex justify="space-between" align="center" style="width: 100%;">
            <NButton
              secondary
              type="warning"
              @click="showInspectModal = false; router.push('/plugin-manager')"
            >
              前往【插件管理】修改配置
            </NButton>
            <NButton @click="showInspectModal = false">
              关闭
            </NButton>
          </NFlex>
        </template>
      </NModal>
    </NSpace>
  </div>
</template>
