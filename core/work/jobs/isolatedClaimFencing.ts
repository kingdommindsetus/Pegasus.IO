import {db} from '../../database/client.js';
const SCOPE='cbe5f353-25de-4daa-a69e-09b326299fea';
function guard(scope:string){
 const u=new URL(process.env.DATABASE_URL||'http://invalid');
 if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_windows_accept_1011'||
 decodeURIComponent(u.username)!=='pegasus_windows_accept_role'||scope!==SCOPE)
 throw Error('Fencing is restricted to the Windows isolated test objective');
}
// A lease deadline + a unique claimed run ID form the ownership token.
// This cannot be reused for external actions without transactional outbox/fencing at the provider.
export async function fencedIsolatedJobUpdate(scope:string,jobId:string,runId:string,
 expectedLease:string,nextStatus:'running'|'completed'|'retrying'|'failed'){
 guard(scope);
 const sql=db();
 const rows=await sql`UPDATE pegasus_core.jobs j SET status=${nextStatus},
   lease_expires_at=CASE WHEN ${nextStatus} IN ('completed','retrying','failed') THEN NULL ELSE j.lease_expires_at END,
   updated_at=now()
 WHERE j.id=${jobId} AND j.status IN ('claimed','running')
 AND j.lease_expires_at>=(${expectedLease}::timestamptz - interval '1 millisecond') AND j.lease_expires_at<=(${expectedLease}::timestamptz + interval '1 millisecond')
 AND j.lease_expires_at > now()
 AND EXISTS (SELECT 1 FROM pegasus_core.tasks t WHERE t.id=j.task_id AND t.objective_id=${scope})
 AND EXISTS (SELECT 1 FROM pegasus_core.job_runs r WHERE r.id=${runId}
  AND r.job_id=j.id AND r.finished_at IS NULL)
 RETURNING j.id`;
 return rows.length===1;
}
