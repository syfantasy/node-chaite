<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import {
  NButton,
  NFlex,
  NPopconfirm,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui'
import { h, onMounted, ref } from 'vue'
import {
  createMcpServer,
  deleteMcpServer,
  fetchMcpServerList,
  testMcpServer,
  updateMcpServer,
} from '@/service/api/agent'
import type { McpServerConfig } from '@/service/api/agent'
import McpServerFormModal from './McpServerFormModal.vue'

const message = useMessage()

const mcpData = ref<McpServerConfig[]>([])
const mcpLoading = ref(false)
const showMcpModal = ref(false)
const mcpEditMode = ref(false)
const currentMcp = ref<Partial<McpServerConfig>>({})
const mcpTestingId = ref<string | null>(null)

function fetchMcpServers() {
  mcpLoading.value = true
  fetchMcpServerList({ pageSize: 100 })
    .then((res) => {
      if (res.code === 0)
        mcpData.value = res.data.items
      else
        message.error(res.message || '加载 MCP 服务器失败')
    })
    .catch(() => message.error('加载 MCP 服务器失败'))
    .finally(() => (mcpLoading.value = false))
}

function handleAddMcp() {
  mcpEditMode.value = false
  currentMcp.value = {}
  showMcpModal.value = true
}

function handleEditMcp(row: McpServerConfig) {
  mcpEditMode.value = true
  currentMcp.value = { ...row }
  showMcpModal.value = true
}

function handleDeleteMcp(row: McpServerConfig) {
  deleteMcpServer(row.id)
    .then((res) => {
      if (res.code === 0) {
        message.success('删除成功')
        fetchMcpServers()
      }
      else {
        message.error(res.message || '删除失败')
      }
    })
    .catch(() => message.error('删除失败'))
}

function handleTestMcp(row: McpServerConfig) {
  mcpTestingId.value = row.id
  testMcpServer(row.id)
    .then((res) => {
      if (res.code === 0) {
        message.success(`连接成功，缓存 ${res.data.cachedToolCount ?? res.data.toolCount} 个工具：${res.data.tools.slice(0, 8).map(tool => tool.name).join('、')}${res.data.toolCount > 8 ? '…' : ''}`)
        fetchMcpServers()
      }
      else {
        message.error(res.message || '连接失败')
      }
    })
    .catch(() => message.error('连接测试失败'))
    .finally(() => (mcpTestingId.value = null))
}

function handleSubmitMcp(data: Parameters<typeof createMcpServer>[0]) {
  const action = mcpEditMode.value && currentMcp.value.id
    ? updateMcpServer(currentMcp.value.id, data)
    : createMcpServer(data)
  action
    .then((res) => {
      if (res.code === 0) {
        message.success(mcpEditMode.value ? '更新成功' : '添加成功')
        fetchMcpServers()
      }
      else {
        message.error(res.message || '操作失败')
      }
    })
    .catch(() => message.error('操作失败'))
}

const mcpColumns: DataTableColumns<McpServerConfig> = [
  { title: '服务名称', key: 'name', width: 160 },
  {
    title: '通信地址/命令',
    key: 'endpoint',
    ellipsis: { tooltip: true },
    render: row => h('span', { style: 'font-family: monospace; font-size: 12px' }, row.transport === 'stdio' ? `${row.command || ''} ${(row.args || []).join(' ')}` : row.url || row.baseUrl || ''),
  },
  {
    title: '状态',
    key: 'enabled',
    width: 80,
    render: row => h(NTag, {
      type: row.enabled ? 'success' : 'default',
      size: 'small',
    }, { default: () => row.enabled ? '启用' : '禁用' }),
  },
  {
    title: '已缓存工具',
    key: 'tools',
    width: 110,
    render: row => h(NTag, { size: 'small', type: 'info' }, { default: () => `${row.tools?.length ?? 0} 个` }),
  },
  {
    title: '描述',
    key: 'description',
    ellipsis: { tooltip: true },
  },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    render: (row) => {
      const isTesting = mcpTestingId.value === row.id
      return h(NFlex, { gap: 6 }, {
        default: () => [
          h(NButton, {
            size: 'small', type: 'success', tertiary: true,
            loading: isTesting, disabled: isTesting,
            onClick: () => handleTestMcp(row),
          }, { default: () => '连通测试' }),
          h(NButton, {
            size: 'small', type: 'info', tertiary: true,
            onClick: () => handleEditMcp(row),
          }, { default: () => '编辑' }),
          h(NPopconfirm, {
            onPositiveClick: () => handleDeleteMcp(row),
          }, {
            trigger: () => h(NButton, { size: 'small', type: 'error', tertiary: true }, { default: () => '删除' }),
            default: () => `确认删除 "${row.name}"？`,
          }),
        ],
      })
    },
  },
]

onMounted(() => {
  fetchMcpServers()
})
</script>

<template>
  <NSpace vertical size="large">
    <n-card title="MCP 服务管理">
      <template #header-extra>
        <NButton type="primary" @click="handleAddMcp">
          <template #icon>
            <icon-park-outline-add-one />
          </template>
          添加 MCP 服务
        </NButton>
      </template>
      <n-data-table
        :columns="mcpColumns"
        :data="mcpData"
        :loading="mcpLoading"
        striped
      />
    </n-card>

    <McpServerFormModal
      v-model:show="showMcpModal"
      :edit-mode="mcpEditMode"
      :initial-data="currentMcp"
      @submit="handleSubmitMcp"
    />
  </NSpace>
</template>
