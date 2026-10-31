import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exec as execCb, spawn } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execCb)

/** 依赖里可能出现的名字：宿主自己安装时可以叫 chaite，也可以直接引 scoped 名 */
const DEP_NAMES = ['chaite', '@syfantasy/chaite']

/** 默认 GitHub 仓库（当宿主写的是 npm 版本号、拿不到 owner/repo 时兜底） */
const DEFAULT_REPO = { owner: 'syfantasy', repo: 'node-chaite' }

export interface DependencyUpdatePlan {
  /** 宿主 package.json 里实际声明的依赖名 */
  depName: string
  /** 声明的 spec，例如 github:syfantasy/node-chaite */
  spec: string
  owner: string
  repo: string
  /** 远端最新 commit（拿不到则为空） */
  latestCommit: string
  /** 锁文件里当前的 commit（拿不到则为空） */
  currentCommit: string
  /** 是否真的有新提交 */
  needsUpdate: boolean
  /** 实际要执行的更新命令 */
  command: string
  /** 命中 allowBuilds 白名单时，本次自动补写的那一行 */
  allowBuildEntry?: string
}

function readJsonSafe<T = any>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T
  } catch {
    return null
  }
}

/** 从 "github:owner/repo"、"https://github.com/owner/repo(.git)"、"owner/repo#ref" 里取仓库名 */
export function parseGithubSpec(spec: string): { owner: string; repo: string } | null {
  if (!spec) return null
  const patterns = [
    /github:([^/\s]+)\/([^#\s]+)/i,
    /github\.com[/:]([^/\s]+)\/([^#\s]+)/i,
    /^([\w.-]+)\/([\w.-]+)$/,
  ]
  for (const re of patterns) {
    const m = spec.match(re)
    if (m) {
      return { owner: m[1], repo: m[2].replace(/\.git$/, '') }
    }
  }
  return null
}

/** 远端 HEAD 的 commit（GitHub 直接 ls-remote，不需要 token） */
export async function fetchLatestCommit(owner: string, repo: string): Promise<string> {
  try {
    const { stdout } = await exec(
      `git ls-remote https://github.com/${owner}/${repo}.git HEAD`,
      { timeout: 20000 }
    )
    return (stdout || '').trim().split(/\s+/)[0] || ''
  } catch {
    return ''
  }
}

/** 从宿主锁文件里读当前安装的 commit（pnpm / npm / yarn 都会留下 tar.gz/<sha> 或 #<sha>） */
export function readInstalledCommit(hostDir: string, owner: string, repo: string): string {
  const lockFiles = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'npm-shrinkwrap.json']
  for (const name of lockFiles) {
    const file = path.resolve(hostDir, name)
    if (!fs.existsSync(file)) continue
    let text = ''
    try {
      text = fs.readFileSync(file, 'utf-8')
    } catch {
      continue
    }
    if (!text.includes(repo)) continue
    const codeload = text.match(/tar\.gz\/([0-9a-f]{40})/i)
    if (codeload) return codeload[1].toLowerCase()
    const hashRef = text.match(new RegExp(`${repo}[^\\n]{0,200}?#([0-9a-f]{40})`, 'i'))
    if (hashRef) return hashRef[1].toLowerCase()
  }
  return ''
}

function detectPackageManager(hostDir: string): 'pnpm' | 'yarn' | 'npm' {
  if (fs.existsSync(path.resolve(hostDir, 'pnpm-lock.yaml'))) return 'pnpm'
  if (fs.existsSync(path.resolve(hostDir, 'yarn.lock'))) return 'yarn'
  return 'npm'
}

/**
 * pnpm 10+ 默认拦截 git 依赖的构建脚本，必须在宿主 pnpm-workspace.yaml 的
 * allowBuilds 里按 [包名@tarball地址] 放行。新 commit 就换一条 key，所以
 * 自动更新时要把新 key 补进去，否则 pnpm add 会直接失败。
 */
export function ensureAllowBuilds(
  hostDir: string,
  depName: string,
  owner: string,
  repo: string,
  commit: string
): string | undefined {
  if (!commit) return undefined
  const wsFile = path.resolve(hostDir, 'pnpm-workspace.yaml')
  if (!fs.existsSync(wsFile)) return undefined

  const pkgName = depName.startsWith('@') ? depName : '@syfantasy/chaite'
  const entry = `  "${pkgName}@https://codeload.github.com/${owner}/${repo}/tar.gz/${commit}": true`

  let text = ''
  try {
    text = fs.readFileSync(wsFile, 'utf-8')
  } catch {
    return undefined
  }
  if (text.includes(commit)) return undefined

  if (/^allowBuilds:/m.test(text)) {
    text = text.replace(/^allowBuilds:[^\n]*\n/m, (m) => `${m}${entry}\n`)
  } else {
    text = `${text.replace(/\s*$/, '')}\nallowBuilds:\n${entry}\n`
  }
  try {
    fs.writeFileSync(wsFile, text, 'utf-8')
    return entry.trim()
  } catch {
    return undefined
  }
}

/** 生成依赖版的更新计划（只读，不执行安装） */
export async function planDependencyUpdate(hostDir: string): Promise<DependencyUpdatePlan> {
  const hostPkg = readJsonSafe<{ dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>(
    path.resolve(hostDir, 'package.json')
  )
  const deps = { ...(hostPkg?.devDependencies || {}), ...(hostPkg?.dependencies || {}) }
  const depName = DEP_NAMES.find((n) => typeof deps[n] === 'string') || 'chaite'
  const spec = String(deps[depName] || `github:${DEFAULT_REPO.owner}/${DEFAULT_REPO.repo}`)

  const parsed = parseGithubSpec(spec) || DEFAULT_REPO
  const { owner, repo } = parsed

  const latestCommit = await fetchLatestCommit(owner, repo)
  const currentCommit = readInstalledCommit(hostDir, owner, repo)
  const needsUpdate = Boolean(latestCommit) && latestCommit !== currentCommit

  const pm = detectPackageManager(hostDir)
  const isWorkspaceRoot = fs.existsSync(path.resolve(hostDir, 'pnpm-workspace.yaml'))
  const ghSpec = `github:${owner}/${repo}`

  let command: string
  if (pm === 'pnpm') {
    command = `pnpm add ${isWorkspaceRoot ? '-w ' : ''}${depName}@${ghSpec}`
  } else if (pm === 'yarn') {
    command = `yarn add ${depName}@${ghSpec}`
  } else {
    command = `npm install ${depName}@${ghSpec}`
  }

  return { depName, spec, owner, repo, latestCommit, currentCommit, needsUpdate, command }
}

export interface SystemUpdateResult {
  mode: 'standalone' | 'dependency'
  hasUpdate: boolean
  log: string
  message: string
  command?: string
}

async function run(cmd: string, cwd: string): Promise<string> {
  const { stdout, stderr } = await exec(cmd, { cwd, maxBuffer: 20 * 1024 * 1024, timeout: 10 * 60 * 1000 })
  return `${stdout || ''}${stderr || ''}`.trim()
}

/** 独立部署版：本仓库就是 Chaite，git pull 即可（dist 与 frontend 已随仓库分发） */
async function updateStandalone(hostDir: string): Promise<SystemUpdateResult> {
  if (!fs.existsSync(path.resolve(hostDir, '.git'))) {
    return {
      mode: 'standalone',
      hasUpdate: false,
      command: '',
      log: '',
      message: '当前目录没有 .git，无法 git pull；请改用依赖方式更新，或重新 clone 仓库。',
    }
  }
  // 本地分支没设置 upstream 时 `git pull` 会直接报错，退回「显式拉当前分支」
  let command = 'git pull'
  let log = ''
  try {
    log = await run(command, hostDir)
  } catch (err: any) {
    const first = `${err?.stderr || ''}${err?.stdout || ''}`.trim() || err?.message || ''
    const branch = (await run('git rev-parse --abbrev-ref HEAD', hostDir).catch(() => '')).trim()
    if (branch) {
      command = `git pull origin ${branch}`
      try {
        log = await run(command, hostDir)
      } catch (err2: any) {
        const detail = `${err2?.stderr || ''}${err2?.stdout || ''}`.trim() || err2?.message || String(err2)
        return {
          mode: 'standalone',
          hasUpdate: false,
          command,
          log: detail,
          message: `git pull 失败：${detail.split('\n')[0] || '请检查仓库状态'}`,
        }
      }
    } else {
      return {
        mode: 'standalone',
        hasUpdate: false,
        command,
        log: first,
        message: `git pull 失败：${first.split('\n')[0] || '请检查仓库状态'}`,
      }
    }
  }

  const hasUpdate = !/Already up to date|已经是最新|Already up-to-date/i.test(log)
  return {
    mode: 'standalone',
    hasUpdate,
    log,
    command,
    message: hasUpdate
      ? '已拉取最新代码，服务正在自动重启，请稍候...'
      : '当前已是最新版本，无需更新！',
  }
}

/** 依赖版：宿主项目里以 GitHub 形式重新解析 chaite（不再走 npm registry） */
async function updateDependency(hostDir: string): Promise<SystemUpdateResult> {
  const plan = await planDependencyUpdate(hostDir)

  if (!plan.needsUpdate) {
    return {
      mode: 'dependency',
      hasUpdate: false,
      command: plan.command,
      log: [
        `依赖: ${plan.depName} (${plan.spec})`,
        `当前: ${plan.currentCommit || '未知'}`,
        `远端: ${plan.latestCommit || '获取失败'}`,
      ].join('\n'),
      message: '当前已是最新版本，无需更新！',
    }
  }

  const allowBuildEntry = ensureAllowBuilds(
    hostDir,
    plan.depName,
    plan.owner,
    plan.repo,
    plan.latestCommit
  )

  const log = await run(plan.command, hostDir)

  return {
    mode: 'dependency',
    hasUpdate: true,
    command: plan.command,
    log: [allowBuildEntry ? `[allowBuilds] 已放行 ${allowBuildEntry}` : '', log]
      .filter(Boolean)
      .join('\n'),
    message: '已从 GitHub 拉取最新版本，服务正在自动重启，请稍候...',
  }
}

/**
 * 独立部署版判定：当前工作目录就是 Chaite 包根本身。
 * 不能用「cwd 下有 .git」判断 —— 宿主项目（如 Yunzai）自己也是 git 仓库，
 * 那样会把宿主仓库当成 Chaite 去 git pull。
 */
export function isStandaloneDeployment(hostDir = process.cwd()): boolean {
  const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  return path.resolve(hostDir) === pkgRoot
}

export async function runSystemUpdate(hostDir = process.cwd()): Promise<SystemUpdateResult> {
  return isStandaloneDeployment(hostDir) ? updateStandalone(hostDir) : updateDependency(hostDir)
}

/**
 * 触发进程平滑重启：
 * 1. 若宿主存在外部守护（PM2 / Systemd 等），直接 process.exit(0) 交由守护拉起；
 * 2. 若无外部守护（如 nohup、终端后台运行），则在退出前主动 spawn 一个 detached 新进程，
 *    确保无需任何外部守护也能自愈并拉起最新版本。
 */
export function restartProcess(hostDir = process.cwd(), delayMs = 1500): void {
  setTimeout(() => {
    console.log('[System Update] 正在执行自动重启流程...')
    const hasSupervisor = Boolean(
      process.env.pm_id !== undefined ||
      process.env.PM2_HOME ||
      process.env.INVOCATION_ID ||
      process.env.SUPERVISOR_ENABLED
    )

    if (hasSupervisor) {
      console.log('[System Update] 检测到外部守护进程 (PM2 / Systemd)，退出由守护拉起...')
      process.exit(0)
      return
    }

    try {
      console.log('[System Update] 未检测到外部守护进程，正在主动派生新进程自拉起...')
      const isStandalone = isStandaloneDeployment(hostDir)
      const logFile = path.resolve(hostDir, 'bot.log')
      const out = fs.openSync(logFile, 'a')
      const err = fs.openSync(logFile, 'a')

      let child: any
      if (isStandalone) {
        const pm = fs.existsSync(path.resolve(hostDir, 'pnpm-lock.yaml')) ? 'pnpm' : 'npm'
        child = spawn(pm, ['start'], {
          cwd: hostDir,
          detached: true,
          stdio: ['ignore', out, err],
          env: process.env,
        })
      } else {
        const [bin, ...rest] = process.argv
        child = spawn(bin, [...process.execArgv, ...rest], {
          cwd: hostDir,
          detached: true,
          stdio: ['ignore', out, err],
          env: process.env,
        })
      }

      if (child) {
        child.unref()
        console.log(`[System Update] 新实例已后台拉起 (PID: ${child.pid})，当前进程即将退出释放端口...`)
      }
    } catch (e: any) {
      console.error('[System Update] 自动派生新进程失败:', e)
    }

    setTimeout(() => {
      process.exit(0)
    }, 400)
  }, delayMs)
}
