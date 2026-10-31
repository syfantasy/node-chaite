import type { Tool } from '../../types/tools.js';
import type { DynamicScheduler } from '../scheduler/DynamicScheduler.js';
/**
 * System tools that let the LLM schedule, cancel, and list tasks.
 *
 * The LLM should:
 * - Convert natural language times to ISO datetime or cron expressions
 * - Call schedule_task with the structured time + goal description
 *
 * Example LLM call:
 *   schedule_task({
 *     schedule: "2024-01-15T17:00:00",
 *     goal: "查询今日天气预报",
 *     description: "下午五点天气提醒",
 *     one_shot: true
 *   })
 */
export declare function createScheduleTools(scheduler: DynamicScheduler): Tool[];
