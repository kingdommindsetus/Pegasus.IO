/**
 * Gate 6 diagnostic: read-only, preview-only, founder-session-protected.
 * Tests canonical KMCE scope against the non-executable synthetic sentinel.
 * Never returns other tenant's ID, raw jobs, model data or customer records.
 */
import {db} from '../../core/database/client.js';
import {configuredFounderOrgId,enforceRateLimit,hasValidCoreSession} from './_security.js';

export default async function handler(req:any,res:any){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('Vary','Cookie');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(process.env.VERCEL_ENV!=='preview')
  return res.status(404).json({error:'Not found'});
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 if(req.headers?.['sec-fetch-site']&&
  !['same-origin','none'].includes(String(req.headers['sec-fetch-site'])))
  return res.status(403).json({error:'Cross-site access denied'});
 if(!enforceRateLimit(req,res,12,60_000))return;
 if(!hasValidCoreSession(req))
  return res.status(401).json({error:'Founder session required'});
 const orgId=configuredFounderOrgId();
 if(!orgId)return res.status(503).json({error:'Founder company scope missing'});
 try{
  const sql=db();
  const [summary]=await sql`
   SELECT
    EXISTS(SELECT 1 FROM pegasus_core.organizations
     WHERE id=${orgId}::uuid AND slug='kingdom-mindset-ce'
       AND name='Kingdom Mindset CE') AS canonical_company_found,
    (SELECT COUNT(*)::int FROM pegasus_core.jobs j
     JOIN pegasus_core.tasks t ON t.id=j.task_id
     JOIN pegasus_core.projects p ON p.id=t.project_id
     WHERE p.organization_id=${orgId}::uuid) AS scoped_company_jobs,
    (SELECT COUNT(*)::int FROM pegasus_core.jobs j
     JOIN pegasus_core.tasks t ON t.id=j.task_id
     JOIN pegasus_core.projects p ON p.id=t.project_id
     JOIN pegasus_core.organizations o ON o.id=p.organization_id
     WHERE o.slug='pegasus-gate6-isolation-fixture-20261014'
       AND o.metadata->>'synthetic'='true') AS synthetic_sentinel_jobs,
    (SELECT COUNT(*)::int FROM pegasus_core.jobs j
     JOIN pegasus_core.tasks t ON t.id=j.task_id
     JOIN pegasus_core.projects p ON p.id=t.project_id
     JOIN pegasus_core.organizations o ON o.id=p.organization_id
     WHERE o.slug='pegasus-gate6-isolation-fixture-20261014'
       AND j.status IN ('queued','claimed','running','retrying')) AS executable_sentinel_jobs,
    (SELECT COUNT(*)::int FROM pegasus_core.jobs j
     JOIN pegasus_core.tasks t ON t.id=j.task_id
     JOIN pegasus_core.projects p ON p.id=t.project_id
     JOIN pegasus_core.organizations o ON o.id=p.organization_id
     WHERE p.organization_id=${orgId}::uuid
       AND o.slug='pegasus-gate6-isolation-fixture-20261014') AS sentinel_jobs_visible_in_company_scope
  `;
  const proven=Boolean(summary.canonical_company_found)&&
   Number(summary.scoped_company_jobs)>=1&&
   Number(summary.synthetic_sentinel_jobs)===1&&
   Number(summary.executable_sentinel_jobs)===0&&
   Number(summary.sentinel_jobs_visible_in_company_scope)===0;
  return res.status(200).json({
   schemaVersion:1,environment:'preview',readOnly:true,
   canonicalCompanyFound:Boolean(summary.canonical_company_found),
   scopedCompanyJobs:Number(summary.scoped_company_jobs),
   syntheticSentinelPresent:Number(summary.synthetic_sentinel_jobs)===1,
   syntheticSentinelExecutable:Number(summary.executable_sentinel_jobs)>0,
   foreignSentinelVisibleToCompany:Number(summary.sentinel_jobs_visible_in_company_scope)>0,
   sqlOwnershipCheckPassed:proven,
   hostedHttpHandlerNegativeTestsPassed:false,
   gate6Passed:false,
   note:'Read-only SQL ownership evidence; separate authenticated HTTP and worker acceptance still required'
  });
 }catch{
  return res.status(503).json({error:'Staging tenant audit unavailable'});
 }
}
