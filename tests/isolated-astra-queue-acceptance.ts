import assert from 'node:assert/strict';
import {db,closeDb} from '../core/database/client.js';
import {recoverExpiredIsolatedLeases} from '../core/work/jobs/isolatedLeaseRecovery.js';
import {queueOneAstraPilot,processOneAstraPilot,ASTRA_JOB_MARKER,type AstraPilotInput} from '../core/work/jobs/isolatedAstraHandoff.js';
const sql=db();
let jobId:string|undefined;
try{
 const [identity]=await sql`SELECT current_database() db,current_user role`;
 assert.equal(identity.db,'pegasus_world_windows_accept_1011');
 assert.equal(identity.role,'pegasus_windows_accept_role');
 const [task]=await sql`SELECT id FROM pegasus_core.tasks WHERE objective_id='cbe5f353-25de-4daa-a69e-09b326299fea' AND assigned_agent_id='simon' LIMIT 1`;
 assert.ok(task);
 const input:AstraPilotInput={bridgeKind:ASTRA_JOB_MARKER,question:'What are both AGD PACE provider identifiers?',draftOnly:true as const,externalActionsAllowed:false as const,reasoningProvider:'ollama_local' as const};
 const key='astra-pilot-'+Date.now()+'-isolated';
 jobId=await queueOneAstraPilot(task.id,key,input);
 assert.equal(await queueOneAstraPilot(task.id,key,input),jobId);
 const result=await processOneAstraPilot(jobId,async(request)=>({status:'draft',taskId:request.taskId,source:'astra_local_ollama',model:'astra-main',answer:'The source code includes national provider ID 441585, but omits the separate local ID.',evidenceIds:request.evidence.map(e=>e.id)}));
 assert.ok(result);
 assert.equal(result.simonReceipt.jobId,jobId);
 assert.equal(result.simonReceipt.owner,'simon');
 assert.equal(result.simonReceipt.contentStatus,'pending_human_review');
 assert.equal(result.simonReceipt.publishAllowed,false);
 assert.equal(result.simonReceipt.externalActionsAllowed,false);
 assert.equal(await processOneAstraPilot(jobId),null);
 const [job]=await sql`SELECT status,attempts,result FROM pegasus_core.jobs WHERE id=${jobId}`;
 assert.equal(job.status,'completed');assert.equal(Number(job.attempts),1);
 assert.equal(job.result.externalActionsExecuted,false);
 assert.equal(job.result.reviewState,'pending_human_review');
 assert.equal(job.result.simonReceipt.kind,'simon_astra_internal_review_v1');
 assert.equal(job.result.simonReceipt.jobId,jobId);
 assert.equal(job.result.simonReceipt.publishAllowed,false);
 assert.notEqual(job.result.reviewState,'approved');
 const [counts]=await sql`SELECT (SELECT count(*)::int FROM pegasus_core.evidence WHERE job_id=${jobId}) evidence,(SELECT count(*)::int FROM pegasus_core.memories WHERE metadata->>'jobId'=${jobId}) memories,(SELECT count(*)::int FROM pegasus_core.events WHERE entity_id=${jobId} AND event_type='job_completed') events,(SELECT count(*)::int FROM pegasus_core.job_runs WHERE job_id=${jobId} AND status='completed') runs`;
 assert.ok(counts.evidence>=1);assert.equal(counts.memories,1);assert.equal(counts.events,1);assert.equal(counts.runs,1);
 console.log('ASTRA_PERSISTENCE_ACCEPTANCE',JSON.stringify({jobId,status:job.status,validation:job.result.validationStatus,evidence:counts.evidence,memories:counts.memories,events:counts.events,runs:counts.runs,externalActionsExecuted:false}));
 // Simulate an unavailable local model: fail atomically, with no draft or memory published.
 const failedId=await queueOneAstraPilot(task.id,key+'-fail',input);
 await assert.rejects(()=>processOneAstraPilot(failedId,async()=>{throw Error('ASTRA_FIXTURE_MODEL_UNAVAILABLE');}),/ASTRA_FIXTURE_MODEL_UNAVAILABLE/);
 const [failed]=await sql`SELECT j.status,j.last_error,j.attempts,
 (SELECT count(*)::int FROM pegasus_core.job_runs r WHERE r.job_id=j.id AND r.status='failed' AND r.finished_at IS NOT NULL) failed_runs,
 (SELECT count(*)::int FROM pegasus_core.evidence e WHERE e.job_id=j.id) evidence,
 (SELECT count(*)::int FROM pegasus_core.memories m WHERE m.metadata->>'jobId'=j.id::text) memories,
 (SELECT count(*)::int FROM pegasus_core.events e WHERE e.entity_id=j.id::text AND e.event_type='astra_draft_failed') failure_events
 FROM pegasus_core.jobs j WHERE j.id=${failedId}`;
 assert.equal(failed.status,'failed');assert.equal(failed.last_error,'ASTRA_LOCAL_DRAFT_FAILED');
 assert.equal(Number(failed.attempts),1);assert.equal(failed.failed_runs,1);
 assert.equal(failed.evidence,0);assert.equal(failed.memories,0);assert.equal(failed.failure_events,1);
 console.log('ASTRA_MODEL_FAILURE_ACCEPTANCE',JSON.stringify({jobId:failedId,status:failed.status,failedRuns:failed.failed_runs,evidence:failed.evidence,memories:failed.memories,failureEvents:failed.failure_events}));
 // Simulated crashed worker: expiration closes the one-shot Astra job without retrying.
 const staleId=await queueOneAstraPilot(task.id,key+'-expired',input);
 await sql`UPDATE pegasus_core.jobs SET status='claimed',lease_expires_at=now()-interval '2 minutes'
   WHERE id=${staleId} AND status='queued'`;
 await sql`INSERT INTO pegasus_core.job_runs(job_id,attempt,worker_id,status)
   VALUES(${staleId},1,'isolated-astra-worker','claimed')`;
 const recovered=await recoverExpiredIsolatedLeases('cbe5f353-25de-4daa-a69e-09b326299fea');
 assert.ok(recovered.includes(staleId));
 const [expired]=await sql`SELECT status,attempts,last_error FROM pegasus_core.jobs WHERE id=${staleId}`;
 assert.equal(expired.status,'failed');assert.equal(Number(expired.attempts),0);
 assert.equal(expired.last_error,'ASTRA_ISOLATED_LEASE_EXPIRED');
 const [expiryCounts]=await sql`SELECT
  (SELECT count(*)::int FROM pegasus_core.job_runs WHERE job_id=${staleId} AND status='failed' AND finished_at IS NOT NULL) failed_runs,
  (SELECT count(*)::int FROM pegasus_core.events WHERE entity_id=${staleId} AND event_type='isolated_astra_lease_expired') events,
  (SELECT count(*)::int FROM pegasus_core.evidence WHERE job_id=${staleId}) evidence,
  (SELECT count(*)::int FROM pegasus_core.memories WHERE metadata->>'jobId'=${staleId}) memories`;
 assert.equal(expiryCounts.failed_runs,1);assert.equal(expiryCounts.events,1);
 assert.equal(expiryCounts.evidence,0);assert.equal(expiryCounts.memories,0);
 assert.equal(await processOneAstraPilot(staleId),null);
 console.log('ASTRA_LEASE_EXPIRY_ACCEPTANCE',JSON.stringify({jobId:staleId,status:expired.status,attempts:expired.attempts,events:expiryCounts.events,automaticRetry:false,externalActionsExecuted:false}));
}finally{await closeDb();}
