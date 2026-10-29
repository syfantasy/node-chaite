<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  NButton,
  NDynamicTags,
  NForm,
  NFormItemGridItem,
  NGrid,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NTooltip,
} from 'naive-ui'
import type { FormInst, SelectOption } from 'naive-ui'
import type { CreateSkillDTO, SkillDetail, SkillExecutionMode, UpdateSkillDTO } from '@/service/api/agent'
import { fetchAllToolList } from '@/service/api/tools'

const props = defineProps<{
  show: boolean
  editMode: boolean
  initialData: Partial<SkillDetail>
  presetOptions?: Array<{ label: string; value: string }>
  mcpServerOptions?: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  (e: 'update:show', val: boolean): void
  (e: 'submit', data: CreateSkillDTO | (UpdateSkillDTO & { name?: string })): void
}>()

const formRef = ref<FormInst | null>(null)
const availableToolOptions = ref<SelectOption[]>([])

const showModal = computed({
  get: () => props.show,
  set: val => emit('update:show', val),
})

interface FormState {
  name: string
  description: string
  systemPrompt: string
  executionMode: SkillExecutionMode
  allowedTools: string[]
  preset: string
  planningModel: string
  keywords: string[]
  mcpServer: string
  mcpTools: string[]
}

const defaultForm = (): FormState => ({
  name: '',
  description: '',
  systemPrompt: '',
  executionMode: 'direct',
  allowedTools: [],
  preset: '',
  planningModel: '',
  keywords: [],
  mcpServer: '',
  mcpTools: [],
})

const form = ref<FormState>(defaultForm())

function loadToolOptions() {
  fetchAllToolList().then((tools) => {
    availableToolOptions.value = (tools || []).map(t => ({
      label: `${t.name} (${t.description || '无描述'})`,
      value: t.name,
    }))
  }).catch(() => {})
}

onMounted(() => {
  loadToolOptions()
})

watch(() => [props.initialData, props.show], ([data]) => {
  if (props.editMode && data) {
    const d = data as Partial<SkillDetail>
    form.value = {
      name: d.name ?? '',
      description: d.description ?? '',
      systemPrompt: d.instructions ?? '',
      executionMode: d.executionMode ?? 'direct',
      allowedTools: d.allowedTools ?? [],
      preset: d.preset ?? '',
      planningModel: d.planningModel ?? '',
      keywords: d.keywords ?? [],
      mcpServer: d.mcpServer ?? '',
      mcpTools: d.mcpTools ?? [],
    }
  }
}, { immediate: true })

watch(showModal, (val) => {
  if (!val && !props.editMode) {
    form.value = defaultForm()
    formRef.value?.restoreValidation()
  }
  else if (val) {
    loadToolOptions()
  }
})

const executionModeOptions = [
  { label: 'Direct（直接对话式触发）', value: 'direct' },
  { label: 'Plan（自动规划与执行）', value: 'plan' },
  { label: 'Workflow（顺序工作流）', value: 'workflow' },
]

const createRules = {
  name: { required: true, trigger: ['blur', 'input'], message: '请输入技能名称（英文唯一标识）' },
  description: { required: true, trigger: ['blur', 'input'], message: '请输入技能业务描述' },
  systemPrompt: { required: true, trigger: ['blur', 'input'], message: '请输入技能专属 SOP 或系统提示词' },
}

const editRules = {
  description: { required: true, trigger: ['blur', 'input'], message: '请输入技能业务描述' },
}

function handleSubmit() {
  formRef.value?.validate((errors) => {
    if (errors)
      return
    const payload = {
      ...(props.editMode ? {} : { name: form.value.name }),
      description: form.value.description,
      systemPrompt: form.value.systemPrompt,
      executionMode: form.value.executionMode,
      allowedTools: form.value.allowedTools.length > 0 ? form.value.allowedTools : undefined,
      preset: form.value.preset || undefined,
      planningModel: form.value.planningModel || undefined,
      keywords: form.value.keywords.length ? form.value.keywords : undefined,
      mcpServer: form.value.mcpServer || undefined,
      mcpTools: form.value.mcpTools.length ? form.value.mcpTools : undefined,
    }
    emit('submit', payload)
    showModal.value = false
  })
}
</script>

<template>
  <NModal v-model:show="showModal" preset="card" :style="{ width: '720px', maxWidth: '95vw' }">
    <template #header>
      {{ editMode ? `编辑技能 - ${initialData.name}` : '装配新技能 (Skill)' }}
    </template>

    <NForm
      ref="formRef"
      :model="form"
      :rules="editMode ? editRules : createRules"
      label-placement="top"
    >
      <NGrid :cols="24" :x-gap="12" :y-gap="6">
        <NFormItemGridItem v-if="!editMode" :span="24" label="技能标识 (英文唯一 ID)" path="name">
          <NInput v-model:value="form.name" placeholder="例：code_reviewer / db_assistant" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="24" label="技能描述 (告诉大模型此技能何时适用)" path="description">
          <NInput v-model:value="form.description" placeholder="例：当用户请求代码评审、SQL 数据统计或导出报表时使用的专职技能" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="24" label="触发意图暗号与关键词（回车添加，命中时动态激活）">
          <NDynamicTags v-model:value="form.keywords" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="24" label="动态装配的本地工具 (选择此技能激活时可用的工具，留空不限制)">
          <NSelect
            v-model:value="form.allowedTools"
            multiple
            filterable
            tag
            :options="availableToolOptions"
            placeholder="从本地工具库中多选，或直接输入工具名按回车"
          />
        </NFormItemGridItem>

        <NFormItemGridItem :span="12" label="关联外部 MCP 服务（可选）">
          <NSelect
            v-model:value="form.mcpServer"
            :options="mcpServerOptions ?? []"
            clearable
            placeholder="此技能激活时调用的 MCP"
          />
        </NFormItemGridItem>

        <NFormItemGridItem :span="12" label="激活的 MCP 工具名列表（可选）">
          <NDynamicTags v-model:value="form.mcpTools" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="12" label="执行模式" path="executionMode">
          <NSelect v-model:value="form.executionMode" :options="executionModeOptions" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="12" label="绑定预设 (可选)" path="preset">
          <NSelect
            v-model:value="form.preset"
            :options="presetOptions ?? []"
            placeholder="仅在指定预设生效（留空全局通用）"
            clearable
          />
        </NFormItemGridItem>

        <NFormItemGridItem v-if="form.executionMode === 'plan'" :span="24" label="规划模型 (可选)" path="planningModel">
          <NInput v-model:value="form.planningModel" placeholder="留空使用当前对话模型" />
        </NFormItemGridItem>

        <NFormItemGridItem :span="24" label="技能 SOP 与专属指令 (System Prompt)" path="systemPrompt">
          <NInput
            v-model:value="form.systemPrompt"
            type="textarea"
            :rows="7"
            placeholder="编写专职技能的执行规范，例如：
1. 先调用对应工具获取上下文信息；
2. 严禁凭空猜测，根据工具返回的真实数据进行排查分析；
3. 输出格式统一采用 Markdown 表格并给出优化建议。"
          />
        </NFormItemGridItem>
      </NGrid>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="showModal = false">
          取消
        </NButton>
        <NButton type="primary" @click="handleSubmit">
          {{ editMode ? '保存修改' : '确认装配' }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
