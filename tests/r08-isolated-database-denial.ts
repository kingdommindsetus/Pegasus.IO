import assert from 'node:assert/strict';
import {db,closeDb} from '../core/database/client.js';
import {claimIsolatedDraftJob} from '../core/work/jobs/isolatedAtomicExecution.js';
const objective='cbe5f353-25de-4daa-a69e-09b326299fea';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_windows_accept_1011'||decodeURIComponent(u.username)!=='pegasus_windows_accept_role')
 throw Error('Windows acceptance database only');
const sql=db();
let id:string|undefined;
try{
 const [task]=await sql`SELECT id FROM pegasus_core.tasks WHERE objective_id=${objective} LIMIT 1`;
 assert.ok(task);
 const key='r08-denied-'+Date.now();
 const [job]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,status,attempts,max_attempts,priority,input,idempotency_key,available_at)
 VALUES(${task.id},'simon','search_company_memory','queued',0,3,9999,
  ${sql.json({draftOnly:true,externalActionsAllowed:false,send:true})},${key},now()-interval '5 seconds')
 RETURNING id`;id=job.id;
 await assert.rejects(claimIsolatedDraftJob(objective,'isolated-worker','search_company_memory',60),/Isolated execution denied/);
 const [after]=await sql`SELECT status,attempts,lease_expires_at FROM pegasus_core.jobs WHERE id=${id!}`;
 const [runs]=await sql`SELECT count(*)::int n FROM pegasus_core.job_runs WHERE job_id=${id!}`;
 assert.equal(after.status,'queued');
 assert.equal(Number(after.attempts),0);
 assert.equal(after.lease_expires_at,null);
 assert.equal(runs.n,0);
 console.log('R08_DB_NEGATIVE_CLAIM_PASSED',JSON.stringify({status:after.status,attempts:after.attempts,runCount:runs.n,liveActions:0}));
}finally{
 if(id)await sql`DELETE FROM pegasus_core.jobs WHERE id=${id!}`;
 await closeDb();
}
