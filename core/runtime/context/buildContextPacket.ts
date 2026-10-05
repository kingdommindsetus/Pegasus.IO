export interface ContextPacket {
  agent: { id: string; mission: string; role?: string; job?: string; client?: string; objective?: string };
  companyCore: unknown[];
  project: unknown | null;
  clientContext: unknown[];
  objectiveContext: unknown | null;
  entityContext: unknown[];
  relevantMemories: unknown[];
  policies: unknown[];
  availableSkills: unknown[];
  currentTask: unknown;
  evidence: unknown[];
}

export interface ContextSource {
  companyCore(agentId: string): Promise<unknown[]>;
  project(projectId: string): Promise<unknown | null>;
  client(clientId: string | undefined): Promise<unknown[]>;
  objective(objectiveId: string | undefined): Promise<unknown | null>;
  entities(task: unknown): Promise<unknown[]>;
  memories(agentId: string, projectId: string, task: unknown): Promise<unknown[]>;
  policies(agentId: string): Promise<unknown[]>;
  skills(agentId: string): Promise<unknown[]>;
  evidence(task: unknown): Promise<unknown[]>;
}

export async function buildContextPacket(source: ContextSource, args: {
  agent: { id: string; mission: string; role?: string; job?: string; client?: string; objective?: string }; projectId: string; task: unknown;
}): Promise<ContextPacket> {
  const [companyCore, project, clientContext, objectiveContext, entityContext, relevantMemories, policies, availableSkills, evidence] =
    await Promise.all([
      source.companyCore(args.agent.id), source.project(args.projectId), source.client(args.agent.client),
      source.objective(args.agent.objective), source.entities(args.task),
      source.memories(args.agent.id,args.projectId,args.task), source.policies(args.agent.id),
      source.skills(args.agent.id), source.evidence(args.task)
    ]);
  return { agent: args.agent, companyCore, project, clientContext, objectiveContext, entityContext, relevantMemories, policies, availableSkills, currentTask: args.task, evidence };
}
