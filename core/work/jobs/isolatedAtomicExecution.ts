import {db} from '../../database/client.js';
import {assertIsolatedIntent} from './isolatedSafetyPolicy.js';
const SCOPE='cbe5f353-25de-4daa-a69e-09b326299fea';
function guard(scope:string){
 const u=new URL(process.env.DATABASE_URL||'http://invalid');
 if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_windows_accept_1011'||
 decodeURIComponent(u.username)!=='pegasus_windows_accept_role'||scope!==SCOPE)
 throw Error('Atomic execution limited to isolated Windows development database');
}
export type OwnedRun={jobId:string;runId:string;lease:string};
export async function startOwnedIsolatedRun(scope:string,jobId:string,workerId:string):Promise<OwnedRun|null>{
 guard(scope);const sql=db();
 return sql.begin(async tx=>{
  const [j]=await tx`SELECT j.id,j.status,j.lease_expires_at::text AS lease,
    j.lease_expires_at AS expiry,j.attempts,j.max_attempts,j.agent_id,j.skill_key,j.input
    FROM pegasus_core.jobs j JOIN pegasus_core.tasks t ON t.id=j.task_id
    WHERE j.id=${jobId} AND t.objective_id=${scope}
      AND j.status='claimed' AND j.lease_expires_at>now()
      AND j.agent_id='simon' AND j.skill_key IN ('search_company_memory','generate_content')
      AND j.input->>'draftOnly'='true' AND j.input->>'externalActionsAllowed'='false'
    FOR UPDATE OF j`;
  if(!j||Number(j.attempts)>=Number(j.max_attempts))return null;
  const [run]=await tx`SELECT id FROM pegasus_core.job_runs WHERE job_id=${jobId}
    AND worker_id=${workerId} AND finished_at IS NULL ORDER BY started_at DESC LIMIT 1 FOR UPDATE`;
  if(!run)return null;
  const [updated]=await tx`UPDATE pegasus_core.jobs SET status='running',
    attempts=attempts+1,updated_at=now() WHERE id=${jobId}
    AND status='claimed' AND lease_expires_at>now() RETURNING id`;
  return updated?{jobId,runId:run.id,lease:String(j.lease)}:null;
 });
}
export async function finishOwnedIsolatedRun(scope:string,owned:OwnedRun,
 output:Record<string,unknown>,evidence:unknown[]):Promise<boolean>{
 guard(scope);const sql=db();
 return sql.begin(async tx=>{
  const [j]=await tx`SELECT j.id,j.task_id,j.agent_id,j.lease_expires_at::text AS lease,
     j.status,t.project_id FROM pegasus_core.jobs j JOIN pegasus_core.tasks t ON t.id=j.task_id
     WHERE j.id=${owned.jobId} AND t.objective_id=${scope} FOR UPDATE OF j`;
  if(!j||j.status!=='running'||j.lease!==owned.lease)return false;
  const [valid]=await tx`SELECT id FROM pegasus_core.job_runs
    WHERE id=${owned.runId} AND job_id=${owned.jobId} AND finished_at IS NULL FOR UPDATE`;
  if(!valid)return false;
  const [live]=await tx`SELECT (lease_expires_at>now()) AS ok FROM pegasus_core.jobs WHERE id=${owned.jobId}`;
  if(!live.ok)return false;
  const json=tx.json(output as any);
  const [updated]=await tx`UPDATE pegasus_core.jobs SET status='completed',result=${json},
     last_error=NULL,lease_expires_at=NULL,updated_at=now() WHERE id=${owned.jobId}
     AND status='running' AND lease_expires_at>now() RETURNING id`;
  if(!updated)return false;
  for(const item of evidence)await tx`INSERT INTO pegasus_core.evidence(task_id,job_id,evidence_type,content)
    VALUES(${j.task_id},${owned.jobId},'agent_result',${tx.json(item as any)})`;
  await tx`INSERT INTO pegasus_core.memories(scope,scope_id,agent_id,project_id,
     memory_kind,memory_partition,subject,content,source_type,authority,metadata)
    VALUES('project',${j.project_id}::text,${j.agent_id},${j.project_id},
     'handoff','mission_run_memory',${'Agent '+j.agent_id+' mission handoff'},
     ${JSON.stringify(output)},'agent_execution','agent_generated',
     ${tx.json({jobId:owned.jobId,taskId:j.task_id,objectiveId:scope,runId:owned.runId})})`;
  await tx`UPDATE pegasus_core.job_runs SET status='completed',finished_at=now(),
    checkpoint=${tx.json({result:output} as any)} WHERE id=${owned.runId} AND finished_at IS NULL`;
  await tx`INSERT INTO pegasus_core.events(agent_id,event_type,entity_type,entity_id,payload)
    VALUES(${j.agent_id},'job_completed','job',${owned.jobId},
    ${tx.json({runId:owned.runId,draftOnly:true,externalActionsExecuted:false})})`;
  return true;
 });
}

export async function claimIsolatedDraftJob(
 scope:string,workerId:'isolated-worker'|'isolated-ai-worker',
 skill:'search_company_memory'|'generate_content',leaseSeconds:number){
 guard(scope);const sql=db();
 if((skill==='generate_content')!==(workerId==='isolated-ai-worker'))
  throw Error('Isolated worker and skill mismatch');
 return sql.begin(async tx=>{
  const rows=await tx`SELECT j.* FROM pegasus_core.jobs j
    JOIN pegasus_core.tasks t ON t.id=j.task_id
    WHERE t.objective_id=${scope} AND j.agent_id='simon'
      AND j.skill_key=${skill} AND j.status IN ('queued','retrying')
      AND j.available_at<=now()
      AND (j.lease_expires_at IS NULL OR j.lease_expires_at<=now())
      AND j.attempts<j.max_attempts
      AND j.input->>'draftOnly'='true'
      AND j.input->>'externalActionsAllowed'='false'
      AND (${skill}!='generate_content' OR j.input->>'reasoningProvider'='ollama_local')
    ORDER BY j.priority DESC,j.available_at,j.id
    FOR UPDATE OF j SKIP LOCKED LIMIT 1`;
  if(!rows.length)return null;
  const j=rows[0];
  assertIsolatedIntent({objectiveId:scope,databaseUrl:process.env.DATABASE_URL||'',agentId:j.agent_id,skillKey:j.skill_key,input:j.input});
  const [updated]=await tx`UPDATE pegasus_core.jobs SET status='claimed',
    lease_expires_at=now()+(${leaseSeconds}*interval '1 second'),updated_at=now()
    WHERE id=${j.id} AND status IN ('queued','retrying') RETURNING *`;
  if(!updated)throw Error('Claim lost selected locked row');
  await tx`INSERT INTO pegasus_core.job_runs(job_id,attempt,worker_id,status)
    VALUES(${j.id},${Number(j.attempts)+1},${workerId},'claimed')`;
  return {id:j.id,taskId:j.task_id,agentId:j.agent_id,skillKey:j.skill_key,
   status:'claimed' as const,attempts:Number(j.attempts),
   maxAttempts:Number(j.max_attempts),input:j.input as Record<string,unknown>,
   leaseExpiresAt:updated.lease_expires_at?.toISOString?.()};
 });
}
