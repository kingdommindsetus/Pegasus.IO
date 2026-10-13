import {db,closeDb} from '../core/database/client.js';
import {claimNextJobForObjective} from '../core/work/jobs/repository.js';
import {fencedIsolatedJobUpdate} from '../core/work/jobs/isolatedClaimFencing.js';
const scope='cbe5f353-25de-4daa-a69e-09b326299fea';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_windows_accept_1011'||
decodeURIComponent(u.username)!=='pegasus_windows_accept_role')throw Error('Isolated test DB required');
const sql=db();let id:string|undefined;
try{
 const [t]=await sql`SELECT id FROM pegasus_core.tasks WHERE objective_id=${scope} LIMIT 1`;
 if(!t)throw Error('No test task');
 const [j]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,status,attempts,max_attempts,input,idempotency_key)
 VALUES(${t.id},'marie','r05_synthetic_no_external','queued',0,3,
 ${sql.json({draftOnly:true,externalActionsAllowed:false})},${'r05-'+Date.now()})
 RETURNING id`;id=j.id;
 const attempts=await Promise.all(Array.from({length:8},(_,i)=>claimNextJobForObjective(scope,'r05-worker-'+i,60)));
 const winners=attempts.filter(x=>x?.id===id);
 if(winners.length!==1)throw Error('Concurrent claim count is '+winners.length);
 const [claimed]=await sql`SELECT status,lease_expires_at::text AS lease_token FROM pegasus_core.jobs WHERE id=${id!}`;
 const [run]=await sql`SELECT id FROM pegasus_core.job_runs WHERE job_id=${id!} AND finished_at IS NULL`;
 if(claimed.status!=='claimed'||!run)throw Error('Claim state incorrect');
 const lease=String(claimed.lease_token);
 const valid=await fencedIsolatedJobUpdate(scope,id!,run.id,lease,'running');
 if(!valid)throw Error('Valid owner was rejected');
 await sql`UPDATE pegasus_core.jobs SET lease_expires_at=now()-interval '1 second' WHERE id=${id!}`;
 const stale=await fencedIsolatedJobUpdate(scope,id!,run.id,lease,'completed');
 if(stale)throw Error('Stale owner overwrote a job');
 const [state]=await sql`SELECT status FROM pegasus_core.jobs WHERE id=${id!}`;
 if(state.status!=='running')throw Error('Stale owner mutated state');
 console.log('R05_CONCURRENT_CLAIM_AND_FENCE_PASSED',JSON.stringify({competingWorkers:8,successfulClaims:1,legitimateWrite:true,expiredLeaseWriteRejected:true}));
}finally{
 if(id)await sql`DELETE FROM pegasus_core.jobs WHERE id=${id!}`;
 await closeDb();
}
