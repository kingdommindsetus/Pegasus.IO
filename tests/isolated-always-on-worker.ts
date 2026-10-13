import {db,closeDb} from '../core/database/client.js';
import {recoverExpiredIsolatedLeases} from '../core/work/jobs/isolatedLeaseRecovery.js';
import {unlockDependents} from '../core/work/jobs/repository.js';
import {claimIsolatedDraftJob,startOwnedIsolatedRun,finishOwnedIsolatedRun} from '../core/work/jobs/isolatedAtomicExecution.js';
const url=new URL(process.env.DATABASE_URL||'http://invalid');
if(url.hostname!=='127.0.0.1'||url.pathname!=='/pegasus_world_windows_accept_1011')throw Error('Only isolated database is permitted');
const sql=db();
const objective=process.env.PEGASUS_TEST_OBJECTIVE_ID||'';
if(!/^[a-f0-9-]{36}$/i.test(objective))throw Error('Missing scoped test objective');
const pause=(ms:number)=>new Promise(r=>setTimeout(r,ms));
let shuttingDown=false;
process.on('SIGINT',()=>{shuttingDown=true});process.on('SIGTERM',()=>{shuttingDown=true});
try{
 const [who]=await sql`SELECT current_database() db,current_user role`;
 if(who.db!=='pegasus_world_windows_accept_1011'||who.role!=='pegasus_windows_accept_role')throw Error('Role mismatch');
 console.log('ISOLATED_WORKER_READY',objective);
 while(!shuttingDown){
  try{
   await recoverExpiredIsolatedLeases(objective);
   const job=await claimIsolatedDraftJob(objective,'isolated-worker','search_company_memory',60);
   if(job){
      const owned=await startOwnedIsolatedRun(objective,job.id,'isolated-worker');
      if(!owned){console.log('OWNERSHIP_LOST',job.id);continue;}
      const output={mode:'draft_only',review:'Internal inspection evidence checkpoint',externalActionsExecuted:false};
      const committed=await finishOwnedIsolatedRun(objective,owned,output,[{source:'local_isolated_worker',safe:true}]);
      if(committed){await unlockDependents({...job,status:'completed'});console.log('JOB_COMPLETE',job.id,'completed');}
      else console.log('STALE_WORKER_REJECTED',job.id);
   }
  }catch(e){console.log('WORKER_ERROR',e instanceof Error?e.message:'unknown')}
  await pause(5000);
 }
}finally{await closeDb()}
