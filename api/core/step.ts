import {claimNextJobForObjective,postgresJobStore,closeJobRun,unlockDependents} from '../../core/work/jobs/repository.js';
import {runJob} from '../../core/work/workers/runJob.js';
import {realAgentWork} from '../../core/runtime/execution/realAgentWork.js';
import {requireCoreAuth,requirePost,enforceRateLimit,parseUuid} from './_security.js';

export default async function handler(req:any,res:any){
 if(!requirePost(req,res)||!enforceRateLimit(req,res,60,60_000)||!requireCoreAuth(req,res))return;
 let stage='parse';
 try{
  const missionId=parseUuid(req.body?.missionId,'missionId');
  stage='claim';
  const job=await claimNextJobForObjective(missionId,'vercel-war-room',60);
  if(!job)return res.status(409).json({error:'No claimable Pegasus job'});
  stage='claim-event';
  await postgresJobStore.recordEvent(job,'job_claimed',{workerId:'vercel-war-room'});
  stage='run-job';
  const finished=await runJob(job,postgresJobStore,()=>realAgentWork(job));
  stage='close-run';
  await closeJobRun(finished,'vercel-war-room');
  stage='save-finished';
  finished.leaseExpiresAt=undefined;
  await postgresJobStore.save(finished);
  stage='unlock-dependents';
  const unlocked=await unlockDependents(finished);
  return res.json({jobId:job.id,agentId:job.agentId,status:finished.status,result:finished.result,error:finished.lastError||null,unlocked});
 }catch(e:any){
  const m=e?.message||String(e);
  return res.status(m.includes('valid UUID')?400:500).json({error:m,stage});
 }
}
