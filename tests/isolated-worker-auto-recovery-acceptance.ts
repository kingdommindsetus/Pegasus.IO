import {db,closeDb} from '../core/database/client.js';
const scope='cbe5f353-25de-4daa-a69e-09b326299fea';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_windows_accept_1011'||
 decodeURIComponent(u.username)!=='pegasus_windows_accept_role')throw Error('Development DB only');
const sql=db();let id:string|undefined;
try{
 const [t]=await sql`SELECT id FROM pegasus_core.tasks WHERE objective_id=${scope} LIMIT 1`;
 if(!t)throw Error('No test task');
 const [j]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,status,attempts,max_attempts,lease_expires_at,input,idempotency_key)
 VALUES(${t.id},'simon','search_company_memory','claimed',1,3,now()-interval '2 minutes',
 ${sql.json({draftOnly:true,externalActionsAllowed:false})},${'r04-worker-'+Date.now()})
 RETURNING id`;id=j.id;
 await sql`INSERT INTO pegasus_core.job_runs(job_id,attempt,worker_id,status) VALUES(${id!},1,'r04-worker-test','claimed')`;
 let pass=false;
 for(let i=0;i<30;i++){
  await new Promise(r=>setTimeout(r,1000));
  const [row]=await sql`SELECT status,attempts FROM pegasus_core.jobs WHERE id=${id!}`;
  const [ev]=await sql`SELECT count(*)::int n FROM pegasus_core.events WHERE entity_id=${id!} AND event_type='isolated_lease_recovered'`;
  if(row.status==='retrying'&&Number(row.attempts)===1&&ev.n===1){pass=true;break;}
 }
 if(!pass)throw Error('Workers did not auto-recover expired claim in 30 seconds');
 const [run]=await sql`SELECT finished_at,status FROM pegasus_core.job_runs WHERE job_id=${id!}`;
 if(!run.finished_at||run.status!=='failed')throw Error('Old job run unclosed');
 console.log('R04_AUTONOMOUS_WORKER_LEASE_RECOVERY_PASSED',JSON.stringify({job:id,status:'retrying',eventCount:1,oldRunClosed:true}));
}finally{
 if(id){await sql`DELETE FROM pegasus_core.events WHERE entity_id=${id}`;await sql`DELETE FROM pegasus_core.jobs WHERE id=${id}`;}
 await closeDb();
}
