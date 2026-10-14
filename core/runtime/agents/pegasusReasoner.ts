import {generateNvidiaStageText} from './nvidiaStageRoute.js';
import type {AgentReasoner,AgentDecision} from '../execution/executeAgentTask.js';
import type {ContextPacket} from '../context/buildContextPacket.js';

function normalizeInput(input:any){
 return {
  query: typeof input?.query==='string' ? input.query : null,
  task: typeof input?.task==='string' ? input.task : null,
  target: typeof input?.target==='string' ? input.target : null,
  notes: typeof input?.notes==='string' ? input.notes : null
 };
}

function extractCandidate(raw:string){
 const text=String(raw||'').trim();
 const fenced=text.match(/```(?:json)?\s*([\s\S]*?)```/i);
 let candidate=(fenced?.[1]||text).trim();
 const start=candidate.indexOf('{');
 const end=candidate.lastIndexOf('}');
 if(start>=0&&end>start)candidate=candidate.slice(start,end+1);
 return candidate;
}

function parseDecision(raw:string){
 const candidate=extractCandidate(raw);
 const attempts=[
  candidate,
  candidate
   .replace(/[“”]/g,'"')
   .replace(/[‘’]/g,"'")
   .replace(/,\s*([}\]])/g,'$1')
   .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g,'$1"$2":')
   .replace(/:\s*'([^']*)'/g,': "$1"')
 ];
 for(const value of attempts){
  try{return JSON.parse(value);}catch{}
 }
 return null;
}

function isRateLimit(error:any){
 const m=String(error?.message||error||'').toLowerCase();
 return error?.status===429 || m.includes('rate limit') || m.includes('429') || m.includes('too many requests') || m.includes('resource exhausted');
}

export class PegasusReasoner implements AgentReasoner {
 async decide(context:ContextPacket):Promise<AgentDecision>{
  const allowed=(Array.isArray(context.availableSkills)?context.availableSkills:[])
   .filter((x:any)=>x?.permission==='allow')
   .map((x:any)=>({key:x.key,name:x.name,description:x.description}));
  if(!allowed.length)throw Error('No executable Pegasus skills are authorized for '+context.agent.id);
  const keys=allowed.map((x:any)=>x.key);
  const system='You are '+context.agent.id+', a Pegasus company agent. Mission: '+context.agent.mission+
   '. Select exactly one permitted skill from '+JSON.stringify(allowed)+
   '. Never claim unperformed actions, invent evidence or use denied/approval-required actions. The orchestrator controls the 12-agent sequence.'+
   ' Return ONLY valid JSON: {"skillKey":"AUTHORIZED_KEY","rationale":"short evidence-grounded rationale","input":{"query":null,"task":null,"target":null,"notes":null}}.'+
   ' skillKey must be exactly one of '+keys.join(', ')+'. All four input values must be strings or null.';
  const result=await generateNvidiaStageText({system,prompt:JSON.stringify(context),maxOutputTokens:700,temperature:0.1});
  const parsed:any=parseDecision(result.text);
  if(!parsed)throw Error('NVIDIA did not return a parseable agent decision');
  if(!keys.includes(parsed.skillKey))throw Error('NVIDIA selected an unauthorized agent skill');
  return {skillKey:parsed.skillKey,rationale:String(parsed.rationale||'').slice(0,500),
   input:normalizeInput(parsed.input),runtime:result.runtime};
 }
}
export async function generatePegasusText({
 system,prompt,maxOutputTokens=500,temperature=0.1
}:{system:string;prompt:string;maxOutputTokens?:number;temperature?:number}){
 return generateNvidiaStageText({system,prompt,maxOutputTokens,temperature});
}
