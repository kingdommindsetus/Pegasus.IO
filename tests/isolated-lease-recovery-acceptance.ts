import {db,closeDb} from '../core/database/client.js';
import {recoverExpiredIsolatedLeases} from '../core/work/jobs/isolatedLeaseRecovery.js';
const scope='cbe5f353-25de-4daa-a69e-09b326299fea';
const url=new URL(process.env.DATABASE_URL||'http://invalid');
if(url.hostname!=='127.0.0.1'||url.pathname!=='/pegasus_world_windows_accept_1011'||
 decodeURIComponent(url.username)!=='pegasus_windows_accept_role')throw Error('Refusing non-isolated DB');
const sql=db();let id:string|undefined;
try{
 const [task]=await sql`SELECT t.id FROM pegasus_core.tasks t WHERE t.objective_id=${scope} LIMIT 1`;
 if(!task)throw Error('Test objective task missing');
 const rows=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,status,attempts,max_attempts,
  lease_expires_at,input,idempotency_key)
 VALUES(${task.id},'simon','search_company_memory','running',1,3,now()-interval '3 minutes',
 ${sql.json({draftOnly:true,externalActionsAllowed:false})},${'r04-acceptance-'+Date.now()})
 RETURNING id`;id=rows[0].id;
 await sql`INSERT INTO pegasus_core.job_runs(job_id,attempt,worker_id,status) VALUES(${id!},1,'r04-test','running')`;
 const recovered=await recoverExpiredIsolatedLeases(scope);
 const [job]=await sql`SELECT status,attempts,lease_expires_at FROM pegasus_core.jobs WHERE id=${id!}`;
 const [run]=await sql`SELECT status,finished_at FROM pegasus_core.job_runs WHERE job_id=${id!}`;
 const [evt]=await sql`SELECT count(*)::int AS n FROM pegasus_core.events WHERE entity_id=${id!} AND event_type='isolated_lease_recovered'`;
 if(!recovered.includes(id)||job.status!=='retrying'||Number(job.attempts)!==1||
  job.lease_expires_at!==null||run.status!=='failed'||!run.finished_at||evt.n!==1)
  throw Error('Recovery evidence mismatch');
 const again=await recoverExpiredIsolatedLeases(scope);
 if(again.includes(id))throw Error('Recovered twice');
 console.log('R04_LEASE_RECLAIM_PASSED',JSON.stringify({status:job.status,attempts:job.attempts,eventCount:evt.n,oldRunClosed:true,secondRecovery:false}));
}finally{
 if(id){await sql`DELETE FROM pegasus_core.events WHERE entity_id=${id!} AND event_type='isolated_lease_recovered'`;
 await sql`DELETE FROM pegasus_core.jobs WHERE id=${id!}`;}
 await closeDb();
}
