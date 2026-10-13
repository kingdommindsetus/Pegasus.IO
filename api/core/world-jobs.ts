import {db} from '../../core/database/client.js';
import {requireCoreAuth,enforceRateLimit,configuredFounderOrgId} from './_security.js';

/** Read-only, company-scoped job projection. Never returns another tenant's jobs. */
export default async function handler(req:any,res:any){
 res.setHeader('Cache-Control','no-store, private');
 res.setHeader('Vary','Cookie');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 if(!enforceRateLimit(req,res,30,60_000)||!requireCoreAuth(req,res))return;
 const orgId=configuredFounderOrgId();
 if(!orgId)return res.status(503).json({error:'Founder organization scope is not configured'});
 const limitRaw=Number(req.query?.limit||50);
 const limit=Number.isFinite(limitRaw)?Math.max(1,Math.min(100,Math.trunc(limitRaw))):50;
 const objectiveId=String(req.query?.objectiveId||'').trim();
 if(objectiveId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(objectiveId))
  return res.status(400).json({error:'Invalid objectiveId'});
 try{
  const sql=db();
  const jobs=await sql`
   SELECT j.id,j.task_id,j.agent_id,j.status,j.attempts,j.max_attempts,j.last_error,
     j.created_at,j.updated_at,t.title,t.objective_id
   FROM pegasus_core.jobs j
   JOIN pegasus_core.tasks t ON t.id=j.task_id
   JOIN pegasus_core.projects p ON p.id=t.project_id
   WHERE p.organization_id=${orgId}::uuid
     AND (${objectiveId||null}::uuid IS NULL OR t.objective_id=${objectiveId||null}::uuid)
   ORDER BY j.updated_at DESC,j.id DESC LIMIT ${limit}
  `;
  return res.status(200).json({source:'pegasus_core.jobs',scope:'configured_founder_organization',readOnly:true,
   jobs:jobs.map(j=>({id:j.id,taskId:j.task_id,agentId:j.agent_id,status:j.status,
    attempts:j.attempts,maxAttempts:j.max_attempts,lastError:j.last_error||null,
    title:j.title||'',objectiveId:j.objective_id,updatedAt:j.updated_at}))});
 }catch{return res.status(503).json({error:'Authoritative jobs unavailable'});}
}
