import {db,closeDb} from '../core/database/client.js';
import {claimNextJobForObjective,postgresJobStore,closeJobRun,unlockDependents} from '../core/work/jobs/repository.js';
import {runJob} from '../core/work/workers/runJob.js';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_accept_1011')throw Error('Isolated database required');
const sql=db();
const id='bac1d059-0810-486b-94c8-48b57937b6ea';
try {
 const [ident]=await sql`SELECT current_database() name,current_user username`;
 if(ident.name!=='pegasus_world_accept_1011'||ident.username!=='pegasus_world_test_1011')throw Error('Wrong DB role');
 const [candidate]=await sql`SELECT j.id,j.agent_id,j.status,j.input,t.objective_id FROM pegasus_core.jobs j JOIN pegasus_core.tasks t ON t.id=j.task_id WHERE j.id=${id}`;
 if(!candidate||candidate.agent_id!=='simon'||candidate.status!=='queued'||candidate.input.draftOnly!==true)throw Error('Unexpected job state');
 const [approval]=await sql`SELECT status,action_type,decided_by FROM pegasus_core.approvals WHERE id=${candidate.input.sourceApprovalId}`;
 if(approval?.status!=='approved'||approval?.action_type!=='founder_review_draft'||!approval.decided_by)throw Error('Missing approval');
 const job=await claimNextJobForObjective(candidate.objective_id,'isolated-simon-executive',60);
 if(!job||job.id!==id)throw Error('Wrong job claimed');
 await postgresJobStore.recordEvent(job,'job_claimed',{workerId:'isolated-simon-executive'});
 const result=await runJob(job,postgresJobStore,async()=>({status:'completed',output:{reviewType:'internal_draft_inspection',decision:'inspected_for_internal_review',sourceApprovalId:candidate.input.sourceApprovalId,sourceJobId:candidate.input.sourceJobId,externalActionsExecuted:false,notes:'Deterministic acceptance inspection, not autonomous assessment'},evidence:[{source:'approval',id:candidate.input.sourceApprovalId,status:'approved',testOnly:true}]}));
 await closeJobRun(result,'isolated-simon-executive');
 result.leaseExpiresAt=undefined;await postgresJobStore.save(result);
 await unlockDependents(result);
 const [stored]=await sql`SELECT status,attempts,result FROM pegasus_core.jobs WHERE id=${id}`;
 const events=await sql`SELECT event_type FROM pegasus_core.events WHERE entity_id=${id} ORDER BY id`;
 const [ev]=await sql`SELECT count(*)::int n FROM pegasus_core.evidence WHERE job_id=${id}`;
 if(stored.status!=='completed'||stored.attempts!==1||!stored.result||ev.n<1||!events.some(x=>x.event_type==='job_completed'))throw Error('Core persistence failed');
 console.log('SIMON_CLOSE_PASS',JSON.stringify({jobId:id,status:stored.status,attempts:stored.attempts,events:events.map(x=>x.event_type),evidenceCount:ev.n,output:stored.result}));
} finally {await closeDb()}
