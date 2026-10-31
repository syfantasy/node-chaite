/**
 * Agent subsystem HTTP controller.
 * Mounts under /api/agent and covers:
 *   /api/agent/skills          - SkillRegistry (full CRUD, readonly-aware)
 *   /api/agent/jobs            - BackgroundJobManager
 *   /api/agent/scheduled-tasks - DynamicScheduler
 *   /api/agent/plans           - PlanExecutor (read-only)
 *   /api/agent/mcp-servers     - McpServerManager
 */
import { Router } from 'express';
declare const router: Router;
export default router;
