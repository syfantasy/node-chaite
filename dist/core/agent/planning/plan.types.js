export function getPlanProgress(plan) {
    const done = plan.steps.filter(s => s.status === 'done').length;
    const current = plan.steps.find(s => s.status === 'running' || s.status === 'pending');
    return {
        planId: plan.id,
        goal: plan.goal,
        status: plan.status,
        totalSteps: plan.steps.length,
        doneSteps: done,
        currentStep: current
            ? { index: current.index, title: current.title, status: current.status }
            : undefined,
        revision: plan.revision,
    };
}
