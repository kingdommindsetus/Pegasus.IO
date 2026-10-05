export type ObjectiveDraft = {
 title:string; description:string; successCriteria:string[]; constraints:string[];
 metrics:{name:string; target:string; source?:string}[]; targetDate?:string;
};
export type PlannedTask = {
 title:string; instructions:string; ownerAgentId:string; priority:number;
 acceptanceCriteria:string[]; dependsOn:string[];
};
export type ObjectivePlan = { objective:ObjectiveDraft; tasks:PlannedTask[] };

const AGENTS = new Set(['simon','marie','iris','mark','cammy','evan','tube','lucy','snake','alice','echo','booker']);

export function validateObjectivePlan(plan:ObjectivePlan, customAgentIds:Iterable<string> = []) {
 const allowedAgents = new Set([...AGENTS, ...customAgentIds]);
 if (!plan.objective.title.trim()) throw new Error('Objective title required');
 if (!plan.objective.successCriteria.length) throw new Error('Objective requires measurable success criteria');
 const titles = new Set(plan.tasks.map(t=>t.title));
 if (titles.size !== plan.tasks.length) throw new Error('Task titles must be unique inside an objective');
 for (const task of plan.tasks) {
   if (!allowedAgents.has(task.ownerAgentId)) throw new Error('Unknown Pegasus agent: '+task.ownerAgentId);
   if (!task.acceptanceCriteria.length) throw new Error('Task requires acceptance criteria: '+task.title);
   for (const dep of task.dependsOn) if (!titles.has(dep)) throw new Error('Unknown dependency '+dep+' for '+task.title);
 }
 return plan;
}

export function readyTasks(plan:ObjectivePlan, completed:Set<string>, customAgentIds:Iterable<string> = []) {
 validateObjectivePlan(plan,customAgentIds);
 return plan.tasks.filter(t=>!completed.has(t.title) && t.dependsOn.every(d=>completed.has(d)));
}

export function objectiveProgress(plan:ObjectivePlan, completed:Set<string>) {
 if (!plan.tasks.length) return 0;
 return Math.round((plan.tasks.filter(t=>completed.has(t.title)).length / plan.tasks.length) * 10000) / 100;
}
