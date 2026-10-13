import {db,closeDb} from '../core/database/client.js';
import {startOwnedIsolatedRun,finishOwnedIsolatedRun} from '../core/work/jobs/isolatedAtomicExecution.js';
import {recoverExpiredIsolatedLeases} from '../core/work/jobs/isolatedLeaseRecovery.js';
const scope='cbe5f353-25de-4daa-a69e-09b326299fea';
const url=new URL(process.env.DATABASE_URL||'http://invalid');
if(url.hostname!=='127.0.0.1'||url.pathname!=='/pegasus_world_windows_accept_1011'||
 decodeURIComponent(url.username)!=='pegasus_windows_accept_role')throw Error('Isolated-only test');
const sql=db();let id:string|undefined;
try{
 const [t]=await sql`SELECT id FROM pegasus_core.tasks WHERE objective_id=${scope} LIMIT 1`;
 if(!t)throw Error('Missing safe scope task');
 const [j]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,status,
  attempts,max_attempts,lease_expires_at,input,idempotency_key)
 VALUES(${t.id},'simon','search_company_memory','claimed',0,3,
  now()+interval '90 seconds',${sql.json({draftOnly:true,externalActionsAllowed:false})},
  ${'r05-atomic-'+Date.now()}) RETURNING id`;
 id=j.id;
 await sql`INSERT INTO pegasus_core.job_runs(job_id,attempt,worker_id,status)
 VALUES(${id!},1,'worker-old','claimed')`;
 const old=await startOwnedIsolatedRun(scope,id!,'worker-old');
 if(!old)throw Error('Old worker could not begin');
 // Simulate worker crash/lease expiry. The old caller retains its stale token.
 await sql`UPDATE pegasus_core.jobs SET lease_expires_at=now()-interval '2 seconds'
 WHERE id=${id!}`;
 const recovered=await recoverExpiredIsolatedLeases(scope);
 if(!recovered.includes(id!))throw Error('Crash lease was not recovered');
 // Replacement gets a fresh claimed lease and new run ID, within the SAME isolated job.
 await sql`UPDATE pegasus_core.jobs SET status='claimed',
  lease_expires_at=now()+interval '90 seconds' WHERE id=${id!} AND status='retrying'`;
 await sql`INSERT INTO pegasus_core.job_runs(job_id,attempt,worker_id,status)
 VALUES(${id!},2,'worker-new','claimed')`;
 const fresh=await startOwnedIsolatedRun(scope,id!,'worker-new');
 if(!fresh)throw Error('New worker did not own job');
 const stale=await finishOwnedIsolatedRun(scope,old,{source:'stale'},[{source:'stale'}]);
 if(stale)throw Error('Stale worker persisted side effects');
 const valid=await finishOwnedIsolatedRun(scope,fresh,{source:'new',externalActionsExecuted:false},[{source:'new'}]);
 if(!valid)throw Error('Current owner could not commit');
 const second=await finishOwnedIsolatedRun(scope,fresh,{source:'duplicate'},[{source:'duplicate'}]);
 if(second)throw Error('Duplicate completion accepted');
 const [summary]=await sql`SELECT
 (SELECT count(*)::int FROM pegasus_core.evidence WHERE job_id=${id!}) AS evidence,
 (SELECT count(*)::int FROM pegasus_core.memories WHERE metadata->>'jobId'=${id!}) AS memories,
 (SELECT count(*)::int FROM pegasus_core.events WHERE entity_id=${id!} AND event_type='job_completed') AS completions,
 (SELECT count(*)::int FROM pegasus_core.job_runs WHERE job_id=${id!} AND status='completed') AS finished,
 (SELECT status FROM pegasus_core.jobs WHERE id=${id!}) AS status`;
 if(summary.evidence!==1||summary.memories!==1||summary.completions!==1||
 summary.finished!==1||summary.status!=='completed')throw Error('Side effects duplicated: '+JSON.stringify(summary));
 console.log('R05_ATOMIC_LATE_WORKER_PASSED',JSON.stringify({staleRejected:true,ownerCommitted:true,duplicateRejected:true,...summary}));
}finally{
 if(id){
 await sql`DELETE FROM pegasus_core.memories WHERE metadata->>'jobId'=${id!}`;
 await sql`DELETE FROM pegasus_core.events WHERE entity_id=${id!}`;
 await sql`DELETE FROM pegasus_core.jobs WHERE id=${id!}`;
 }
 await closeDb();
}
