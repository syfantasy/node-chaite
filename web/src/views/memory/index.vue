<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NInput,
  NInputNumber,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
  useMessage,
} from 'naive-ui'
import { h, onMounted, reactive, ref } from 'vue'
import type { MemoryRecord, MemoryScope } from '@/service/api/memory'
import {
  deleteMemory,
  fetchMemories,
  fetchMemoryGroups,
  saveMemory,
  updateMemoryImportance,
} from '@/service/api/memory'

const message = useMessage()
const activeTab = ref('group')

// 群列表
const availableGroups = ref<{ label: string; value: string }[]>([])
const currentGroupId = ref<string>('')

// 群总体记忆状态
const groupSharedState = reactive({
  loading: false,
  items: [] as MemoryRecord[],
  keyFilter: '',
})

// 群内用户记忆状态
const groupUserState = reactive({
  loading: false,
  items: [] as MemoryRecord[],
  userFilter: '',
  keyFilter: '',
})

// 私聊记忆状态
const privateState = reactive({
  loading: false,
  userFilter: '',
  keyFilter: '',
  items: [] as MemoryRecord[],
})

// 新增 Modal
const modalVisible = ref(false)
const modalSubmitting = ref(false)
const modalForm = reactive({
  scope: 'group' as MemoryScope,
  groupId: '',
  userId: '',
  key: '',
  content: '',
  importance: 50,
})

// 微调重要度 Modal
const impModalVisible = ref(false)
const impSubmitting = ref(false)
const impForm = reactive({
  id: '',
  key: '',
  importance: 50,
})

async function loadGroups() {
  try {
    const res = await fetchMemoryGroups()
    if (res.data) {
      availableGroups.value = res.data.map(g => ({
        label: `群聊: ${g}`,
        value: String(g),
      }))
      if (res.data.length > 0 && !currentGroupId.value) {
        currentGroupId.value = String(res.data[0])
      }
    }
  }
  catch (e: any) {
    console.warn('获取群列表失败', e)
  }
}

async function loadGroupSharedMemories() {
  if (!currentGroupId.value) {
    groupSharedState.items = []
    return
  }
  groupSharedState.loading = true
  try {
    const res = await fetchMemories({
      scope: 'group',
      groupId: currentGroupId.value,
      key: groupSharedState.keyFilter.trim() || undefined,
    })
    groupSharedState.items = res.data || []
  }
  catch (e: any) {
    message.error(e?.message || '加载群共享记忆失败')
  }
  finally {
    groupSharedState.loading = false
  }
}

async function loadGroupUserMemories() {
  if (!currentGroupId.value) {
    groupUserState.items = []
    return
  }
  groupUserState.loading = true
  try {
    const res = await fetchMemories({
      scope: 'group_user',
      groupId: currentGroupId.value,
      userId: groupUserState.userFilter.trim() || undefined,
      key: groupUserState.keyFilter.trim() || undefined,
    })
    groupUserState.items = res.data || []
  }
  catch (e: any) {
    message.error(e?.message || '加载群内用户记忆失败')
  }
  finally {
    groupUserState.loading = false
  }
}

async function loadPrivateMemories() {
  privateState.loading = true
  try {
    const res = await fetchMemories({
      scope: 'private_user',
      userId: privateState.userFilter.trim() || undefined,
      key: privateState.keyFilter.trim() || undefined,
    })
    privateState.items = res.data || []
  }
  catch (e: any) {
    message.error(e?.message || '加载私聊记忆失败')
  }
  finally {
    privateState.loading = false
  }
}

function handleTabChange(tab: string) {
  activeTab.value = tab
  if (tab === 'group') loadGroupSharedMemories()
  else if (tab === 'group-user') loadGroupUserMemories()
  else if (tab === 'private') loadPrivateMemories()
}

function handleGroupChange(gid: string) {
  currentGroupId.value = gid
  if (activeTab.value === 'group') loadGroupSharedMemories()
  else if (activeTab.value === 'group-user') loadGroupUserMemories()
}

function openAddModal(scope: MemoryScope) {
  modalForm.scope = scope
  modalForm.groupId = (scope === 'group' || scope === 'group_user') ? currentGroupId.value : ''
  modalForm.userId = ''
  modalForm.key = ''
  modalForm.content = ''
  modalForm.importance = 50
  modalVisible.value = true
}

function openImpModal(row: MemoryRecord) {
  impForm.id = row.id
  impForm.key = row.key
  impForm.importance = row.importance || 50
  impModalVisible.value = true
}

async function handleSaveImportance() {
  impSubmitting.value = true
  try {
    await updateMemoryImportance(impForm.id, impForm.importance)
    message.success('重要度修改成功')
    impModalVisible.value = false
    if (activeTab.value === 'group') loadGroupSharedMemories()
    else if (activeTab.value === 'group-user') loadGroupUserMemories()
    else loadPrivateMemories()
  }
  catch (e: any) {
    message.error(e?.message || '修改重要度失败')
  }
  finally {
    impSubmitting.value = false
  }
}

async function handleSaveMemory() {
  if (!modalForm.key.trim() || !modalForm.content.trim()) {
    message.warning('请填写记忆键名与记忆内容')
    return
  }
  if ((modalForm.scope === 'group' || modalForm.scope === 'group_user') && !modalForm.groupId.trim()) {
    message.warning('请指定所属群聊')
    return
  }
  if ((modalForm.scope === 'group_user' || modalForm.scope === 'private_user') && !modalForm.userId.trim()) {
    message.warning('必须指定用户 QQ 号')
    return
  }

  modalSubmitting.value = true
  try {
    const res = await saveMemory({
      scope: modalForm.scope,
      groupId: modalForm.groupId.trim() || null,
      userId: modalForm.userId.trim() || null,
      key: modalForm.key.trim(),
      content: modalForm.content.trim(),
      importance: modalForm.importance,
    })
    message.success(res.data?.message || '保存成功')
    modalVisible.value = false
    if (activeTab.value === 'group') loadGroupSharedMemories()
    else if (activeTab.value === 'group-user') loadGroupUserMemories()
    else loadPrivateMemories()
  }
  catch (e: any) {
    message.error(e?.message || '保存失败')
  }
  finally {
    modalSubmitting.value = false
  }
}

async function handleDelete(id: string) {
  try {
    await deleteMemory(id)
    message.success('删除成功')
    if (activeTab.value === 'group') loadGroupSharedMemories()
    else if (activeTab.value === 'group-user') loadGroupUserMemories()
    else loadPrivateMemories()
  }
  catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

function formatDate(ts: number) {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN', { hour12: false })
}

function renderImportanceTag(row: MemoryRecord) {
  const imp = row.importance || 50
  let type: 'error' | 'warning' | 'info' | 'default' = 'default'
  if (imp >= 80) type = 'error'
  else if (imp >= 60) type = 'warning'
  else if (imp >= 30) type = 'info'

  return h(
    NTag,
    {
      type,
      size: 'small',
      style: 'cursor: pointer;',
      onClick: () => openImpModal(row),
    },
    { default: () => `权重: ${imp}` },
  )
}

const groupColumns: DataTableColumns<MemoryRecord> = [
  {
    title: '键名 (Key)',
    key: 'key',
    width: 150,
    render: row => h(NTag, { type: 'info', size: 'small' }, { default: () => row.key }),
  },
  {
    title: '重要度 (点击修改)',
    key: 'importance',
    width: 140,
    render: row => renderImportanceTag(row),
  },
  {
    title: '记忆事实内容',
    key: 'content',
    ellipsis: { tooltip: true },
  },
  {
    title: '最后更新时间',
    key: 'updatedAt',
    width: 170,
    render: row => formatDate(row.updatedAt),
  },
  {
    title: '操作',
    key: 'actions',
    width: 90,
    render: row => h(
      NPopconfirm,
      { onPositiveClick: () => handleDelete(row.id) },
      {
        trigger: () => h(NButton, { size: 'tiny', type: 'error', tertiary: true }, { default: () => '删除' }),
        default: () => '确定遗忘该条记忆？',
      },
    ),
  },
]

const groupUserColumns: DataTableColumns<MemoryRecord> = [
  {
    title: '用户 QQ',
    key: 'userId',
    width: 140,
    render: row => h(NTag, { type: 'success', size: 'small' }, { default: () => `QQ: ${row.userId}` }),
  },
  {
    title: '键名 (Key)',
    key: 'key',
    width: 140,
    render: row => h(NTag, { type: 'info', size: 'small' }, { default: () => row.key }),
  },
  {
    title: '重要度 (点击修改)',
    key: 'importance',
    width: 140,
    render: row => renderImportanceTag(row),
  },
  {
    title: '记忆事实内容',
    key: 'content',
    ellipsis: { tooltip: true },
  },
  {
    title: '最后更新时间',
    key: 'updatedAt',
    width: 170,
    render: row => formatDate(row.updatedAt),
  },
  {
    title: '操作',
    key: 'actions',
    width: 90,
    render: row => h(
      NPopconfirm,
      { onPositiveClick: () => handleDelete(row.id) },
      {
        trigger: () => h(NButton, { size: 'tiny', type: 'error', tertiary: true }, { default: () => '删除' }),
        default: () => '确定遗忘该条记忆？',
      },
    ),
  },
]

const privateColumns: DataTableColumns<MemoryRecord> = [
  {
    title: '用户 QQ',
    key: 'userId',
    width: 150,
    render: row => h(NTag, { type: 'success', size: 'small' }, { default: () => `QQ: ${row.userId}` }),
  },
  {
    title: '键名 (Key)',
    key: 'key',
    width: 140,
    render: row => h(NTag, { type: 'info', size: 'small' }, { default: () => row.key }),
  },
  {
    title: '重要度 (点击修改)',
    key: 'importance',
    width: 140,
    render: row => renderImportanceTag(row),
  },
  {
    title: '记忆事实内容',
    key: 'content',
    ellipsis: { tooltip: true },
  },
  {
    title: '最后更新时间',
    key: 'updatedAt',
    width: 170,
    render: row => formatDate(row.updatedAt),
  },
  {
    title: '操作',
    key: 'actions',
    width: 90,
    render: row => h(
      NPopconfirm,
      { onPositiveClick: () => handleDelete(row.id) },
      {
        trigger: () => h(NButton, { size: 'tiny', type: 'error', tertiary: true }, { default: () => '删除' }),
        default: () => '确定遗忘该条记忆？',
      },
    ),
  },
]

onMounted(async () => {
  await loadGroups()
  loadGroupSharedMemories()
})
</script>

<template>
  <div class="chaite-page memory-container">
    <header class="chaite-page-header">
      <div>
        <h1>长期记忆库</h1>
        <p>轻量分群与个人偏好事实管理。支持严格的群聊隐私隔离、百分制重要度优先队列置换与 Agent 自主沉淀。</p>
      </div>
    </header>

    <NCard class="chaite-panel" :bordered="false">
      <!-- 顶部群聊选择区域 (仅群共享与群个人 Tab 展示) -->
      <div v-if="activeTab !== 'private'" class="mb-4 p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg flex items-center gap-3">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">当前群聊：</span>
        <NSelect
          v-model:value="currentGroupId"
          filterable
          tag
          placeholder="选择群号或直接手动输入群号"
          :options="availableGroups"
          style="width: 260px;"
          @update:value="handleGroupChange"
        />
        <NButton size="small" secondary @click="activeTab === 'group' ? loadGroupSharedMemories() : loadGroupUserMemories()">
          刷新
        </NButton>
      </div>

      <NTabs v-model:value="activeTab" type="line" animated @update:value="handleTabChange">
        <!-- 1. 群共享记忆 -->
        <NTabPane name="group" :tab="`群共享记忆 (${groupSharedState.items.length}/20)`">
          <NSpace vertical :size="16">
            <NAlert type="info" :show-icon="false" class="text-xs">
              📌 本群共享记忆上限 20 条，开启记忆的预设在当前群对话时全量注入。达到配额后，新记录的高重要度事实会自动置换掉重要度最低的旧记忆。
            </NAlert>

            <div class="flex justify-between items-center gap-4">
              <NInput
                v-model:value="groupSharedState.keyFilter"
                placeholder="按键名过滤..."
                clearable
                style="max-width: 260px;"
                @update:value="loadGroupSharedMemories"
              />
              <NButton type="primary" :disabled="!currentGroupId" @click="openAddModal('group')">
                + 添加群共享记忆
              </NButton>
            </div>

            <NDataTable
              :columns="groupColumns"
              :data="groupSharedState.items"
              :loading="groupSharedState.loading"
              :pagination="{ pageSize: 20 }"
            />
          </NSpace>
        </NTabPane>

        <!-- 2. 群内个人记忆（严格隔离） -->
        <NTabPane name="group-user" :tab="`群内个人记忆 (${groupUserState.items.length}/20)`">
          <NSpace vertical :size="16">
            <NAlert type="warning" :show-icon="false" class="text-xs">
              🔒 严格群隔离：每人在此群上限 20 条，全量注入当前发言者。此处事实绝对不会出现在其他任何群，杜绝跨群信息泄露。
            </NAlert>

            <div class="flex justify-between items-center gap-4">
              <div class="flex gap-2">
                <NInput
                  v-model:value="groupUserState.userFilter"
                  placeholder="按用户 QQ 号筛选..."
                  clearable
                  style="width: 200px;"
                  @update:value="loadGroupUserMemories"
                />
                <NInput
                  v-model:value="groupUserState.keyFilter"
                  placeholder="按键名过滤..."
                  clearable
                  style="width: 200px;"
                  @update:value="loadGroupUserMemories"
                />
              </div>
              <NButton type="primary" :disabled="!currentGroupId" @click="openAddModal('group_user')">
                + 添加个人记忆
              </NButton>
            </div>

            <NDataTable
              :columns="groupUserColumns"
              :data="groupUserState.items"
              :loading="groupUserState.loading"
              :pagination="{ pageSize: 20 }"
            />
          </NSpace>
        </NTabPane>

        <!-- 3. 私聊用户记忆 -->
        <NTabPane name="private" :tab="`私聊个人记忆 (${privateState.items.length}/30)`">
          <NSpace vertical :size="16">
            <NAlert type="info" :show-icon="false" class="text-xs">
              💬 私聊记忆上限 30 条，仅在与该用户的 1v1 私信对话中全量注入。
            </NAlert>

            <div class="flex justify-between items-center gap-4">
              <div class="flex gap-2">
                <NInput
                  v-model:value="privateState.userFilter"
                  placeholder="按用户 QQ 号筛选..."
                  clearable
                  style="width: 200px;"
                  @update:value="loadPrivateMemories"
                />
                <NInput
                  v-model:value="privateState.keyFilter"
                  placeholder="按键名过滤..."
                  clearable
                  style="width: 200px;"
                  @update:value="loadPrivateMemories"
                />
              </div>
              <NButton type="primary" @click="openAddModal('private_user')">
                + 添加私聊记忆
              </NButton>
            </div>

            <NDataTable
              :columns="privateColumns"
              :data="privateState.items"
              :loading="privateState.loading"
              :pagination="{ pageSize: 30 }"
            />
          </NSpace>
        </NTabPane>
      </NTabs>
    </NCard>

    <!-- 新增弹窗 -->
    <NModal
      v-model:show="modalVisible"
      preset="card"
      :title="modalForm.scope === 'group' ? '添加群共享记忆 (上限20条)' : modalForm.scope === 'group_user' ? '添加群内个人记忆 (上限20条)' : '添加私聊个人记忆 (上限30条)'"
      style="width: 540px;"
    >
      <NForm label-placement="left" label-width="110">
        <NFormItem v-if="modalForm.scope === 'group' || modalForm.scope === 'group_user'" label="群号">
          <NInput v-model:value="modalForm.groupId" placeholder="输入群号" />
        </NFormItem>
        <NFormItem v-if="modalForm.scope === 'group_user' || modalForm.scope === 'private_user'" label="用户 QQ 号">
          <NInput v-model:value="modalForm.userId" placeholder="输入用户的 QQ 号" />
        </NFormItem>
        <NFormItem label="记忆标识键">
          <NInput v-model:value="modalForm.key" placeholder="如 preferences, identity, rule 等" />
        </NFormItem>
        <NFormItem label="重要度 (1~100)">
          <NInputNumber v-model:value="modalForm.importance" :min="1" :max="100" style="width: 100%;" />
        </NFormItem>
        <NFormItem label="记忆事实内容">
          <NInput
            v-model:value="modalForm.content"
            type="textarea"
            :rows="4"
            placeholder="记录具体的事实、习惯偏好或群规设定"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="modalVisible = false">
            取消
          </NButton>
          <NButton type="primary" :loading="modalSubmitting" @click="handleSaveMemory">
            保存
          </NButton>
        </div>
      </template>
    </NModal>

    <!-- 调整重要度弹窗 -->
    <NModal
      v-model:show="impModalVisible"
      preset="card"
      title="微调记忆重要度"
      style="width: 400px;"
    >
      <NForm label-placement="left" label-width="100">
        <NFormItem label="记忆键名">
          <span class="font-medium text-gray-800 dark:text-gray-200">{{ impForm.key }}</span>
        </NFormItem>
        <NFormItem label="重要度 (1~100)">
          <NInputNumber v-model:value="impForm.importance" :min="1" :max="100" style="width: 100%;" />
        </NFormItem>
      </NForm>
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="impModalVisible = false">
            取消
          </NButton>
          <NButton type="primary" :loading="impSubmitting" @click="handleSaveImportance">
            确定
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.memory-container {
  padding: 16px;
}
</style>
