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
  NTooltip,
  useMessage,
} from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'
import {
  cancelScheduledTask,
  fetchJobList,
  fetchScheduledTaskList,
} from '@/service/api/agent'
import type {
  BackgroundJob,
  ScheduledTask,
} from '@/service/api/agent'

const message = useMessage()
const activeTab = ref('jobs')

// ─── Background Jobs ──────────────────────────────────────────────────────────

const jobsData = ref<BackgroundJob[]>([])
const jobsLoading = ref(false)
const jobSearch = reactive({ userId: '', status: undefined as BackgroundJob['status'] | undefined })

function fetchJobs() {
  jobsLoading.value = true
  fetchJobList({ pageSize: 50, userId: jobSearch.userId || undefined, status: jobSearch.status })
    .then((res) => {
      if (res.code === 0)
        jobsData.value = res.data.items
      else
        message.error(res.message || '加载任务列表失败')
    })
    .catch(() => message.error('加载任务列表失败'))
    .finally(() => (jobsLoading.value = false))
}

function formatTs(ts?: number) {
  if (!ts)
    return '-'
  return new Date(ts).toLocaleString()
}

const jobStatusTag: Record<string, { type: 'default' | 'info' | 'success' | 'warning' | 'error'; label: string }> = {
  pending: { type: 'default', label: '等待中' },
  running: { type: 'info', label: '运行中' },
  completed: { type: 'success', label: '已完成' },
  failed: { type: 'error', label: '失败' },
}

const jobColumns: DataTableColumns<BackgroundJob> = [
  { title: 'Job ID', key: 'id', width: 220, ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: row => h(NTag, {
      type: jobStatusTag[row.status]?.type ?? 'default',
      size: 'small',
    }, { default: () => jobStatusTag[row.status]?.label ?? row.status }),
  },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  { title: '用户', key: 'userId', width: 120 },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 160,
    render: row => formatTs(row.createdAt),
  },
  {
    title: '错误信息',
    key: 'error',
    ellipsis: { tooltip: true },
    render: row => row.error
      ? h(NTooltip, {}, { trigger: () => h('span', { style: 'color: var(--n-error-color); cursor: pointer' }, '查看错误'), default: () => row.error })
      : '',
  },
]

const jobStatusOptions = [
  { label: '全部', value: undefined },
  { label: '等待中', value: 'pending' },
  { label: '运行中', value: 'running' },
  { label: '已完成', value: 'completed' },
  { label: '失败', value: 'failed' },
]

// ─── Scheduled Tasks ──────────────────────────────────────────────────────────

const tasksData = ref<ScheduledTask[]>([])
const tasksLoading = ref(false)

function fetchTasks() {
  tasksLoading.value = true
  fetchScheduledTaskList({ pageSize: 100 })
    .then((res) => {
      if (res.code === 0)
        tasksData.value = res.data.items
      else
        message.error(res.message || '加载定时任务失败')
    })
    .catch(() => message.error('加载定时任务失败'))
    .finally(() => (tasksLoading.value = false))
}

function handleCancelTask(row: ScheduledTask) {
  cancelScheduledTask(row.id)
    .then((res) => {
      if (res.code === 0) {
        message.success('已取消')
        fetchTasks()
      }
      else {
        message.error(res.message || '取消失败')
      }
    })
    .catch(() => message.error('取消失败'))
}

const taskStatusTag: Record<string, { type: 'default' | 'info' | 'success' | 'warning' | 'error'; label: string }> = {
  active: { type: 'success', label: '活跃' },
  paused: { type: 'warning', label: '暂停' },
  completed: { type: 'default', label: '已完成' },
  failed: { type: 'error', label: '失败' },
}

const taskColumns: DataTableColumns<ScheduledTask> = [
  { title: '任务 ID', key: 'id', width: 220, ellipsis: { tooltip: true } },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: row => h(NTag, {
      type: taskStatusTag[row.status]?.type ?? 'default',
      size: 'small',
    }, { default: () => taskStatusTag[row.status]?.label ?? row.status }),
  },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  { title: 'Cron', key: 'cronExpression', width: 160 },
  {
    title: '下次执行',
    key: 'nextRunAt',
    width: 160,
    render: row => formatTs(row.nextRunAt),
  },
  {
    title: '最后执行',
    key: 'lastRunAt',
    width: 160,
    render: row => formatTs(row.lastRunAt),
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (row) => {
      return h(NPopconfirm, { onPositiveClick: () => handleCancelTask(row) }, {
        trigger: () => h(NButton, {
          size: 'small', type: 'error', tertiary: true,
          disabled: row.status !== 'active',
        }, { default: () => '取消' }),
        default: () => '确认取消此定时任务？',
      })
    },
  },
]

onMounted(() => {
  fetchJobs()
})

function handleTabChange(tab: string) {
  if (tab === 'jobs')
    fetchJobs()
  if (tab === 'tasks')
    fetchTasks()
}
</script>

<template>
  <NSpace vertical size="large">
    <n-card>
      <n-tabs v-model:value="activeTab" type="line" animated @update:value="handleTabChange">
        <n-tab-pane name="jobs" tab="后台异步任务">
          <NSpace vertical size="medium">
            <n-form label-placement="left" inline :show-feedback="false">
              <NGrid cols="1 s:2 m:4" :x-gap="12" :y-gap="12" responsive="screen" item-responsive>
                <NGridItem span="1">
                  <n-form-item label="状态">
                    <n-select
                      v-model:value="jobSearch.status"
                      :options="jobStatusOptions"
                      style="min-width: 120px"
                      @update:value="fetchJobs"
                    />
                  </n-form-item>
                </NGridItem>
                <NGridItem span="1">
                  <NButton type="primary" @click="fetchJobs">
                    <template #icon>
                      <icon-park-outline-redo />
                    </template>
                    刷新
                  </NButton>
                </NGridItem>
              </NGrid>
            </n-form>
            <n-data-table
              :columns="jobColumns"
              :data="jobsData"
              :loading="jobsLoading"
              :pagination="{ pageSize: 20 }"
              striped
            />
          </NSpace>
        </n-tab-pane>

        <n-tab-pane name="tasks" tab="定时任务">
          <NSpace vertical size="medium">
            <NFlex justify="end">
              <NButton secondary @click="fetchTasks">
                <template #icon>
                  <icon-park-outline-redo />
                </template>
                刷新
              </NButton>
            </NFlex>
            <n-data-table
              :columns="taskColumns"
              :data="tasksData"
              :loading="tasksLoading"
              striped
            />
          </NSpace>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </NSpace>
</template>
