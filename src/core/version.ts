import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 版本号唯一来源：包根 package.json。
 * 之前这里是构建脚本写死的 '1.15.2'，和 package.json 的版本长期不一致，
 * 面板与 UA 头里显示的都不是真实版本。改为运行时读取 package.json：
 * 无论跑 src/core（tsx）还是 dist/core（编译产物），都在包根下一层，路径一致。
 */
function readPackageVersion(): string {
  const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(pkgRoot, 'package.json'), 'utf-8'))
    if (pkg?.version) return String(pkg.version)
  } catch {
    // 读不到就退回兜底值，保证 UA 头里始终有版本
  }
  return '2.0.0'
}

export const VERSION = readPackageVersion()
