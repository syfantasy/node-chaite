<script setup lang="ts">
import type { FormInst } from 'naive-ui'
import { useAuthStore } from '@/store'
import { local } from '@/utils'

const authStore = useAuthStore()

const isInitialized = ref(true)
const isChecking = ref(true)

const rules = computed(() => {
  return {
    pwd: {
      required: true,
      trigger: 'blur',
      message: isInitialized.value ? '请输入管理密码' : '首次使用请设置管理密码',
    },
  }
})

const formValue = ref({
  pwd: '',
})
const isRemember = ref(true)
const isLoading = ref(false)
const formRef = ref<FormInst | null>(null)

async function checkStatus() {
  try {
    const res = await fetch('/api/auth/status')
    if (res.ok) {
      const data = await res.json()
      if (data && data.data) {
        isInitialized.value = Boolean(data.data.isInitialized)
      }
    }
  } catch (err) {
    console.warn('[Auth] Status check failed:', err)
  } finally {
    isChecking.value = false
  }
}

function handleLogin() {
  formRef.value?.validate(async (errors) => {
    if (errors)
      return

    isLoading.value = true
    const { pwd } = formValue.value

    if (isRemember.value)
      local.set('loginPwd', pwd)
    else
      local.remove('loginPwd')

    await authStore.login(pwd)
    isLoading.value = false
  })
}

onMounted(async () => {
  await checkStatus()
  const savedPwd = local.get('loginPwd')
  if (savedPwd && isInitialized.value) {
    formValue.value.pwd = savedPwd
  }
})
</script>

<template>
  <div v-if="!isChecking">
    <n-h2 depth="2" class="text-center font-bold mb-4">
      {{ isInitialized ? '控制台登录' : '初始化管理密码' }}
    </n-h2>
    <p v-if="!isInitialized" class="text-center text-sm text-gray-500 mb-6">
      首次部署运行，请直接输入您要设置的管理密码
    </p>

    <n-form ref="formRef" :rules="rules" :model="formValue" :show-label="false" size="large" @keyup.enter="handleLogin">
      <n-form-item path="pwd">
        <n-input
          v-model:value="formValue.pwd"
          type="password"
          :placeholder="isInitialized ? '请输入管理密码' : '请设置管理密码（首次使用）'"
          clearable
          show-password-on="click"
          autofocus
        >
          <template #password-invisible-icon>
            <icon-park-outline-preview-close-one />
          </template>
          <template #password-visible-icon>
            <icon-park-outline-preview-open />
          </template>
        </n-input>
      </n-form-item>

      <n-space vertical :size="16">
        <div v-if="isInitialized" class="flex-y-center justify-between">
          <n-checkbox v-model:checked="isRemember">
            记住密码
          </n-checkbox>
        </div>
        <n-button
          block
          type="primary"
          size="large"
          :loading="isLoading"
          :disabled="isLoading"
          @click="handleLogin"
        >
          {{ isInitialized ? '登录' : '设置密码并登录' }}
        </n-button>
      </n-space>
    </n-form>
  </div>
</template>

<style scoped></style>
