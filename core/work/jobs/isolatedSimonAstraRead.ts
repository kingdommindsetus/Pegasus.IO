// Read-only, isolated development retrieval of the Simon <- Astra review handoff.
// No approval, tool execution, live queue dispatch, patient access, or publishing.
import {db} from '../../database/client.js';
import {createSimonAstraReceipt,type SimonAstraReceipt} from './astraDraftReview.js';

const OBJECTIVE='cbe5f353-25de-4daa-a69e-09b326299fea';
function guard():void{
 const url=new URL(process.env.DATABASE_URL||'http://invalid');
 if(url.hostname!=='127.0.0.1'||(url.port&&url.port!=='5432')||
   url.pathname!=='/pegasus_world_windows_accept_1011'||
   decodeURIComponent(url.username)!=='pegasus_windows_accept_role')
   throw Error('SIMON_ASTRA_READ_DENIED: isolated Windows acceptance database required');
}
export async function readSimonAstraHandoff(jobId:string):Promise<{
 receipt:SimonAstraReceipt;proof:{completedRuns:number;completionEvents:number;sourceEvidence:number;memories:number};
}|null>{
 guard();
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId))
   throw Error('SIMON_ASTRA_READ_DENIED: invalid job ID');
 const sql=db();
 const [job]=await sql`SELECT j.id,j.result FROM pegasus_core.jobs j
   JOIN pegasus_core.tasks t ON t.id=j.task_id
   WHERE j.id=${jobId} AND t.objective_id=${OBJECTIVE}
     AND j.agent_id='simon' AND j.skill_key='astra_knowledge_draft'
     AND j.status='completed' AND j.input->>'bridgeKind'='astra_kmce_readonly_v1'
     AND j.input->>'draftOnly'='true' AND j.input->>'externalActionsAllowed'='false'`;
 if(!job)return null;
 const receipt=createSimonAstraReceipt(jobId,job.result);
 const stored=job.result?.simonReceipt;
 if(!stored||typeof stored!=='object'||Array.isArray(stored)||
   Object.keys(stored).length!==Object.keys(receipt).length||
   Object.entries(receipt).some(([key,value])=>
     JSON.stringify(stored[key])!==JSON.stringify(value)))
   throw Error('SIMON_ASTRA_READ_DENIED: receipt mismatch');
 const evidence=await sql`SELECT content FROM pegasus_core.evidence
   WHERE job_id=${jobId} AND evidence_type='agent_result'`;
 const sourceIds=evidence.map(row=>row.content?.sourceId).sort();
 if(sourceIds.length!==receipt.sourceIds.length||
   sourceIds.some((id,i)=>id!==[...receipt.sourceIds].sort()[i]))
   throw Error('SIMON_ASTRA_READ_DENIED: source evidence mismatch');
 const [proof]=await sql`SELECT
   (SELECT count(*)::int FROM pegasus_core.job_runs WHERE job_id=${jobId}
      AND worker_id='isolated-astra-worker' AND status='completed' AND finished_at IS NOT NULL) completed_runs,
   (SELECT count(*)::int FROM pegasus_core.events WHERE entity_id=${jobId}
      AND event_type='job_completed') completion_events,
   (SELECT count(*)::int FROM pegasus_core.memories WHERE metadata->>'jobId'=${jobId}) memories`;
 if(proof.completed_runs!==1||proof.completion_events!==1||proof.memories!==1)
   throw Error('SIMON_ASTRA_READ_DENIED: incomplete persisted execution proof');
 return {receipt,proof:{completedRuns:proof.completed_runs,
   completionEvents:proof.completion_events,sourceEvidence:evidence.length,memories:proof.memories}};
}
