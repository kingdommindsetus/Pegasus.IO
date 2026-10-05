import postgres from 'postgres';
import {requireCoreAuth,requirePost,enforceRateLimit,parseUuid,parseObjective} from './_security.js';
import {GoogleGenAI} from '@google/genai';
import {acquireGoogleReasoningSlot} from '../../core/runtime/agents/googleQuotaGovernor.js';

const getSql=()=>{
 const u=process.env.DATABASE_URL?.trim();
 if(!u)throw Error('DATABASE_URL is not configured');
 return postgres(u,{max:1,idle_timeout:5,connect_timeout:10});
};

const AGENT_CHAIN=[
 ['simon','Mission Strategy','Define executive strategy, priorities, constraints, and the handoff brief for Marie.'],
 ['marie','Execution Architecture','Convert strategy into an operating plan, workstream structure, dependencies, and the handoff brief for IRIS.'],
 ['iris','Intelligence Verification','Verify assumptions using available company memory and research context, identify evidence gaps, and hand off verified intelligence to Mark.'],
 ['mark','Marketing Direction','Translate verified intelligence into positioning, message hierarchy, offer framing, and the handoff brief for Cammy.'],
 ['cammy','Campaign Architecture','Turn positioning into a coordinated campaign plan, channels, sequence, and the handoff brief for Evan.'],
 ['evan','Content System','Create the content brief, narrative structure, asset requirements, and the handoff brief for Tube.'],
 ['tube','Video Direction','Translate the content system into video concepts, production briefs, hooks, and the handoff brief for Lucy.'],
 ['lucy','Distribution Plan','Create the distribution cadence, channel plan, amplification logic, and the handoff brief for Snake.'],
 ['snake','Measurement Framework','Define KPIs, evidence requirements, measurement logic, and the handoff brief for Alice.'],
 ['alice','Storefront & CRO Review','Assess the digital conversion path, identify site/CRO priorities, and hand off qualified commercial context to Echo.'],
 ['echo','Sales Outreach Plan','Develop prospecting targets, outreach drafts, qualification logic, and the handoff brief for Booker without sending externally.'],
 ['booker','Scheduling Readiness','Prepare the appointment-conversion and scheduling handoff plan without creating external bookings; close the mission with next-action readiness.']
] as const;


function parseCloseJson(raw:string){
 const text=String(raw||'').trim();
 const fenced=text.match(/```(?:json)?\s*([\s\S]*?)```/i);
 let candidate=(fenced?.[1]||text).trim();
 const start=candidate.indexOf('{'),end=candidate.lastIndexOf('}');
 if(start>=0&&end>start)candidate=candidate.slice(start,end+1);
 try{return JSON.parse(candidate);}catch{}
 const repaired=candidate.replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/,\s*([}\]])/g,'$1');
 return JSON.parse(repaired);
}

async function executiveClose(sql:any,missionId:string){
 const [objective]=await sql`
  SELECT o.id,o.title,p.objective AS founder_objective
  FROM pegasus_core.objectives o
  JOIN pegasus_core.projects p ON p.id=o.project_id
  WHERE o.id=${missionId}
 `;
 if(!objective)throw Error('Mission not found');

 const stages=await sql`
  SELECT t.assigned_agent_id AS agent_id,t.title,t.instructions,j.result,
   COALESCE((
    SELECT json_agg(e.content ORDER BY e.created_at)
    FROM pegasus_core.evidence e
    WHERE e.task_id=t.id
   ),'[]'::json) AS evidence
  FROM pegasus_core.tasks t
  LEFT JOIN LATERAL (
   SELECT result FROM pegasus_core.jobs
   WHERE task_id=t.id AND status='completed'
   ORDER BY updated_at DESC LIMIT 1
  ) j ON true
  WHERE t.objective_id=${missionId}
  ORDER BY t.created_at,t.id
 `;

 const completed=stages.filter((x:any)=>x.result).length;
 if(completed<AGENT_CHAIN.length)throw Error('Simon Close requires all 12 agent stages completed');

 const apiKey=String(process.env.GOOGLE_GENERATIVE_AI_API_KEY||'').trim();
 if(!apiKey)throw Error('GOOGLE_GENERATIVE_AI_API_KEY is not configured');
 const ai=new GoogleGenAI({apiKey,httpOptions:{headers:{'User-Agent':'pegasus-simon-close'}}});
 const model=(process.env.PEGASUS_REASONING_MODELS||'gemini-3.5-flash-lite,gemini-3.6-flash,gemini-3.7-flash').split(',')[0].trim();

 await acquireGoogleReasoningSlot();
 const prompt={
  founderObjective:objective.founder_objective,
  boardStages:stages.map((s:any)=>({
   agent:s.agent_id,title:s.title,decision:s.result?.decision||null,
   skillOutput:s.result?.skillOutput||null,evidence:s.evidence||[]
  }))
 };
 const response=await ai.models.generateContent({
  model,
  contents:[{role:'user',parts:[{text:JSON.stringify(prompt)}]}],
  config:{
   systemInstruction:'You are Simon, Pegasus Executive Orchestrator. Synthesize the completed 12-agent board meeting for the founder using only the persisted decisions, outputs, and evidence provided. Do not invent completed actions or evidence. Return ONLY valid JSON with this exact shape: {"finalDecision":"string","corePriorities":["string"],"immediateNextSteps":[{"owner":"string","action":"string"}],"riskBlockers":["string"],"actionOwners":[{"owner":"string","responsibility":"string"}],"spokenSummary":"string"}. Keep spokenSummary under 500 characters and executive in tone.',
   temperature:0.1,
   maxOutputTokens:1200,
   responseMimeType:'application/json'
  }
 });
 const briefing=parseCloseJson(response.text||'');
 const [project]=await sql`SELECT project_id FROM pegasus_core.objectives WHERE id=${missionId}`;
 await sql`
  INSERT INTO pegasus_core.memories(scope,scope_id,agent_id,project_id,memory_kind,memory_partition,subject,content,source_type,authority,metadata)
  VALUES('project',${project.project_id},'simon',${project.project_id},'handoff','mission_run_memory','Simon Executive Close',${JSON.stringify(briefing)},'agent_execution','agent_generated',${sql.json({objectiveId:missionId,type:'executive_close',model})})
 `;
 return {briefing,runtime:{reasoningProvider:'Google AI Studio',model,fallback:false}};
}


async function proof(sql:any,id:string){
 const [r]=await sql`SELECT
  (SELECT count(*) FROM pegasus_core.tasks WHERE objective_id=${id} AND status='completed')::int completed_tasks,
  (SELECT count(*) FROM pegasus_core.job_runs jr JOIN pegasus_core.jobs j ON j.id=jr.job_id JOIN pegasus_core.tasks t ON t.id=j.task_id WHERE t.objective_id=${id} AND jr.status='completed')::int completed_runs,
  (SELECT count(*) FROM pegasus_core.evidence e JOIN pegasus_core.tasks t ON t.id=e.task_id WHERE t.objective_id=${id})::int evidence_count,
  (SELECT count(*) FROM pegasus_core.memories m JOIN pegasus_core.objectives o ON o.project_id=m.project_id WHERE o.id=${id} AND m.source_type='agent_execution')::int memory_count`;
 return {completedTasks:r.completed_tasks,completedRuns:r.completed_runs,evidenceCount:r.evidence_count,memoryCount:r.memory_count,verified:r.completed_tasks===AGENT_CHAIN.length&&r.completed_runs===AGENT_CHAIN.length&&r.memory_count>=AGENT_CHAIN.length};
}


async function hydrate(sql:any,requestedMissionId?:string){
 let objective:any;
 if(requestedMissionId){
  const missionId=parseUuid(requestedMissionId,'missionId');
  [objective]=await sql`
   SELECT o.id,o.project_id,o.created_at,p.objective AS founder_objective,p.status AS project_status
   FROM pegasus_core.objectives o
   JOIN pegasus_core.projects p ON p.id=o.project_id
   WHERE o.id=${missionId}
     AND o.title='Pegasus 12-Agent War Room Mission'
  `;
 }else{
  [objective]=await sql`
   SELECT o.id,o.project_id,o.created_at,p.objective AS founder_objective,p.status AS project_status
   FROM pegasus_core.objectives o
   JOIN pegasus_core.projects p ON p.id=o.project_id
   WHERE o.title='Pegasus 12-Agent War Room Mission'
   ORDER BY o.created_at DESC
   LIMIT 1
  `;
 }
 if(!objective)return {found:false};

 const stages=await sql`
  SELECT
   t.id AS task_id,
   t.assigned_agent_id AS agent_id,
   t.title,
   t.status AS task_status,
   j.id AS job_id,
   j.status AS job_status,
   j.result,
   jr.metrics AS run_metrics,
   (
    SELECT ev.payload
    FROM pegasus_core.events ev
    WHERE ev.event_type='voice_telemetry'
      AND ev.entity_type='job'
      AND ev.entity_id=j.id::text
    ORDER BY ev.created_at DESC
    LIMIT 1
   ) AS voice_telemetry,
   (
    SELECT count(*)::int
    FROM pegasus_core.evidence e
    WHERE e.task_id=t.id
   ) AS evidence_count
  FROM pegasus_core.tasks t
  LEFT JOIN LATERAL (
   SELECT *
   FROM pegasus_core.jobs
   WHERE task_id=t.id
   ORDER BY created_at DESC
   LIMIT 1
  ) j ON true
  LEFT JOIN LATERAL (
   SELECT metrics
   FROM pegasus_core.job_runs
   WHERE job_id=j.id
   ORDER BY started_at DESC
   LIMIT 1
  ) jr ON true
  WHERE t.objective_id=${objective.id}
  ORDER BY t.created_at,t.id
 `;

 const [closeMemory]=await sql`
  SELECT content,metadata,created_at
  FROM pegasus_core.memories
  WHERE memory_partition='mission_run_memory'
    AND source_type='agent_execution'
    AND authority='agent_generated'
    AND metadata->>'type'='executive_close'
    AND metadata->>'objectiveId'=${String(objective.id)}
  ORDER BY created_at DESC
  LIMIT 1
 `;

 let executiveClose:any=null;
 if(closeMemory?.content){
  try{executiveClose={briefing:JSON.parse(closeMemory.content),runtime:{reasoningProvider:'Google AI Studio',model:closeMemory.metadata?.model||'persisted',fallback:false}};}catch{}
 }

 const p=await proof(sql,String(objective.id));
 const completedStages=stages.filter((x:any)=>x.job_status==='completed'&&x.result).length;
 return {
  found:true,
  missionId:objective.id,
  projectId:objective.project_id,
  founderObjective:objective.founder_objective,
  proof:p,
  completedStages,
  complete:completedStages===AGENT_CHAIN.length,
  needsExecutiveClose:completedStages===AGENT_CHAIN.length&&!executiveClose,
  executiveClose,
  stages:stages.map((s:any)=>({
   taskId:s.task_id,
   jobId:s.job_id,
   agentId:s.agent_id,
   taskStatus:s.task_status,
   jobStatus:s.job_status,
   decision:s.result?.decision||null,
   skillOutput:s.result?.skillOutput||null,
   evidenceCount:Number(s.evidence_count||0),
   telemetry:s.result?.decision?.runtime ? {
    reasoningProvider:s.result.decision.runtime.reasoningProvider||'Google AI Studio',
    model:s.result.decision.runtime.model||'unknown',
    reasoningMs:Number(s.result.decision.runtime.reasoningMs||0),
    quotaWaitMs:Number(s.result.decision.runtime.quotaWaitMs||0),
    voiceProvider:s.voice_telemetry?.provider||null,
    voiceName:s.voice_telemetry?.voiceName||null,
    fallback:Boolean(s.result.decision.runtime.fallback||s.voice_telemetry?.fallback)
   } : null
  }))
 };
}

async function start(sql:any,text:string){
 const slug='war-room-'+Date.now();
 const [org]=await sql`INSERT INTO pegasus_core.organizations(name,slug) VALUES('Pegasus War Room',${slug}) RETURNING id`;
 const [project]=await sql`INSERT INTO pegasus_core.projects(organization_id,name,objective) VALUES(${org.id},'War Room Mission',${text}) RETURNING id`;
 const [objective]=await sql`INSERT INTO pegasus_core.objectives(project_id,title,success_criteria,owner_agent_id,status_v2) VALUES(${project.id},'Pegasus 12-Agent War Room Mission',${sql.json(['12 completed agent tasks','12 completed job runs','durable memory for every agent','auditable evidence chain'])},'simon','active') RETURNING id`;
 const tasks:any[]=[];
 for(const [agent,title,instructions] of AGENT_CHAIN){
  const [t]=await sql`INSERT INTO pegasus_core.tasks(project_id,objective_id,assigned_agent_id,title,instructions,priority,input) VALUES(${project.id},${objective.id},${agent},${title},${instructions+' Founder objective: '+text},100,${sql.json({mission:slug,objective:text})}) RETURNING id`;
  tasks.push(t);
 }
 for(let i=1;i<tasks.length;i++)await sql`INSERT INTO pegasus_core.task_dependencies(task_id,depends_on_task_id) VALUES(${tasks[i].id},${tasks[i-1].id})`;
 await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,priority,idempotency_key,input) VALUES(${tasks[0].id},'simon','handoff_task',100,${slug+'-0'},${sql.json({mission:slug,objective:text})})`;
 return {missionId:objective.id,projectId:project.id,agentCount:AGENT_CHAIN.length};
}

export default async function handler(req:any,res:any){
 if(!requirePost(req,res)||!enforceRateLimit(req,res,40,60_000)||!requireCoreAuth(req,res))return;
 const sql=getSql();
 try{
  const action=String(req.body?.action||'');
  if(action==='start'){const objective=parseObjective(req.body?.objective);return res.json(await start(sql,objective));}
  if(action==='hydrate'){const missionId=typeof req.body?.missionId==='string'?req.body.missionId:undefined;return res.json(await hydrate(sql,missionId));}
  if(action==='status'){const missionId=parseUuid(req.body?.missionId,'missionId');return res.json(await proof(sql,missionId));}
  if(action==='close'){const missionId=parseUuid(req.body?.missionId,'missionId');return res.json(await executiveClose(sql,missionId));}
  return res.status(400).json({error:'unknown action'});
 }catch(e:any){
  const m=e?.message||String(e);
  return res.status(m.includes('valid UUID')||m.includes('objective')?400:500).json({error:m});
 }finally{
  await sql.end({timeout:1});
 }
}