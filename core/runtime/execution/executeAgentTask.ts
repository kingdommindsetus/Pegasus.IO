import { authorize, Permission } from '../../approvals/policy.js';
import type { ContextPacket } from '../context/buildContextPacket.js';

export type AgentDecision = {
 skillKey:string; rationale:string; input:Record<string,unknown>;
 runtime?:{reasoningProvider:string;model:string;fallback:boolean;reasoningMs:number;quotaWaitMs:number};
};
export type AgentTaskResult = {
 status:'completed'|'waiting_approval'|'denied';
 decision:AgentDecision; output?:Record<string,unknown>; evidence?:unknown[];
};

export interface AgentReasoner {
 decide(context:ContextPacket):Promise<AgentDecision>;
}
export interface SkillExecutor {
 execute(skillKey:string,input:Record<string,unknown>,context:ContextPacket):Promise<{output:Record<string,unknown>;evidence?:unknown[]}>;
}
export interface PermissionResolver {
 permission(agentId:string,skillKey:string,context:ContextPacket):Promise<Permission>;
}

export async function executeAgentTask(args:{
 context:ContextPacket; reasoner:AgentReasoner; skills:SkillExecutor; permissions:PermissionResolver;
}):Promise<AgentTaskResult>{
 const decision=await args.reasoner.decide(args.context);
 const permission=await args.permissions.permission(args.context.agent.id,decision.skillKey,args.context);
 const gate=authorize(permission);
 if(gate.approval)return {status:'waiting_approval',decision};
 if(!gate.execute)return {status:'denied',decision};
 const executed=await args.skills.execute(decision.skillKey,decision.input,args.context);
 return {status:'completed',decision,output:executed.output,evidence:executed.evidence||[]};
}