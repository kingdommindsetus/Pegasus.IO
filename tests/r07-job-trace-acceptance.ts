import assert from 'node:assert/strict';
import {db,closeDb} from '../core/database/client.js';
import {traceState,traceViewExpired} from '../core/runtime/jobTraceDevelopment.js';
const OBJECTIVE='cbe5f353-25de-4daa-a69e-09b326299fea';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_windows_accept_1011'||decodeURIComponent(u.username)!=='pegasus_windows_accept_role')throw Error('Isolated development database required');
const sql=db();
let ids:string[]=[];
try{
 const [t]=await sql`SELECT id FROM pegasus_core.tasks WHERE objective_id=${OBJECTIVE} LIMIT 1`;
 assert.ok(t?.id);
 const scenarios=[
  {name:'completed',status:'completed',attempts:1,expiry:false,runs:['completed']},
  {name:'failed',status:'failed',attempts:3,expiry:false,runs:['failed']},
  {name:'interrupted',status:'running',attempts:1,expiry:true,runs:['running']},
  {name:'retried',status:'retrying',attempts:1,expiry:false,runs:['failed']}
 ] as const;
 for(const s of scenarios){
  const key='r07-'+s.name+'-'+Date.now();
  const [job]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,status,attempts,max_attempts,lease_expires_at,input,idempotency_key)
    VALUES(${t.id},'simon','r07_trace_fixture',${s.status}::pegasus_core.job_status,${s.attempts},3,
     CASE WHEN ${s.expiry} THEN now()-interval '2 minutes' ELSE NULL END,
     ${sql.json({draftOnly:true,externalActionsAllowed:false})},${key}) RETURNING id`;
  const id=String(job.id);ids.push(id);
  const [run]=await sql`INSERT INTO pegasus_core.job_runs(job_id,attempt,worker_id,status,finished_at)
    VALUES(${id},${s.attempts},'r07-test',${s.runs[0]}::pegasus_core.job_status,
     CASE WHEN ${s.expiry} THEN NULL ELSE now() END) RETURNING id`;
  const [event]=await sql`INSERT INTO pegasus_core.events(agent_id,event_type,entity_type,entity_id,payload)
    VALUES('simon',${'r07_'+s.name},'job',${id},${sql.json({fixture:true})}) RETURNING id`;
  const [evidence]=await sql`INSERT INTO pegasus_core.evidence(task_id,job_id,evidence_type,content)
    VALUES(${t.id},${id},'r07_test',${sql.json({fixture:true})}) RETURNING id`;
  const [details]=await sql`SELECT j.status,j.lease_expires_at,r.finished_at,r.status AS run_status
    FROM pegasus_core.jobs j JOIN pegasus_core.job_runs r ON r.job_id=j.id WHERE j.id=${id}`;
  const state=traceState(details.status,[{finishedAt:details.finished_at?.toISOString?.()||null,status:details.run_status}],details.lease_expires_at?.toISOString?.()||null);
  assert.equal(state,s.name==='retried'?'retrying':s.name);
  assert.ok(run.id&&event.id&&evidence.id);
  console.log('R07_SCENARIO_PASS',s.name,id,'run='+run.id,'event='+event.id,'evidence='+evidence.id);
 }
 const token=(await import('node:fs')).readFileSync('C:/Users/info/PegasusVoiceEngine/acceptance-isolated/.jarvis-local-ui-token','utf8').trim();
 const response=await fetch('http://127.0.0.1:4320/api/dev/job-trace',{headers:{Authorization:'Bearer '+token}});
 assert.equal(response.status,200);
 const api=await response.json() as {status:string;records:{jobId:string;timelineState:string;runs:{id:string}[];events:{id:string}[];evidence:{id:string}[]}[]};
 assert.equal(api.status,'live');
 for(const [i,id] of ids.entries()){
  const trace=api.records.find(r=>r.jobId===id);
  assert.ok(trace,'Test fixture absent from read-only API');
  assert.equal(trace.timelineState,scenarios[i].name==='retried'?'retrying':scenarios[i].name);
  assert.ok(trace.runs.length===1&&trace.events.length===1&&trace.evidence.length===1);
  assert.ok(trace.runs[0].id&&trace.events[0].id&&trace.evidence[0].id);
 }
 console.log('R07_HTTP_EVIDENCE_CROSSCHECK_PASSED',ids.length,'job histories with linked IDs'); assert.equal(traceViewExpired(new Date(Date.now()-61000).toISOString()),true);
 assert.equal(traceViewExpired(new Date().toISOString()),false);
 console.log('R07_TRACE_FIXTURE_PASS scenarios=4 staleGuard=true');
}finally{
 for(const id of ids){
  await sql`DELETE FROM pegasus_core.evidence WHERE job_id=${id}`;
  await sql`DELETE FROM pegasus_core.events WHERE entity_type='job' AND entity_id=${id}`;
  await sql`DELETE FROM pegasus_core.jobs WHERE id=${id}`;
 }
 await closeDb();
}
