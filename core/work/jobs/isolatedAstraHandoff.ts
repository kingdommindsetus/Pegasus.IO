import {db} from '../../database/client.js';
import {startOwnedIsolatedRun,finishOwnedIsolatedRun,failOwnedIsolatedAstraRun} from './isolatedAtomicExecution.js';
import {answerKmceWithValidation} from '../../runtime/execution/kmceAstraValidator.js';
import {validateAstraDraft,type draftWithAstra} from '../../runtime/execution/astraDraftBridge.js';
import {selectKmceKnowledge} from '../../runtime/execution/kmceAstraKnowledge.js';
import {classifyAstraDraftReview} from './astraDraftReview.js';

const OBJECTIVE='cbe5f353-25de-4daa-a69e-09b326299fea';
export const ASTRA_JOB_MARKER='astra_kmce_readonly_v1';
const WORKER='isolated-astra-worker';
function safety():void {
 const u=new URL(process.env.DATABASE_URL||'http://invalid');
 if(u.hostname!=='127.0.0.1'||u.port&&u.port!=='5432'||
   u.pathname!=='/pegasus_world_windows_accept_1011'||
   decodeURIComponent(u.username)!=='pegasus_windows_accept_role')
   throw Error('ASTRA_QUEUE_DENIED: isolated Windows PostgreSQL database required');
}
export type AstraPilotInput={
 bridgeKind:typeof ASTRA_JOB_MARKER;question:string;draftOnly:true;
 externalActionsAllowed:false;reasoningProvider:'ollama_local'
};
export function validatePilotInput(input:unknown):asserts input is AstraPilotInput {
 if(!input||typeof input!=='object')throw Error('ASTRA_QUEUE_DENIED: bad input');
 const x=input as Record<string,unknown>;
 if(x.bridgeKind!==ASTRA_JOB_MARKER||x.draftOnly!==true||
  x.externalActionsAllowed!==false||x.reasoningProvider!=='ollama_local'||
  typeof x.question!=='string'||x.question.length<3||x.question.length>1000)
  throw Error('ASTRA_QUEUE_DENIED: unapproved task');
 const allowedKeys=new Set(['bridgeKind','question','draftOnly','externalActionsAllowed','reasoningProvider']);
 if(Object.keys(x).some(k=>!allowedKeys.has(k)))throw Error('ASTRA_QUEUE_DENIED: unexpected action input');
 const evidence=selectKmceKnowledge(x.question as string).map(e=>({id:e.id,text:e.claim}));
 if(!evidence.length)throw Error('ASTRA_QUEUE_DENIED: no approved knowledge source');
 validateAstraDraft({agentId:'simon',taskId:'astra_queue_guard_01',question:x.question as string,evidence,draftOnly:true,externalActionsAllowed:false});
}
export async function queueOneAstraPilot(taskId:string,jobKey:string,input:AstraPilotInput):Promise<string> {
 safety();validatePilotInput(input);
 if(!/^astra-pilot-[\w-]{5,80}$/.test(jobKey))throw Error('ASTRA_QUEUE_DENIED: invalid idempotency key');
 const sql=db();
 const [task]=await sql`SELECT id FROM pegasus_core.tasks WHERE id=${taskId}
  AND objective_id=${OBJECTIVE} AND assigned_agent_id='simon'`;
 if(!task)throw Error('ASTRA_QUEUE_DENIED: task must belong to Simon in isolated objective');
 const [row]=await sql`INSERT INTO pegasus_core.jobs
 (task_id,agent_id,skill_key,status,input,max_attempts,idempotency_key,priority)
 VALUES (${taskId},'simon','astra_knowledge_draft','queued',${sql.json(input)},1,${jobKey},-100)
 ON CONFLICT (idempotency_key) DO UPDATE SET updated_at=pegasus_core.jobs.updated_at
 RETURNING id`;
 return row.id as string;
}
export async function processOneAstraPilot(jobId:string,invoke?:typeof draftWithAstra):Promise<{jobId:string;status:string;validationStatus:string}|null> {
 safety();
 const sql=db();
 const picked=await sql.begin(async tx=>{
  const rows=await tx`SELECT j.id,j.input,j.status FROM pegasus_core.jobs j
    JOIN pegasus_core.tasks t ON t.id=j.task_id
    WHERE j.id=${jobId} AND t.objective_id=${OBJECTIVE}
      AND j.agent_id='simon' AND j.skill_key='astra_knowledge_draft'
      AND j.status='queued'
      AND j.attempts=0 AND j.max_attempts=1
      AND j.input->>'bridgeKind'=${ASTRA_JOB_MARKER}
      FOR UPDATE OF j`;
  const j=rows[0];if(!j)return null;
  validatePilotInput(j.input);
  const [changed]=await tx`UPDATE pegasus_core.jobs SET status='claimed',
    lease_expires_at=now()+interval '90 seconds',updated_at=now()
    WHERE id=${jobId} AND status='queued' RETURNING id`;
  if(!changed)return null;
  await tx`INSERT INTO pegasus_core.job_runs(job_id,attempt,worker_id,status)
    VALUES(${jobId},1,${WORKER},'claimed')`;
  return j;
 });
 if(!picked)return null;
 const owned=await startOwnedIsolatedRun(OBJECTIVE,jobId,WORKER);
 if(!owned)throw Error('ASTRA_QUEUE_OWNERSHIP_LOST');
 // Process output is only a draft or review status; never publish it or approve a side effect.
 let result;
 try{
  result=await answerKmceWithValidation(
    {question:picked.input.question,taskId:'astra_job_'+jobId.replace(/[^\w]/g,'').slice(0,48),
     agentId:'simon',draftOnly:true,externalActionsAllowed:false},invoke);
 }catch(error){
  // Local model errors are recorded as failed runs, never as approved or publishable content.
  if(!await failOwnedIsolatedAstraRun(OBJECTIVE,owned))
    throw new Error('ASTRA_QUEUE_STALE_FAILURE_REJECTED',{cause:error});
  throw error;
 }
 const review=classifyAstraDraftReview({status:'draft_assessed',validationStatus:result.status,draftOnly:true,externalActionsExecuted:false});
 const output={status:'draft_assessed',reviewState:review.state,reviewReason:review.reason,validationStatus:result.status,
   answer:result.answer,knowledgeVersion:result.knowledgeVersion,
   reasons:result.reasons,draftOnly:true,externalActionsExecuted:false,
   sourceIds:result.citedSources.map(s=>s.id)};
 const evidence=result.citedSources.map(s=>({
   source:s.path,sourceRevision:s.revision,sourceId:s.id,
   validationStatus:result.status,knowledgeVersion:result.knowledgeVersion
 }));
 if(!await finishOwnedIsolatedRun(OBJECTIVE,owned,output,evidence))
  throw Error('ASTRA_QUEUE_STALE_RUN_NOT_COMMITTED');
 return {jobId,status:'completed',validationStatus:result.status};
}
