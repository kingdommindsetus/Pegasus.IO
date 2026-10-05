import {assertJobTransition,nextRetryDelayMs,type PegasusJob} from '../jobs/stateMachine.js';

export type WorkResult={status:'completed'|'waiting_approval'|'denied';output?:Record<string,unknown>;evidence?:unknown[]};
export interface JobStore {
 save(job:PegasusJob):Promise<void>;
 recordEvent(job:PegasusJob,event:string,payload?:unknown):Promise<void>;
 recordEvidence(job:PegasusJob,evidence:unknown[]):Promise<void>;
 writeMemory(job:PegasusJob,result:Record<string,unknown>):Promise<void>;
}

export async function runJob(job:PegasusJob,store:JobStore,work:()=>Promise<WorkResult>,now=Date.now()){
 assertJobTransition(job.status,'running'); job.status='running'; job.attempts+=1; await store.save(job);
 try{
  const result=await work();
  if(result.status==='waiting_approval'){assertJobTransition(job.status,'waiting_approval');job.status='waiting_approval';await store.save(job);await store.recordEvent(job,'approval_required');return job;}
  if(result.status==='denied'){job.lastError='Agent skill denied';assertJobTransition(job.status,'failed');job.status='failed';job.leaseExpiresAt=undefined;await store.save(job);await store.recordEvent(job,'job_denied',{error:job.lastError});return job;}
  if(result.evidence?.length)await store.recordEvidence(job,result.evidence);
  if(result.output)await store.writeMemory(job,result.output);
  assertJobTransition(job.status,'completed');job.status='completed';job.result=result.output;job.lastError=undefined;job.leaseExpiresAt=undefined;await store.save(job);await store.recordEvent(job,'job_completed',result.output);return job;
 }catch(error){
  job.lastError=error instanceof Error?error.message:String(error);
  const retry=job.attempts<job.maxAttempts;
  assertJobTransition(job.status,retry?'retrying':'failed');job.status=retry?'retrying':'failed';
  if(retry){job.availableAt=new Date(now+nextRetryDelayMs(job.attempts)).toISOString();job.leaseExpiresAt=undefined;}else job.leaseExpiresAt=undefined;
  await store.save(job);await store.recordEvent(job,retry?'job_retrying':'job_failed',{error:job.lastError});return job;
 }
}