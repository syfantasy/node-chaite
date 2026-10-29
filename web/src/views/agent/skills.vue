<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import {
  NButton,
  NFlex,
  NGrid,
  NGridItem,
  NPopconfirm,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui'
import { h, onMounted, ref } from 'vue'
import {
  createSkill,
  deleteSkill,
  fetchAllMcpServerList,
  fetchSkillDetail,
  fetchSkillList,
  reloadSkills,
  runSkill,
  updateSkill,
} from '@/service/api/agent'
import type {
  CreateSkillDTO,
  McpServerConfig,
  SkillDetail,
  SkillMeta,
  UpdateSkillDTO,
} from '@/service/api/agent'
import { fetchAllPresetList } from '@/service/api/presets'
import SkillFormModal from './SkillFormModal.vue'

const message = useMessage()

const skillsData = ref<SkillMeta[]>([])
const skillsLoading = ref(false)
const showSkillModal = ref(false)
const skillEditMode = ref(false)
const currentSkillDetail = ref<Partial<SkillDetail>>({})
const skillReloading = ref(false)
const presetOptions = ref<Array<{ label: string; value: string }>>([])
const mcpOptionData = ref<McpServerConfig[]>([])

const skillSearchName = ref('')

function fetchSkills() {
  skillsLoading.value = true
  fetchSkillList({ name: skillSearchName.value || undefined })
    .then((res) => {
      if (res.code === 0)
        skillsData.value = res.data.items
      else
        message.error(res.message || '加载技能列表失败')
    })
    .catch(() => message.error('加载技能列表失败'))
    .finally(() => (skillsLoading.value = false))
}

function handleAddSkill() {
  skillEditMode.value = false
  currentSkillDetail.value = {}
  showSkillModal.value = true
}

function handleEditSkill(row: SkillMeta) {
  skillsLoading.value = true
  fetchSkillDetail(row.id)
    .then((res) => {
      if (res.code === 0) {
        skillEditMode.value = true
        currentSkillDetail.value = res.data
        showSkillModal.value = true
      }
      else {
        message.error(res.message || '加载技能详情失败')
      }
    })
    .catch(() => message.error('加载技能详情失败'))
    .finally(() => (skillsLoading.value = false))
}

function handleDeleteSkill(row: SkillMeta) {
  deleteSkill(row.id)
    .then((res) => {
      if (res.code === 0) {
        message.success('删除成功')
        fetchSkills()
      }
      else {
        message.error(res.message || '删除失败')
      }
    })
    .catch(() => message.error('删除失败'))
}

function handleRunSkill(row: SkillMeta) {
  if (row.frontmatter.executionMode === 'direct') {
    message.warning('direct 模式技能由聊天意图暗号自动唤醒，无需手动运行')
    return
  }
  runSkill(row.id, { background: true })
    .then((res) => {
      if (res.code === 0)
        message.success(`已提交后台任务，Job ID: ${res.data?.jobId ?? '未知'}`)
      else
        message.error(res.message || '运行失败')
    })
    .catch(() => message.error('运行失败'))
}

function handleReloadSkills() {
  skillReloading.value = true
  reloadSkills()
    .then((res) => {
      if (res.code === 0) {
        message.success(`重载成功，共 ${res.data.count} 个技能`)
        fetchSkills()
      }
      else {
        message.error(res.message || '重载失败')
      }
    })
    .catch(() => message.error('重载失败'))
    .finally(() => (skillReloading.value = false))
}

function handleSubmitSkill(data: CreateSkillDTO | (UpdateSkillDTO & { name?: string })) {
  if (skillEditMode.value && currentSkillDetail.value.name) {
    updateSkill(currentSkillDetail.value.name, data as UpdateSkillDTO)
      .then((res) => {
        if (res.code === 0) {
          message.success('更新成功')
          fetchSkills()
        }
        else {
          message.error(res.message || '更新失败')
        }
      })
      .catch(() => message.error('更新失败'))
  }
  else {
    createSkill(data as CreateSkillDTO)
      .then((res) => {
        if (res.code === 0) {
          message.success('创建成功')
          fetchSkills()
        }
        else {
          message.error(res.message || '创建失败')
        }
      })
      .catch(() => message.error('创建失败'))
  }
}

const executionModeLabel: Record<string, string> = {
  direct: '直接对话 (Direct)',
  plan: '自动规划 (Plan)',
  workflow: '工作流 (Workflow)',
}

const skillColumns: DataTableColumns<SkillMeta> = [
  { title: '技能名称', key: 'id', width: 170 },
  {
    title: '触发暗号/关键词',
    key: 'frontmatter.keywords',
    width: 200,
    render: (row) => {
      const keywords = row.frontmatter.keywords || []
      if (!keywords.length) return h('span', { style: 'color: #999; font-size: 12px' }, '未配关键词')
      return h(NFlex, { gap: 4 }, {
        default: () => keywords.map(kw => h(NTag, { size: 'small', type: 'info' }, { default: () => kw })),
      })
    },
  },
  {
    title: '装配工具 / 关联 MCP',
    key: 'tools',
    width: 220,
    render: (row) => {
      const allowed = row.frontmatter.allowedTools || []
      const mcp = row.frontmatter.mcpServer
      const tags = []
      if (mcp) tags.push(h(NTag, { size: 'small', type: 'success' }, { default: () => `MCP: ${mcp}` }))
      for (const t of allowed.slice(0, 3)) tags.push(h(NTag, { size: 'small' }, { default: () => t }))
      if (allowed.length > 3) tags.push(h(NTag, { size: 'small', type: 'default' }, { default: () => `+${allowed.length - 3}` }))
      return tags.length ? h(NFlex, { gap: 4 }, { default: () => tags }) : h('span', { style: 'color: #999; font-size: 12px' }, '不限工具')
    },
  },
  {
    title: '业务说明',
    key: 'frontmatter.description',
    ellipsis: { tooltip: true },
    render: row => row.frontmatter.description,
  },
  {
    title: '来源',
    key: 'frontmatter.source',
    width: 90,
    render: (row) => {
      const source = (row.frontmatter as any).source || (row.frontmatter.readonly ? 'plugin' : 'file')
      return source === 'plugin'
        ? h(NTag, { type: 'warning', size: 'small' }, { default: () => '插件注入' })
        : h(NTag, { type: 'default', size: 'small' }, { default: () => '自定义' })
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 170,
    render: (row) => {
      const readonly = row.frontmatter.readonly
      return h(NFlex, { gap: 6 }, {
        default: () => [
          h(NButton, {
            size: 'small', type: 'primary', tertiary: true,
            onClick: () => handleEditSkill(row),
            disabled: readonly,
          }, { default: () => '装配编辑' }),
          h(NPopconfirm, {
            onPositiveClick: () => handleDeleteSkill(row),
          }, {
            trigger: () => h(NButton, {
              size: 'small', type: 'error', tertiary: true,
              disabled: readonly,
            }, { default: () => '删除' }),
            default: () => `确认删除技能 "${row.id}"？`,
          }),
        ],
      })
    },
  },
]

function loadData() {
  fetchSkills()
  fetchAllPresetList().then((items) => {
    presetOptions.value = items.map(p => ({ label: p.name, value: p.name }))
  }).catch(() => {})
  fetchAllMcpServerList().then(items => (mcpOptionData.value = items)).catch(() => {})
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <NSpace vertical size="large">
    <n-card>
      <n-form label-placement="left" inline :show-feedback="false">
        <NGrid cols="1 s:2 m:4" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
          <NGridItem span="1">
            <n-form-item label="名称">
              <n-input
                v-model:value="skillSearchName"
                placeholder="搜索技能名称或描述"
                clearable
                @keydown.enter="fetchSkills"
              />
            </n-form-item>
          </NGridItem>
          <NGridItem span="1">
            <NFlex>
              <NButton type="primary" @click="fetchSkills">
                <template #icon>
                  <icon-park-outline-search />
                </template>
                搜索
              </NButton>
              <NButton secondary @click="skillSearchName = ''; fetchSkills()">
                <template #icon>
                  <icon-park-outline-redo />
                </template>
                重置
              </NButton>
            </NFlex>
          </NGridItem>
        </NGrid>
      </n-form>
    </n-card>

    <n-card title="技能管理 (Skill)">
      <template #header-extra>
        <NFlex gap="8">
          <NButton type="primary" @click="handleAddSkill">
            <template #icon>
              <icon-park-outline-add-one />
            </template>
            装配新技能
          </NButton>
          <NButton secondary :loading="skillReloading" @click="handleReloadSkills">
            <template #icon>
              <icon-park-outline-redo />
            </template>
            重载技能
          </NButton>
        </NFlex>
      </template>

      <n-data-table
        :columns="skillColumns"
        :data="skillsData"
        :loading="skillsLoading"
        :pagination="{ pageSize: 20 }"
        striped
      />
    </n-card>

    <SkillFormModal
      v-model:show="showSkillModal"
      :edit-mode="skillEditMode"
      :initial-data="currentSkillDetail"
      :preset-options="presetOptions"
      :mcp-server-options="mcpOptionData.map(server => ({ label: server.name, value: server.id }))"
      @submit="handleSubmitSkill"
    />
  </NSpace>
</template>
