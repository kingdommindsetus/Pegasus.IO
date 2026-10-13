import {db} from '../../core/database/client.js';
import {requireCoreAuth,enforceRateLimit,configuredFounderOrgId} from './_security.js';

/** Read-only, company-scoped event stream. Never returns other tenants' event records. */
export default async function handler(req:any,res:any){
 res.setHeader('Cache-Control','no-store, private');
 res.setHeader('Vary','Cookie');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 if(!enforceRateLimit(req,res,30,60_000)||!requireCoreAuth(req,res))return;
 const orgId=configuredFounderOrgId();
 if(!orgId)return res.status(503).json({error:'Founder organization scope is not configured'});
 const sinceRaw=String(req.query?.after||'0');
 if(!/^[0-9]{1,18}$/.test(sinceRaw))return res.status(400).json({error:'Invalid cursor'});
 try{
  const sql=db();
  const rows=await sql`
   SELECT e.id,e.agent_id,e.event_type,e.entity_type,e.entity_id,e.created_at
   FROM pegasus_core.events e
   WHERE e.id>${sinceRaw}::bigint AND (
     EXISTS(SELECT 1 FROM pegasus_core.projects p
       WHERE p.id=e.project_id AND p.organization_id=${orgId}::uuid)
     OR (e.entity_type='job' AND EXISTS(
       SELECT 1 FROM pegasus_core.jobs j
       JOIN pegasus_core.tasks t ON t.id=j.task_id
       JOIN pegasus_core.projects p ON p.id=t.project_id
       WHERE j.id::text=e.entity_id AND p.organization_id=${orgId}::uuid))
     OR (e.entity_type='task' AND EXISTS(
       SELECT 1 FROM pegasus_core.tasks t
       JOIN pegasus_core.projects p ON p.id=t.project_id
       WHERE t.id::text=e.entity_id AND p.organization_id=${orgId}::uuid))
   )
   ORDER BY e.id ASC LIMIT 100
  `;
  return res.status(200).json({source:'pegasus_core.events',scope:'configured_founder_organization',
   readOnly:true,events:rows.map(r=>({id:String(r.id),agentId:r.agent_id,eventType:r.event_type,
    entityType:r.entity_type,entityId:r.entity_id,createdAt:r.created_at})),
   nextCursor:rows.length?String(rows[rows.length-1].id):sinceRaw});
 }catch{return res.status(503).json({error:'Authoritative events unavailable'});}
}
