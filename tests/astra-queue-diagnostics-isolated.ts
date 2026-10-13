import {db,closeDb} from '../core/database/client.js';
const sql=db();
try{
 const rows=await sql`SELECT j.id,j.status,j.attempts,j.input->>'bridgeKind' as marker,(SELECT string_agg(r.worker_id||':'||r.status,',') FROM pegasus_core.job_runs r WHERE r.job_id=j.id) workers FROM pegasus_core.jobs j WHERE j.idempotency_key LIKE 'astra-pilot-%' ORDER BY j.created_at DESC LIMIT 6`;
 for(const r of rows)console.log('ASTRA_JOB_DIAGNOSTIC',JSON.stringify(r));
}finally{await closeDb();}
