import {db,closeDb} from '../core/database/client.js';
const scope='cbe5f353-25de-4daa-a69e-09b326299fea';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_windows_accept_1011'||
 decodeURIComponent(u.username)!=='pegasus_windows_accept_role')throw Error('Not isolated Windows DB');
const sql=db();let id:string|undefined;
try{
 const [t]=await sql`SELECT id FROM pegasus_core.tasks WHERE objective_id=${scope} LIMIT 1`;
 if(!t)throw Error('Missing test task');
 const [j]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,status,input,
 max_attempts,idempotency_key) VALUES(${t.id},'simon','search_company_memory','queued',
 ${sql.json({draftOnly:true,externalActionsAllowed:false})},3,${'r05-live-'+Date.now()}) RETURNING id`;
 id=j.id;
 let passed=false;
 for(let i=0;i<45;i++){
  await new Promise(resolve=>setTimeout(resolve,1000));
  const [row]=await sql`SELECT status FROM pegasus_core.jobs WHERE id=${id!}`;
  if(row.status==='completed'){passed=true;break;}
  if(row.status==='failed')throw Error('Worker failed test job');
 }
 if(!passed)throw Error('Development worker did not complete safe test job in 45 seconds');
 const [s]=await sql`SELECT
 (SELECT count(*)::int FROM pegasus_core.evidence WHERE job_id=${id!}) evidence,
 (SELECT count(*)::int FROM pegasus_core.memories WHERE metadata->>'jobId'=${id!}) memories,
 (SELECT count(*)::int FROM pegasus_core.events WHERE entity_id=${id!} AND event_type='job_completed') events,
 (SELECT count(*)::int FROM pegasus_core.job_runs WHERE job_id=${id!} AND status='completed') runs`;
 if(s.evidence!==1||s.memories!==1||s.events!==1||s.runs!==1)throw Error('Live path duplicate or missing persistence '+JSON.stringify(s));
 console.log('R05_LIVE_ISOLATED_WORKER_PASSED',JSON.stringify(s));
}finally{
 if(id){
  await sql`DELETE FROM pegasus_core.memories WHERE metadata->>'jobId'=${id!}`;
  await sql`DELETE FROM pegasus_core.events WHERE entity_id=${id!}`;
  await sql`DELETE FROM pegasus_core.jobs WHERE id=${id!}`;
 }
 await closeDb();
}
