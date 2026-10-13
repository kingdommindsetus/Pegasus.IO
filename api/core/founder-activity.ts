/**
 * Founder-only, organization-scoped activity projection.
 * No raw inputs/results, sensitive payloads, mutating endpoints, or global queries.
 * Production use requires secure env configuration and deployed auth acceptance.
 */
import {db} from '../../core/database/client.js';
import {enforceRateLimit,hasValidCoreSession} from './_security.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export default async function handler(req:any,res:any){
 res.setHeader('Cache-Control','no-store, private');
 res.setHeader('Vary','Cookie');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 if(req.headers?.['sec-fetch-site']&&!['same-origin','none'].includes(String(req.headers['sec-fetch-site'])))
  return res.status(403).json({error:'Cross-origin access denied'});
 if(!enforceRateLimit(req,res,30,60_000))return;
 // Sensitive data is not exposed to callers holding only the service API secret.
 if(!hasValidCoreSession(req))return res.status(401).json({error:'Founder session required'});
 const orgId=String(process.env.PEGASUS_FOUNDER_ORGANIZATION_ID||'').trim();
 if(!UUID.test(orgId))return res.status(503).json({error:'Founder organization scope is not configured'});
 const queryLimit=Number(req.query?.limit||30);
 const limit=Number.isFinite(queryLimit)?Math.max(1,Math.min(50,Math.trunc(queryLimit))):30;
 try{
  const sql=db();
  const rows=await sql`
   SELECT j.id AS job_id,j.agent_id,j.skill_key,j.status,j.attempts,j.max_attempts,j.updated_at,
     t.id AS task_id,t.objective_id,t.title AS task_title,
     (SELECT count(*)::int FROM pegasus_core.job_runs r WHERE r.job_id=j.id) AS run_count,
     (SELECT count(*)::int FROM pegasus_core.evidence e WHERE e.job_id=j.id) AS evidence_count,
     (SELECT count(*)::int FROM pegasus_core.events e
       WHERE e.entity_type='job' AND e.entity_id=j.id::text) AS event_count,
     (SELECT count(*)::int FROM pegasus_core.memories m
       WHERE m.metadata->>'jobId'=j.id::text) AS memory_count
   FROM pegasus_core.jobs j
   JOIN pegasus_core.tasks t ON t.id=j.task_id
   JOIN pegasus_core.projects p ON p.id=t.project_id
   WHERE p.organization_id=${orgId}::uuid
   ORDER BY j.updated_at DESC,j.id DESC LIMIT ${limit}
  `;
  return res.status(200).json({
   schemaVersion:1,source:'pegasus_core.jobs',scope:'configured_founder_organization',
   readOnly:true,generatedAt:new Date().toISOString(),
   records:rows.map(j=>({
    jobId:String(j.job_id),taskId:String(j.task_id),objectiveId:j.objective_id?String(j.objective_id):null,
    agentId:j.agent_id||null,skill:j.skill_key||null,status:String(j.status),
    attempts:Number(j.attempts),maxAttempts:Number(j.max_attempts),taskTitle:j.task_title||'',
    updatedAt:j.updated_at instanceof Date?j.updated_at.toISOString():String(j.updated_at),
    runCount:Number(j.run_count),evidenceCount:Number(j.evidence_count),
    eventCount:Number(j.event_count),memoryCount:Number(j.memory_count)
   }))
  });
 }catch{
  return res.status(503).json({error:'Founder activity temporarily unavailable'});
 }
}
