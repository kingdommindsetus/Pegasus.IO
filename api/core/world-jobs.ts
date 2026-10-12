import { db } from '../../core/database/client.js';
import { requireCoreAuth, enforceRateLimit } from './_security.js';

/** Read-only authoritative job projection for Agent World. No task creation or execution. */
export default async function handler(req:any,res:any) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
  if(!enforceRateLimit(req,res,30,60_000)||!requireCoreAuth(req,res))return;
  const limitRaw=Number(req.query?.limit||50);
  const limit=Number.isFinite(limitRaw)?Math.max(1,Math.min(100,Math.trunc(limitRaw))):50;
  const objectiveId=String(req.query?.objectiveId||'').trim();
  if(objectiveId && !/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(objectiveId))return res.status(400).json({error:'Invalid objectiveId'});
  try {
    const sql=db();
    const jobs=objectiveId
      ?await sql`SELECT j.id,j.task_id,j.agent_id,j.status,j.attempts,j.max_attempts,j.last_error,j.created_at,j.updated_at,t.title,t.objective_id FROM pegasus_core.jobs j LEFT JOIN pegasus_core.tasks t ON t.id=j.task_id WHERE t.objective_id=${objectiveId}::uuid ORDER BY j.updated_at DESC LIMIT ${limit}`
      :await sql`SELECT j.id,j.task_id,j.agent_id,j.status,j.attempts,j.max_attempts,j.last_error,j.created_at,j.updated_at,t.title,t.objective_id FROM pegasus_core.jobs j LEFT JOIN pegasus_core.tasks t ON t.id=j.task_id ORDER BY j.updated_at DESC LIMIT ${limit}`;
    return res.status(200).json({source:'pegasus_core.jobs',readOnly:true,jobs:jobs.map(j=>({id:j.id,taskId:j.task_id,agentId:j.agent_id,status:j.status,attempts:j.attempts,maxAttempts:j.max_attempts,lastError:j.last_error||null,title:j.title||'',objectiveId:j.objective_id,updatedAt:j.updated_at}))});
  } catch {return res.status(503).json({error:'Authoritative job status unavailable'});}
}
