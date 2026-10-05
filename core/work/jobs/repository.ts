import {db} from '../../database/client.js';
import type {PegasusJob,JobStatus} from './stateMachine.js';

const map=(r:any):PegasusJob=>({id:r.id,taskId:r.task_id||undefined,agentId:r.agent_id,skillKey:r.skill_key||'',status:r.status as JobStatus,attempts:r.attempts,maxAttempts:r.max_attempts,input:r.input||{},result:r.result||undefined,lastError:r.last_error||undefined,availableAt:r.available_at?.toISOString?.()||r.available_at||undefined,leaseExpiresAt:r.lease_expires_at?.toISOString?.()||r.lease_expires_at||undefined});

export async function claimNextJob(workerId:string,leaseSeconds=60):Promise<PegasusJob|null>{
 const sql=db();
 const rows=await sql.begin(async tx=>{
  const picked=await tx.unsafe("SELECT * FROM pegasus_core.jobs WHERE status IN ('queued','retrying') AND available_at<=now() AND (lease_expires_at IS NULL OR lease_expires_at<=now()) ORDER BY priority DESC,available_at,id FOR UPDATE SKIP LOCKED LIMIT 1");
  if(!picked.length)return [];
  const id=picked[0].id;
  const updated=await tx`UPDATE pegasus_core.jobs SET status='claimed',lease_expires_at=now()+(${leaseSeconds}*interval '1 second'),updated_at=now() WHERE id=${id} RETURNING *`;
  await tx`INSERT INTO pegasus_core.job_runs(job_id,attempt,worker_id,status) VALUES(${id},${Number(updated[0].attempts)+1},${workerId},'claimed')`;
  return updated;
 });
 return rows.length?map(rows[0]):null;
}
export async function claimNextJobForObjective(objectiveId:string,workerId:string,leaseSeconds=60):Promise<PegasusJob|null>{
 const sql=db();
 const rows=await sql.begin(async tx=>{
  const picked=await tx`SELECT j.* FROM pegasus_core.jobs j JOIN pegasus_core.tasks t ON t.id=j.task_id WHERE t.objective_id=${objectiveId} AND j.status IN ('queued','retrying') AND j.available_at<=now() AND (j.lease_expires_at IS NULL OR j.lease_expires_at<=now()) ORDER BY j.priority DESC,j.available_at,j.id FOR UPDATE OF j SKIP LOCKED LIMIT 1`;
  if(!picked.length)return [];
  const id=picked[0].id;
  const updated=await tx`UPDATE pegasus_core.jobs SET status='claimed',lease_expires_at=now()+(${leaseSeconds}*interval '1 second'),updated_at=now() WHERE id=${id} RETURNING *`;
  await tx`INSERT INTO pegasus_core.job_runs(job_id,attempt,worker_id,status) VALUES(${id},${Number(updated[0].attempts)+1},${workerId},'claimed')`;
  return updated;
 });
 return rows.length?map(rows[0]):null;
}
export async function saveJob(job:PegasusJob){
 const sql=db();
 await sql`UPDATE pegasus_core.jobs SET status=${job.status},attempts=${job.attempts},result=${job.result ? sql.json(job.result as any) : null},last_error=${job.lastError||null},available_at=${job.availableAt||new Date().toISOString()},lease_expires_at=${job.leaseExpiresAt||null},updated_at=now() WHERE id=${job.id}`;
}
export async function recordJobEvent(job:PegasusJob,event:string,payload:unknown={}){
 const sql=db(); await sql`INSERT INTO pegasus_core.events(agent_id,event_type,entity_type,entity_id,payload) VALUES(${job.agentId},${event},'job',${job.id},${sql.json(payload as any)})`;
}
export async function recordJobEvidence(job:PegasusJob,evidence:unknown[]){
 const sql=db(); if(!job.taskId)return;
 for(const item of evidence)await sql`INSERT INTO pegasus_core.evidence(task_id,job_id,evidence_type,content) VALUES(${job.taskId},${job.id},'agent_result',${sql.json(item as any)})`;
}
export async function writeJobMemory(job:PegasusJob,result:Record<string,unknown>){
 const sql=db(); if(!job.taskId)throw Error('Durable mission memory requires taskId'); await sql`INSERT INTO pegasus_core.memories(scope,scope_id,agent_id,project_id,memory_kind,memory_partition,subject,content,source_type,authority,metadata) SELECT 'project',t.project_id,${job.agentId},t.project_id,'handoff','mission_run_memory',${'Agent '+job.agentId+' mission handoff'},${JSON.stringify(result)},'agent_execution','agent_generated',jsonb_build_object('jobId',${job.id}::text,'taskId',${job.taskId}::text,'objectiveId',t.objective_id::text) FROM pegasus_core.tasks t WHERE t.id=${job.taskId}`;
}
export const postgresJobStore={save:saveJob,recordEvent:recordJobEvent,recordEvidence:recordJobEvidence,writeMemory:writeJobMemory};
export async function renewLease(jobId:string,leaseSeconds=60){const sql=db();const rows=await sql`UPDATE pegasus_core.jobs SET lease_expires_at=now()+(${leaseSeconds}*interval '1 second'),updated_at=now() WHERE id=${jobId} AND status='running' RETURNING id`;return rows.length===1;}
export async function closeJobRun(job:PegasusJob,workerId:string){const sql=db();await sql`UPDATE pegasus_core.job_runs SET status=${job.status},finished_at=now(),error=${job.lastError||null},checkpoint=${sql.json({result:job.result||null} as any)} WHERE id=(SELECT id FROM pegasus_core.job_runs WHERE job_id=${job.id} AND worker_id=${workerId} AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1)`;}
export async function unlockDependents(job:PegasusJob){const sql=db();if(job.status!=='completed'||!job.taskId)return 0;const taskId=job.taskId;return sql.begin(async tx=>{await tx`UPDATE pegasus_core.tasks SET status='completed',updated_at=now() WHERE id=${taskId}`;const ready=await tx`SELECT t.id,t.assigned_agent_id,t.priority,t.input FROM pegasus_core.tasks t WHERE t.status='queued' AND EXISTS(SELECT 1 FROM pegasus_core.task_dependencies d WHERE d.task_id=t.id AND d.depends_on_task_id=${taskId}) AND NOT EXISTS(SELECT 1 FROM pegasus_core.task_dependencies d JOIN pegasus_core.tasks dep ON dep.id=d.depends_on_task_id WHERE d.task_id=t.id AND dep.status<>'completed') AND NOT EXISTS(SELECT 1 FROM pegasus_core.jobs j WHERE j.task_id=t.id AND j.status NOT IN ('failed','cancelled')) FOR UPDATE OF t SKIP LOCKED`;for(const t of ready)await tx`INSERT INTO pegasus_core.jobs(task_id,agent_id,priority,input,idempotency_key) VALUES(${t.id},${t.assigned_agent_id},${t.priority},${sql.json(t.input||{} as any)},${'task-'+t.id}) ON CONFLICT(idempotency_key) DO NOTHING`;return ready.length;});}
