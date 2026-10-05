import {claimNextJob,postgresJobStore,renewLease,closeJobRun,unlockDependents} from '../jobs/repository.js';
import {runJob,type WorkResult} from './runJob.js';
import type {PegasusJob} from '../jobs/stateMachine.js';
export type JobHandler=(job:PegasusJob)=>Promise<WorkResult>;
export type WorkerLoopOptions={workerId:string;handler:JobHandler;leaseSeconds?:number;pollMs?:number;signal?:AbortSignal;onIdle?:()=>void};
const sleep=(ms:number,signal?:AbortSignal)=>new Promise<void>(resolve=>{const t=setTimeout(resolve,ms);signal?.addEventListener('abort',()=>{clearTimeout(t);resolve()},{once:true})});
export async function runWorkerLoop(opts:WorkerLoopOptions){
 const pollMs=opts.pollMs??1000,lease=opts.leaseSeconds??60;
 while(!opts.signal?.aborted){
  const job=await claimNextJob(opts.workerId,lease);
  if(!job){opts.onIdle?.();await sleep(pollMs,opts.signal);continue;}
  await postgresJobStore.recordEvent(job,'job_claimed',{workerId:opts.workerId});
  const heartbeat=setInterval(()=>{void renewLease(job.id,lease)},Math.max(1000,Math.floor(lease*500)));
  let finished:PegasusJob;
  try{finished=await runJob(job,postgresJobStore,()=>opts.handler(job));}
  finally{clearInterval(heartbeat);}
  await closeJobRun(finished!,opts.workerId);
  finished!.leaseExpiresAt=undefined;await postgresJobStore.save(finished!);
  const unlocked=await unlockDependents(finished!);
  if(unlocked)await postgresJobStore.recordEvent(finished!,'dependent_tasks_unlocked',{count:unlocked});
 }
}
