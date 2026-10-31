import * as crypto from 'node:crypto';
/**
 * LLM-based plan reviewer.
 * Asks the LLM whether the remaining steps should be revised given what was learned.
 * Only triggers if the step result is significantly unexpected.
 */
export class LlmPlanReviewer {
    constructor(model) {
        this.model = model;
    }
    async review(plan, completedStepId, ctx) {
        const completedStep = plan.steps.find(s => s.id === completedStepId);
        if (!completedStep)
            return { shouldRevise: false };
        const pendingSteps = plan.steps.filter(s => s.status === 'pending' || s.status === 'running');
        if (pendingSteps.length === 0)
            return { shouldRevise: false };
        const doneSteps = plan.steps.filter(s => s.status === 'done');
        const doneContext = doneSteps
            .map(s => `[${s.index}] ${s.title}: ${(s.result ?? '').slice(0, 300)}`)
            .join('\n');
        const pendingContext = pendingSteps
            .map(s => `[${s.index}] ${s.title}: ${s.description}`)
            .join('\n');
        const systemPrompt = `You are a plan reviewer. Evaluate whether a remaining execution plan needs revision based on what was just learned.

Respond with ONLY a JSON object:
{
  "shouldRevise": true/false,
  "reason": "Brief reason (optional)",
  "revisedSteps": [  // Only include if shouldRevise=true
    { "title": "...", "description": "...", "toolHint": "..." }
  ]
}`;
        const prompt = `GOAL: ${plan.goal}

COMPLETED STEPS:
${doneContext}

JUST COMPLETED: [${completedStep.index}] ${completedStep.title}
Result: ${(completedStep.result ?? '').slice(0, 500)}

REMAINING STEPS:
${pendingContext}

Should the remaining steps be revised?`;
        try {
            const resp = await ctx.sendMessage(prompt, {
                model: this.model,
                systemOverride: systemPrompt,
                disableHistorySave: true,
            });
            const rawJson = resp.contents?.map(c => ('text' in c ? c.text : '')).join('') ?? '';
            const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
            if (!jsonMatch)
                return { shouldRevise: false };
            const parsed = JSON.parse(jsonMatch[0]);
            if (!parsed.shouldRevise)
                return { shouldRevise: false, reason: parsed.reason };
            // Build new PlanStep list for pending steps
            const startIndex = (doneSteps.length) + 1;
            const revisedSteps = (parsed.revisedSteps ?? []).map((raw, i) => ({
                id: crypto.randomUUID(),
                index: startIndex + i,
                title: raw.title,
                description: raw.description,
                toolHint: raw.toolHint,
                dependsOn: [],
                status: 'pending',
                retryCount: 0,
            }));
            return { shouldRevise: true, revisedSteps, reason: parsed.reason };
        }
        catch (err) {
            ctx.logger.warn(`[PlanReviewer] Review failed, keeping original plan: ${String(err)}`);
            return { shouldRevise: false };
        }
    }
}
/**
 * No-op reviewer that never revises.
 * Use when you want deterministic execution without LLM-based self-correction.
 */
export class NoopPlanReviewer {
    review(_plan, _completedStepId, _ctx) {
        return Promise.resolve({ shouldRevise: false });
    }
}
