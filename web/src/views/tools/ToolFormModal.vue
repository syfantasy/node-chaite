<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NCard, NForm, NFormItemGridItem, NGrid, NInput, NModal, NSpace } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import CodeMirror from 'vue-codemirror6'
import type { LanguageSupport } from '@codemirror/language'
import { javascript } from '@codemirror/lang-javascript'

const props = defineProps({
  show: Boolean,
  editMode: Boolean,
  initialData: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:show', 'submit'])

const formRef = ref<FormInst | null>()

const showModal = computed({
  get: () => props.show,
  set: value => emit('update:show', value),
})

const toolRules = {
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入工具名称',
  },
  description: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入工具描述',
  },
  code: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入工具代码',
  },
}
const lang: LanguageSupport = javascript()
const configJson = ref('')

// Form data
const addTool = ref<Partial<Shareable.ToolModel>>({
  description: '',
  code: 'import { CustomTool } from \'chaite\'\n'
    + '\n'
    + 'export class ExampleTool extends CustomTool {\n'
    + '  name = \'example\'\n'
    + '  function = {\n'
    + '    name: \'example\',\n'
    + '    description: \'演示工具\',\n'
    + '    parameters: {\n'
    + '      type: \'object\',\n'
    + '      properties: {\n'
    + '        example: {\n'
    + '          type: \'string\',\n'
    + '          description: \'输入参数\'\n'
    + '        }\n'
    + '      },\n'
    + '      required: [\'example\']\n'
    + '    }\n'
    + '  }\n'
    + '\n'
    + '  async run (args, context) {\n'
    + '    // 可通过 this.config 或 context.toolConfig 获取在控制台配置的专属参数\n'
    + '    const apiKey = this.config?.apiKey || context?.toolConfig?.apiKey\n'
    + '    return `收到参数: ${args.example}`\n'
    + '  }\n'
    + '}\n'
    + '\n'
    + 'export default new ExampleTool()\n',
  modelType: 'executable',
})

// Initialize form when in edit mode
watch(() => props.initialData, (newVal) => {
  if (props.editMode && newVal) {
    addTool.value = { ...newVal }
    const cfg = (newVal as any).config || (newVal as any).extraData?.config
    configJson.value = cfg && Object.keys(cfg).length > 0 ? JSON.stringify(cfg, null, 2) : ''
  } else {
    configJson.value = ''
  }
}, { immediate: true })

// Methods
function handleAddChannel() {
  formRef.value?.validate().then((errors) => {
    if (Array.isArray(errors)) {
      console.error(errors)
      return
    }

    let parsedConfig: Record<string, any> = {}
    if (configJson.value.trim()) {
      try {
        parsedConfig = JSON.parse(configJson.value.trim())
      } catch (e: any) {
        alert(`工具专属配置必须为合法的 JSON 格式: ${e.message}`)
        return
      }
    }

    ;(addTool.value as any).config = parsedConfig
    if (!addTool.value.extraData) addTool.value.extraData = {}
    ;(addTool.value.extraData as any).config = parsedConfig

    emit('submit', addTool.value)
    showModal.value = false
  })
}
// Reset form when modal is closed
watch(showModal, (val) => {
  if (!val && !props.editMode) {
    addTool.value = {
      name: '',
      description: '',
      code: 'import { CustomTool } from \'chaite\'\n'
        + '\n'
        + 'export class ExampleTool extends CustomTool {\n'
        + '  name = \'example\'\n'
        + '  function = {\n'
        + '    name: \'example\',\n'
        + '    description: \'example\',\n'
        + '    parameters: {\n'
        + '      type: \'object\',\n'
        + '      properties: {\n'
        + '        example: {\n'
        + '          type: \'string\',\n'
        + '          description: \'example\'\n'
        + '        }\n'
        + '      },\n'
        + '      required: [\'example\']\n'
        + '    }\n'
        + '  }\n'
        + '\n'
        + '  async run (args) {\n'
        + '    return args.example\n'
        + '  }\n'
        + '}\n'
        + '\n'
        + 'export default new ExampleTool()\n',
    }
  }
})
</script>

<template>
  <NModal
    v-if="showModal"
    v-model:show="showModal"
    preset="card"
    :title="editMode ? '编辑工具' : '添加工具'"
    style="width: 780px; max-width: 92vw; max-height: 88vh; display: flex; flex-direction: column;"
    :content-style="{ overflowY: 'auto', flex: 1, paddingRight: '6px' }"
  >
    <NForm ref="formRef" :rules="toolRules" :model="addTool">
      <NGrid :cols="24" :x-gap="12" :y-gap="16" responsive="screen" item-responsive>
        <!-- 工具名称 -->
        <NFormItemGridItem span="24" label="名称" path="name">
          <NInput v-model:value="addTool.name" placeholder="请输入工具名称" />
        </NFormItemGridItem>
        <!-- 工具描述 -->
        <NFormItemGridItem span="24" label="描述" path="description">
          <NInput v-model:value="addTool.description" type="textarea" placeholder="请输入工具描述" />
        </NFormItemGridItem>

        <!-- 工具专属配置 (JSON) -->
        <NFormItemGridItem span="24" label="工具专属配置 (JSON，选填)" path="config">
          <NInput
            v-model:value="configJson"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 5 }"
            placeholder='选填，请输入 JSON 配置（如: {"apiKey": "sk-xxx"}），可在工具内通过 this.config 读取'
            style="font-family: monospace;"
          />
        </NFormItemGridItem>

        <!-- 代码编辑器 -->
        <NFormItemGridItem span="24" label="代码" path="code">
          <div style="width: 100%; max-height: 360px; overflow-y: auto; border: 1px solid var(--n-border-color); border-radius: 4px;">
            <CodeMirror
              v-model="addTool.code"
              style="width: 100%"
              :lang="lang"
              basic
            />
          </div>
        </NFormItemGridItem>
      </NGrid>
    </NForm>

    <template #action>
      <div style="display: flex; justify-content: flex-end; width: 100%;">
        <NSpace>
          <NButton @click="showModal = false">
            取消
          </NButton>
          <NButton type="primary" @click="handleAddChannel">
            确定保存
          </NButton>
        </NSpace>
      </div>
    </template>
  </NModal>
</template>

<style scoped>

</style>
