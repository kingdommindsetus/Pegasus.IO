/**
 * Isolated PostgreSQL negative tenancy test. Generates 2 synthetic organizations,
 * verifies a signed founder cookie can read ONLY the configured org,
 * then cleans every fixture. Never uses production or personal records.
 */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {db,closeDb} from '../core/database/client.js';
import {makeSessionCookie} from '../api/core/_security.js';
import founderActivity from '../api/core/founder-activity.js';
import missionHandler from '../api/core/mission.js';
import worldJobs from '../api/core/world-jobs.js';
import worldEvents from '../api/core/world-events.js';

const u=new URL(process.env.DATABASE_URL||'http://invalid');
assert.ok(['postgres:','postgresql:'].includes(u.protocol));
assert.equal(u.hostname,'127.0.0.1');
assert.ok(!u.port||u.port==='5432');
assert.equal(u.pathname,'/pegasus_world_windows_accept_1011');
assert.equal(decodeURIComponent(u.username),'pegasus_windows_accept_role');
const sql=db();
const oldKey=process.env.PEGASUS_CORE_API_SECRET;
const oldScope=process.env.PEGASUS_FOUNDER_ORGANIZATION_ID;
const created:{organizations:string[];projects:string[];objectives:string[];tasks:string[];jobs:string[]}={
 organizations:[],projects:[],objectives:[],tasks:[],jobs:[]
};
let seq=0;
type R={statusCode:number;headers:Record<string,string>;body:any;status:(n:number)=>R;setHeader:(k:string,v:string)=>R;json:(v:any)=>R};
function makeRes():R{
 const r:R={statusCode:200,body:null,headers:{},
  status(n){r.statusCode=n;return r},
  setHeader(k,v){r.headers[k.toLowerCase()]=v;return r},
  json(v){r.body=v;return r}};
 return r;
}
async function call(opts:{cookie?:string;method?:string;crossSite?:boolean;query?:Record<string,string>}={}){
 const req={method:opts.method||'GET',
  headers:{...(opts.cookie?{cookie:opts.cookie}:{}),...(opts.crossSite?{'sec-fetch-site':'cross-site'}:{})},
  query:opts.query||{},socket:{remoteAddress:'127.0.0.'+(30+(seq++))}};
 const res=makeRes();await founderActivity(req,res);return res;
}
async function feed(handler:any,cookie:string,query:Record<string,string>={}){
 const res=makeRes();
 await handler({method:'GET',headers:{cookie},query,socket:{remoteAddress:'127.0.0.'+(150+(seq++))}},res);
 return res;
}
async function mission(action:string,missionId?:string,objective?:string){
 const res=makeRes();
 await missionHandler({method:'POST',headers:{'x-pegasus-core-secret':process.env.PEGASUS_CORE_API_SECRET},body:{action,missionId,objective},socket:{remoteAddress:'127.0.0.'+(100+(seq++))}},res);
 return res;
}
async function fixture(label:string){
 const slug='pegasus-scope-accept-'+randomUUID();
 const [org]=await sql`INSERT INTO pegasus_core.organizations(name,slug) VALUES(${'Synthetic '+label},${slug}) RETURNING id`;
 created.organizations.push(org.id);
 const [project]=await sql`INSERT INTO pegasus_core.projects(organization_id,name,objective) VALUES(${org.id},${'Synthetic Project '+label},'Development scope check only') RETURNING id`;
 created.projects.push(project.id);
 const [objective]=await sql`INSERT INTO pegasus_core.objectives(project_id,title) VALUES(${project.id},'Pegasus 12-Agent War Room Mission') RETURNING id`;
 created.objectives.push(objective.id);
 const [task]=await sql`INSERT INTO pegasus_core.tasks(project_id,objective_id,assigned_agent_id,title,instructions,input)
  VALUES(${project.id},${objective.id},'simon',${'Synthetic Task '+label},'No external actions',${sql.json({draftOnly:true,externalActionsAllowed:false})}) RETURNING id`;
 created.tasks.push(task.id);
 const [job]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,status,attempts,max_attempts,idempotency_key,input,result)
  VALUES(${task.id},'simon','p0_founder_scope_fixture','completed',1,2,${slug},
  ${sql.json({draftOnly:true,secret:'ISOLATED_INPUT_NEVER_LEAK'})},
  ${sql.json({internal:'ISOLATED_RESULT_NEVER_LEAK'})}) RETURNING id`;
 created.jobs.push(job.id);
 await sql`INSERT INTO pegasus_core.job_runs(job_id,attempt,worker_id,status,finished_at) VALUES(${job.id},1,'p0-scope-accept','completed',now())`;
 await sql`INSERT INTO pegasus_core.evidence(project_id,objective_id,task_id,job_id,evidence_type,content)
  VALUES(${project.id},${objective.id},${task.id},${job.id},'synthetic_test',${sql.json({private:'ISOLATED_EVIDENCE_NEVER_LEAK'})})`;
 await sql`INSERT INTO pegasus_core.events(project_id,agent_id,event_type,entity_type,entity_id,payload)
  VALUES(${project.id},'simon','test_job_completed','job',${job.id},${sql.json({private:'ISOLATED_EVENT_NEVER_LEAK'})})`;
 return {organizationId:String(org.id),objectiveId:String(objective.id),jobId:String(job.id)};
}
try{
 const [identity]=await sql`SELECT current_database() db,current_user role`;
 assert.equal(identity.db,'pegasus_world_windows_accept_1011');
 assert.equal(identity.role,'pegasus_windows_accept_role');
 process.env.PEGASUS_CORE_API_SECRET='synthetic-org-scope-test-key-not-a-real-secret';
 const cookie='pegasus_core_session='+makeSessionCookie();
 const a=await fixture('ALPHA'),b=await fixture('BETA');
 process.env.PEGASUS_FOUNDER_ORGANIZATION_ID=a.organizationId;
 const denied=await call();
 assert.equal(denied.statusCode,401);
 const forbidden=await call({cookie,crossSite:true});
 assert.equal(forbidden.statusCode,403);
 const attemptedWrite=await call({cookie,method:'POST'});
 assert.equal(attemptedWrite.statusCode,405);
 const secretHeaderOnly=makeRes();
 await founderActivity({method:'GET',headers:{'x-pegasus-core-secret':process.env.PEGASUS_CORE_API_SECRET},query:{},socket:{remoteAddress:'127.0.0.2'}},secretHeaderOnly);
 assert.equal(secretHeaderOnly.statusCode,401);
 const first=await call({cookie,query:{organizationId:b.organizationId,limit:'9999'}});
 assert.equal(first.statusCode,200);
 assert.equal(first.body.readOnly,true);
 assert.equal(first.body.scope,'configured_founder_organization');
 assert.ok(first.body.records.some((r:any)=>r.jobId===a.jobId));
 assert.ok(!first.body.records.some((r:any)=>r.jobId===b.jobId));
 const all=JSON.stringify(first.body);
 for(const privateMarker of ['ISOLATED_INPUT_NEVER_LEAK','ISOLATED_RESULT_NEVER_LEAK',
  'ISOLATED_EVIDENCE_NEVER_LEAK','ISOLATED_EVENT_NEVER_LEAK'])
  assert.equal(all.includes(privateMarker),false);
 const record=first.body.records.find((r:any)=>r.jobId===a.jobId);
 assert.equal(record.runCount,1);
 assert.equal(record.evidenceCount,1);
 assert.equal(record.eventCount,1);
 const jobsA=await feed(worldJobs,cookie);
 assert.equal(jobsA.statusCode,200);
 assert.ok(jobsA.body.jobs.some((j:any)=>String(j.id)===a.jobId));
 assert.ok(!jobsA.body.jobs.some((j:any)=>String(j.id)===b.jobId));
 const eventsA=await feed(worldEvents,cookie);
 assert.equal(eventsA.statusCode,200);
 assert.ok(eventsA.body.events.some((e:any)=>String(e.entityId)===a.jobId));
 assert.ok(!eventsA.body.events.some((e:any)=>String(e.entityId)===b.jobId));
 // A founder cannot hydrate, inspect or close another company's mission.
 const hiddenMission=await mission('hydrate',b.objectiveId);
 assert.equal(hiddenMission.body.found,false);
 const hiddenStatus=await mission('status',b.objectiveId);
 assert.equal(hiddenStatus.statusCode,404);
 const hiddenClose=await mission('close',b.objectiveId);
 assert.equal(hiddenClose.statusCode,404);
 const visibleMission=await mission('hydrate',a.objectiveId);
 assert.equal(visibleMission.body.found,true);
 assert.equal(String(visibleMission.body.missionId),a.objectiveId);
 // No runnable synthetic jobs are created: active local workers must remain untouched.
 process.env.PEGASUS_FOUNDER_ORGANIZATION_ID=b.organizationId;
 const other=await call({cookie});
 assert.equal(other.statusCode,200);
 assert.ok(other.body.records.some((r:any)=>r.jobId===b.jobId));
 assert.ok(!other.body.records.some((r:any)=>r.jobId===a.jobId));
 const jobsB=await feed(worldJobs,cookie);
 assert.ok(jobsB.body.jobs.some((j:any)=>String(j.id)===b.jobId));
 assert.ok(!jobsB.body.jobs.some((j:any)=>String(j.id)===a.jobId));
 const eventsB=await feed(worldEvents,cookie);
 assert.ok(eventsB.body.events.some((e:any)=>String(e.entityId)===b.jobId));
 assert.ok(!eventsB.body.events.some((e:any)=>String(e.entityId)===a.jobId));
 delete process.env.PEGASUS_FOUNDER_ORGANIZATION_ID;
 const unconfigured=await call({cookie});
 assert.equal(unconfigured.statusCode,503);
 console.log('PEGASUS_REAL_POSTGRES_TENANT_NEGATIVE_PASS',JSON.stringify({
  database:identity.db,syntheticOrganizations:2,founderCookieRequired:true,
  noApiSecretBypass:true,otherTenantHidden:true,queryOverrideIgnored:true,
  privatePayloadsWithheld:true,crossOriginDenied:true,writeDenied:true,
  missingScopeDenied:true,missionReadAndCloseIsolated:true,
  worldJobsAndEventsIsolated:true,readOnly:true,productionChanges:false
 }));
}finally{
 // Remove synthetic evidence first, then associated history and rows.
 for(const id of created.jobs){
  await sql`DELETE FROM pegasus_core.evidence WHERE job_id=${id}`;
  await sql`DELETE FROM pegasus_core.events WHERE entity_type='job' AND entity_id=${id}`;
  await sql`DELETE FROM pegasus_core.job_runs WHERE job_id=${id}`;
  await sql`DELETE FROM pegasus_core.jobs WHERE id=${id}`;
 }
 for(const id of created.tasks)await sql`DELETE FROM pegasus_core.task_dependencies WHERE task_id=${id} OR depends_on_task_id=${id}`;
 for(const id of created.tasks)await sql`DELETE FROM pegasus_core.tasks WHERE id=${id}`;
 for(const id of created.objectives)await sql`DELETE FROM pegasus_core.objectives WHERE id=${id}`;
 for(const id of created.projects)await sql`DELETE FROM pegasus_core.projects WHERE id=${id}`;
 for(const id of created.organizations)await sql`DELETE FROM pegasus_core.organizations WHERE id=${id}`;
 await closeDb();
 if(oldKey===undefined)delete process.env.PEGASUS_CORE_API_SECRET;
 else process.env.PEGASUS_CORE_API_SECRET=oldKey;
 if(oldScope===undefined)delete process.env.PEGASUS_FOUNDER_ORGANIZATION_ID;
 else process.env.PEGASUS_FOUNDER_ORGANIZATION_ID=oldScope;
}
