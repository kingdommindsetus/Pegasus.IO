import {db} from '../../database/client.js';

// Development-only recovery. This intentionally rejects all non-Windows-test databases.
export async function recoverExpiredIsolatedLeases(objectiveId:string){
 const url=new URL(process.env.DATABASE_URL||'http://invalid');
 if(url.hostname!=='127.0.0.1'||url.pathname!=='/pegasus_world_windows_accept_1011'||
    decodeURIComponent(url.username)!=='pegasus_windows_accept_role')
   throw Error('Isolated recovery rejects non-test database');
 if(objectiveId!=='cbe5f353-25de-4daa-a69e-09b326299fea')
   throw Error('Isolated recovery rejects unapproved objective');
 const sql=db();
 return sql.begin(async tx=>{
  const stale=await tx`
   SELECT j.id,j.agent_id,j.status,j.attempts,j.max_attempts,j.task_id,j.skill_key,j.input->>'bridgeKind' AS bridge_kind
   FROM pegasus_core.jobs j JOIN pegasus_core.tasks t ON j.task_id=t.id
   WHERE t.objective_id=${objectiveId}
     AND j.status IN ('claimed','running')
     AND j.lease_expires_at IS NOT NULL AND j.lease_expires_at < now()
     AND j.agent_id='simon'
     AND ((j.skill_key IN ('search_company_memory','generate_content')
       AND COALESCE(j.input->>'bridgeKind','') <> 'astra_kmce_readonly_v1')
       OR (j.skill_key='astra_knowledge_draft'
       AND j.input->>'bridgeKind'='astra_kmce_readonly_v1'))
     AND j.input->>'draftOnly'='true'
     AND j.input->>'externalActionsAllowed'='false'
   ORDER BY j.lease_expires_at,j.id FOR UPDATE OF j SKIP LOCKED LIMIT 10`;
  for(const job of stale){
   // The one-shot Astra pilot must never auto-retry after lease loss.
   const astra=job.skill_key==='astra_knowledge_draft'&&job.bridge_kind==='astra_kmce_readonly_v1';
   const exhausted=Number(job.attempts)>=Number(job.max_attempts);
   const next=astra||exhausted?'failed':'retrying';
   await tx`UPDATE pegasus_core.jobs SET status=${next},lease_expires_at=NULL,
      available_at=now(),last_error=${astra?'ASTRA_ISOLATED_LEASE_EXPIRED':'Isolated worker lease expired'},updated_at=now()
      WHERE id=${job.id} AND status IN ('claimed','running')`;
   await tx`UPDATE pegasus_core.job_runs SET status='failed',finished_at=now(),
      error=${astra?'ASTRA_ISOLATED_LEASE_EXPIRED':'Isolated worker lease expired'}
      WHERE job_id=${job.id} AND finished_at IS NULL`;
   await tx`INSERT INTO pegasus_core.events(agent_id,event_type,entity_type,entity_id,payload)
     VALUES(${job.agent_id},${astra?'isolated_astra_lease_expired':'isolated_lease_recovered'},'job',${job.id},
       ${tx.json({from:job.status,to:next,draftOnly:true,externalActionsExecuted:false,automaticRetry:next==='retrying'})})`;
  }
  return stale.map(j=>j.id);
 });
}
