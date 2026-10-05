import { GoogleGenAI } from '@google/genai';
import { acquireGoogleReasoningSlot } from './googleQuotaGovernor.js';
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

export class PegasusReasoner implements AgentReasoner{
 private google:GoogleGenAI;
 constructor(
  private models=(process.env.PEGASUS_REASONING_MODELS||
   'gemini-3.5-flash-lite,gemini-3.6-flash,gemini-3.7-flash')
   .split(',').map(x=>x.trim()).filter(Boolean)
 ){
  const apiKey=String(process.env.GOOGLE_GENERATIVE_AI_API_KEY||'').trim();
  if(!apiKey) throw Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured for Pegasus Core reasoning');
  this.google=new GoogleGenAI({
   apiKey,
   httpOptions:{headers:{'User-Agent':'pegasus-core'}}
  });
 }

 async decide(context:ContextPacket):Promise<AgentDecision>{
  const allowed=(Array.isArray(context.availableSkills)?context.availableSkills:[])
   .filter((x:any)=>x?.permission==='allow')
   .map((x:any)=>({key:x.key,name:x.name,description:x.description}));

  if(!allowed.length)throw Error('No executable Pegasus skills are authorized for '+context.agent.id);

  const allowedKeys=allowed.map((x:any)=>x.key);
  const system='You are '+context.agent.id+', a Pegasus company agent. Mission: '+context.agent.mission+
   '. Choose exactly one skill from this authorized executable list: '+JSON.stringify(allowed)+
   '. Never choose a denied or approval_required skill for an autonomous step. Never claim actions not supported by context. The orchestrator owns the assigned workflow. Do not substitute another agent or change the assigned sequence unless the current task explicitly authorizes that change. Keep rationale concise: no more than two sentences and roughly 280 characters. Return ONLY one valid JSON object with no markdown, no backticks, and no prose before or after it. Required shape: {"skillKey":"AUTHORIZED_KEY","rationale":"short reason","input":{"query":null,"task":null,"target":null,"notes":null}}. skillKey must be exactly one of: '+allowedKeys.join(', ')+'. All four input keys are required and each value must be a string or null.';

  let lastError:any=null;
  const reasoningStarted=Date.now();
  let totalQuotaWaitMs=0;

  for(const modelId of this.models){
   try{
    totalQuotaWaitMs+=await acquireGoogleReasoningSlot();
    const result=await this.google.models.generateContent({
     model:modelId,
     contents:[{role:'user',parts:[{text:JSON.stringify(context)}]}],
     config:{
      systemInstruction:system,
      temperature:0.1,
      maxOutputTokens:450,
      responseMimeType:'application/json'
     }
    });

    const parsed:any=parseDecision(result.text||'');
    if(!parsed)throw Error('Model returned malformed JSON');
    if(!allowedKeys.includes(parsed.skillKey))throw Error('Reasoner selected unauthorized skill: '+String(parsed.skillKey));

    return {
     skillKey:parsed.skillKey,
     rationale:String(parsed.rationale||'').slice(0,500),
     input:normalizeInput(parsed.input),
     runtime:{
      reasoningProvider:'Google AI Studio',
      model:modelId,
      fallback:false,
      reasoningMs:Date.now()-reasoningStarted,
      quotaWaitMs:totalQuotaWaitMs
     }
    };
   }catch(error:any){
    lastError=error;
    const msg=String(error?.message||error);
    console.warn('Direct Google reasoning model failed',modelId,msg.slice(0,300));
    if(isRateLimit(error))continue;
    continue;
   }
  }

  const fallback=allowed[0];
  return {
   skillKey:fallback.key,
   rationale:'Direct Google reasoning was temporarily unavailable; using the first authorized skill as a governed continuity fallback.',
   input:{
    query:null,
    task:null,
    target:null,
    notes:'Direct Google error: '+String(lastError?.message||lastError||'unknown').replace(/AIza[0-9A-Za-z_-]+/g,'[redacted]').slice(0,400)
   },
   runtime:{
    reasoningProvider:'Google AI Studio',
    model:'governed-fallback',
    fallback:true,
    reasoningMs:Date.now()-reasoningStarted,
    quotaWaitMs:totalQuotaWaitMs
   }
  };
 }
}


export async function generatePegasusText({
 system,
 prompt,
 maxOutputTokens=500,
 temperature=0.1
}:{system:string;prompt:string;maxOutputTokens?:number;temperature?:number}){
 const apiKey=String(process.env.GOOGLE_GENERATIVE_AI_API_KEY||'').trim();
 if(!apiKey)throw Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured for Pegasus reasoning');
 const google=new GoogleGenAI({apiKey,httpOptions:{headers:{'User-Agent':'pegasus-core'}}});
 const models=(process.env.PEGASUS_REASONING_MODELS||'gemini-3.5-flash-lite,gemini-3.6-flash,gemini-3.7-flash').split(',').map(x=>x.trim()).filter(Boolean);
 let lastError:any=null;
 for(const model of models){
  try{
   const quotaWaitMs=await acquireGoogleReasoningSlot();
   const started=Date.now();
   const result=await google.models.generateContent({
    model,
    contents:[{role:'user',parts:[{text:prompt}]}],
    config:{systemInstruction:system,temperature,maxOutputTokens}
   });
   const text=String(result.text||'').trim();
   if(!text)throw Error('Pegasus reasoning returned no response text');
   return {text,runtime:{reasoningProvider:'Google AI Studio',model,fallback:false,reasoningMs:Date.now()-started,quotaWaitMs}};
  }catch(error:any){
   lastError=error;
   console.warn('Pegasus reasoning model failed',model,String(error?.message||error).slice(0,300));
  }
 }
 throw Error('Pegasus reasoning unavailable: '+String(lastError?.message||lastError||'unknown').replace(/AIza[0-9A-Za-z_-]+/g,'[redacted]').slice(0,400));
}
