import { generateProxyPattern } from '@/../vite-config/proxy'
import { serviceConfig } from '@/../service.config'
import { createAlovaInstance } from './alova'

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y'

// Vite 的默认 build 模式是 production，而 service.config 里只有 prod；
// 两者对不上会拿到 undefined，面板直接白屏。这里兜底成同源（baseURL 为空）。
const { url } = generateProxyPattern(
  serviceConfig[import.meta.env.MODE] ?? serviceConfig.prod ?? { url: '' }
)

export const request = createAlovaInstance({
  baseURL: isHttpProxy ? url.proxy : url.value,
})

export const blankInstance = createAlovaInstance({
  baseURL: '',
})
