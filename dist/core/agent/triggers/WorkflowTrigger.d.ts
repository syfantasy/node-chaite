import { CronTrigger } from '../../types/trigger.js';
import type { ChaiteContext } from '../../types/common.js';
import type { WorkflowDefinition } from '../workflow/workflow.types.js';
/**
 * A CronTrigger that runs a WorkflowDefinition when fired.
 *
 * Usage:
 *   const trigger = new WorkflowTrigger({
 *     name: 'daily-report',
 *     cronExpression: '0 9 * * *',
 *     workflowDef: myWorkflow,
 *   })
 *   await chaite.getTriggerManager().registerTrigger(trigger)
 */
export declare class WorkflowTrigger extends CronTrigger {
    private readonly workflowDef;
    private readonly runAsUserId?;
    private readonly runAsGroupId?;
    constructor(params: {
        name: string;
        cronExpression: string;
        workflowDef: WorkflowDefinition;
        isOneTime?: boolean;
        userId?: string;
        groupId?: string;
    });
    protected execute(_context: ChaiteContext): Promise<void>;
}
/**
 * A CronTrigger that resolves and runs a named Skill's workflow when fired.
 * The skill must have `executionMode: workflow` and a valid `workflowRef`.
 *
 * Usage:
 *   const trigger = new SkillWorkflowTrigger({
 *     name: 'daily-weather',
 *     cronExpression: '0 17 * * *',
 *     skillName: 'weather-report',
 *   })
 */
export declare class SkillWorkflowTrigger extends CronTrigger {
    private readonly skillName;
    private readonly runAsUserId?;
    private readonly runAsGroupId?;
    constructor(params: {
        name: string;
        cronExpression: string;
        skillName: string;
        isOneTime?: boolean;
        userId?: string;
        groupId?: string;
    });
    protected execute(_context: ChaiteContext): Promise<void>;
}
