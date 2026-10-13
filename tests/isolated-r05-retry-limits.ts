import {db,closeDb} from '../core/database/client.js';
import {recoverExpiredIsolatedLeases} from '../core/work/jobs/isolatedLeaseRecovery.js';
const scope='cbe5f353-25de-4daa-a69e-09b326299fea';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_windows_accept_1011'||
decodeURIComponent(u.username)!=='pegasus_windows_accept_role')throw Error('Isolated database only');
const sql=db();let id:string|undefined;
try{
 const [task]=await sql`SELECT id FROM pegasus_core.tasks WHERE objective_id=${scope} LIMIT 1`;
 if(!task)throw Error('Missing test task');
 const [j]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,status,attempts,max_attempts,
 lease_expires_at,input,idempotency_key)
 VALUES(${task.id},'simon','search_company_memory','running',3,3,now()-interval '4 minutes',
 ${sql.json({draftOnly:true,externalActionsAllowed:false})},${'r05-exhausted-'+Date.now()})
 RETURNING id`;id=j.id;
 await sql`INSERT INTO pegasus_core.job_runs(job_id,attempt,worker_id,status)
 VALUES(${id!},3,'r05-exhausted','running')`;
 const recovered=await recoverExpiredIsolatedLeases(scope);
 const [state]=await sql`SELECT status,attempts FROM pegasus_core.jobs WHERE id=${id!}`;
 const [event]=await sql`SELECT count(*)::int AS n FROM pegasus_core.events WHERE entity_id=${id!} AND event_type='isolated_lease_recovered'`;
 if(!recovered.includes(id!)||state.status!=='failed'||Number(state.attempts)!==3||event.n!==1)
 throw Error('Retry-exhausted job was incorrectly rescheduled');
 const again=await recoverExpiredIsolatedLeases(scope);
 if(again.includes(id!))throw Error('Repeated exhaustion recovery');
 console.log('R05_RETRY_LIMIT_PASSED',JSON.stringify({state:state.status,attempts:state.attempts,events:event.n,repeat:false}));
}finally{
 if(id){await sql`DELETE FROM pegasus_core.events WHERE entity_id=${id!}`;await sql`DELETE FROM pegasus_core.jobs WHERE id=${id!}`;}
 await closeDb();
}
