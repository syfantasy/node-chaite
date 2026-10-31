import type { Tool } from '../../types/tools.js';
import type { BackgroundJobManager } from '../background/BackgroundJobManager.js';
import type { PlanExecutor } from '../planning/PlanExecutor.js';
/**
 * Returns the set of built-in system tools to register with Chaite.
 * These tools give the LLM the ability to spawn background tasks,
 * check job status, and query plan progress — all backed by
 * structured storage rather than LLM-narrated status.
 */
export declare function createSystemTools(jobManager: BackgroundJobManager, planExecutor?: PlanExecutor): Tool[];
