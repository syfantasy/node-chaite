import type { AgentToolCall, ExecutionContext, SandboxExecutor, SandboxOptions, SandboxResult, ToolExecutor, ToolResult } from '../contracts.js';
/**
 * Runs a trusted tool module in a separate child process with a restricted
 * environment and hard timeout.
 *
 * The tool entry file must accept a JSON string as its first CLI argument
 * and print its result to stdout.
 *
 * NOTE: This is NOT a security sandbox for untrusted code — it provides
 * resource isolation and timeout enforcement for trusted tool modules.
 * For untrusted code, delegate to a container-based remote sandbox.
 */
export declare class ChildProcessSandbox implements SandboxExecutor {
    run(entry: string, argsJson: string, opts?: SandboxOptions): Promise<SandboxResult>;
}
/**
 * Delegates sandbox execution to a remote REST API.
 * POST { entry, argsJson, opts } → { output, exitCode, timedOut }
 *
 * Use this when the process host is too resource-constrained to run
 * certain tools locally, but a remote sandbox service is available.
 */
export declare class RemoteSandboxExecutor implements SandboxExecutor {
    private readonly baseUrl;
    private readonly authHeader?;
    constructor(baseUrl: string, authHeader?: string);
    run(entry: string, argsJson: string, opts?: SandboxOptions): Promise<SandboxResult>;
}
/**
 * ToolExecutor that runs tools via a SandboxExecutor.
 * The tool must be a Node.js script that reads args from process.argv[2]
 * and writes the result to stdout.
 *
 * Requires a resolver function that maps tool name → entry file path.
 */
export declare class SandboxedToolExecutor implements ToolExecutor {
    private readonly sandbox;
    private readonly resolveEntry;
    private readonly fallback?;
    constructor(sandbox: SandboxExecutor, resolveEntry: (toolName: string) => string | null, fallback?: ToolExecutor);
    execute(call: AgentToolCall, ctx: ExecutionContext): Promise<ToolResult>;
}
