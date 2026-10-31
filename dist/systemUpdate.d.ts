export interface DependencyUpdatePlan {
    /** 宿主 package.json 里实际声明的依赖名 */
    depName: string;
    /** 声明的 spec，例如 github:syfantasy/node-chaite */
    spec: string;
    owner: string;
    repo: string;
    /** 远端最新 commit（拿不到则为空） */
    latestCommit: string;
    /** 锁文件里当前的 commit（拿不到则为空） */
    currentCommit: string;
    /** 是否真的有新提交 */
    needsUpdate: boolean;
    /** 实际要执行的更新命令 */
    command: string;
    /** 命中 allowBuilds 白名单时，本次自动补写的那一行 */
    allowBuildEntry?: string;
}
/** 从 "github:owner/repo"、"https://github.com/owner/repo(.git)"、"owner/repo#ref" 里取仓库名 */
export declare function parseGithubSpec(spec: string): {
    owner: string;
    repo: string;
} | null;
/** 远端 HEAD 的 commit（GitHub 直接 ls-remote，不需要 token） */
export declare function fetchLatestCommit(owner: string, repo: string): Promise<string>;
/** 从宿主锁文件里读当前安装的 commit（pnpm / npm / yarn 都会留下 tar.gz/<sha> 或 #<sha>） */
export declare function readInstalledCommit(hostDir: string, owner: string, repo: string): string;
/**
 * pnpm 10+ 默认拦截 git 依赖的构建脚本，必须在宿主 pnpm-workspace.yaml 的
 * allowBuilds 里按 [包名@tarball地址] 放行。新 commit 就换一条 key，所以
 * 自动更新时要把新 key 补进去，否则 pnpm add 会直接失败。
 */
export declare function ensureAllowBuilds(hostDir: string, depName: string, owner: string, repo: string, commit: string): string | undefined;
/** 生成依赖版的更新计划（只读，不执行安装） */
export declare function planDependencyUpdate(hostDir: string): Promise<DependencyUpdatePlan>;
export interface SystemUpdateResult {
    mode: 'standalone' | 'dependency';
    hasUpdate: boolean;
    log: string;
    message: string;
    command?: string;
}
export declare function runSystemUpdate(hostDir?: string): Promise<SystemUpdateResult>;
