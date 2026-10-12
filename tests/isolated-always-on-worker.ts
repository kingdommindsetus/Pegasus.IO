import {db,closeDb} from '../core/database/client.js';
import {claimNextJobForObjective,postgresJobStore,closeJobRun,unlockDependents} from '../core/work/jobs/repository.js';
import {runJob} from '../core/work/workers/runJob.js';
const url=new URL(process.env.DATABASE_URL||'http://invalid');
if(url.hostname!=='127.0.0.1'||url.pathname!=='/pegasus_world_accept_1011')throw Error('Only isolated database is permitted');
const sql=db();
const objective=process.env.PEGASUS_TEST_OBJECTIVE_ID||'';
if(!/^[a-f0-9-]{36}$/i.test(objective))throw Error('Missing scoped test objective');
const pause=(ms:number)=>new Promise(r=>setTimeout(r,ms));
let shuttingDown=false;
process.on('SIGINT',()=>{shuttingDown=true});process.on('SIGTERM',()=>{shuttingDown=true});
try{
 const [who]=await sql`SELECT current_database() db,current_user role`;
 if(who.db!=='pegasus_world_accept_1011'||who.role!=='pegasus_world_test_1011')throw Error('Role mismatch');
 console.log('ISOLATED_WORKER_READY',objective);
 while(!shuttingDown){
  try{
   const [target]=await sql`SELECT j.id,j.agent_id,j.skill_key,j.input FROM pegasus_core.jobs j JOIN pegasus_core.tasks t ON t.id=j.task_id WHERE t.objective_id=${objective} AND j.status='queued' ORDER BY j.created_at LIMIT 1`;
   if(target){
    if(target.agent_id!=='simon'||target.skill_key!=='search_company_memory'||target.input?.draftOnly!==true||target.input?.externalActionsAllowed===true){
     console.log('UNSAFE_JOB_LEFT_UNTOUCHED',target.id);
    }else{
     const job=await claimNextJobForObjective(objective,'isolated-worker',60);
     if(job&&job.id===target.id){
      await postgresJobStore.recordEvent(job,'job_claimed',{workerId:'isolated-worker'});
      const finished=await runJob(job,postgresJobStore,async()=>({status:'completed',output:{mode:'draft_only',review:'Internal inspection evidence checkpoint',externalActionsExecuted:false},evidence:[{source:'local_isolated_worker',safe:true}]}));
      await closeJobRun(finished,'isolated-worker');finished.leaseExpiresAt=undefined;await postgresJobStore.save(finished);await unlockDependents(finished);
      console.log('JOB_COMPLETE',finished.id,finished.status);
     }
    }
   }
  }catch(e){console.log('WORKER_ERROR',e instanceof Error?e.message:'unknown')}
  await pause(5000);
 }
}finally{await closeDb()}
