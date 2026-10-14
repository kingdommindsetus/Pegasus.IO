/**
 * Preview-only, founder-session-authenticated database identity diagnostic.
 * Read-only: does not reveal connection strings, credentials or payloads.
 * Use only behind Vercel Deployment Protection. Never enable in production.
 */
import {createHash} from 'node:crypto';
import {db} from '../../core/database/client.js';
import {enforceRateLimit,hasValidCoreSession,configuredFounderOrgId} from './_security.js';

export function neonEndpointIdForHost(hostname:string):string|null{
 const host=hostname.toLowerCase();
 if(!host.endsWith('.neon.tech'))return null;
 const endpointId=host.split('.')[0].replace(/-pooler$/,'');
 return /^ep-[a-z0-9-]+$/.test(endpointId)?endpointId:null;
}

export default async function handler(req:any,res:any){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('Vary','Cookie');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(process.env.VERCEL_ENV!=='preview')return res.status(404).json({error:'Not found'});
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 if(req.headers?.['sec-fetch-site']&&!['same-origin','none'].includes(String(req.headers['sec-fetch-site'])))
  return res.status(403).json({error:'Cross-origin request denied'});
 if(!enforceRateLimit(req,res,12,60_000))return;
 if(!hasValidCoreSession(req))return res.status(401).json({error:'Founder session required'});
 try{
  const sql=db();
  const [identity]=await sql`SELECT current_database() AS db, current_user AS role,
   to_regclass('pegasus_core.organizations') IS NOT NULL AS schema_present`;
  let company:null|{id:string;name:string;slug:string}=null;
  if(identity.schema_present){
   const [record]=await sql`
    SELECT id,name,slug FROM pegasus_core.organizations
    WHERE slug='kingdom-mindset-ce' AND name='Kingdom Mindset CE' LIMIT 1
   `;
   if(record)company={id:String(record.id),name:record.name,slug:record.slug};
  }
  // Compare the destination with an independently verified Neon endpoint without
  // ever returning the hostname, connection string, username or password.
  const connectionUrl=new URL(String(process.env.DATABASE_URL||''));
  const endpointFingerprint=createHash('sha256').update(connectionUrl.hostname.toLowerCase()).digest('hex').slice(0,20);
  const neonEndpointId=neonEndpointIdForHost(connectionUrl.hostname);
  const configuredId=configuredFounderOrgId();
  return res.status(200).json({
   readOnly:true,environment:'preview',
   databaseName:identity.db,connectionRole:identity.role,
   endpointFingerprint,neonEndpointId,
   coreOrganizationSchemaReady:identity.schema_present,
   company,
   configuration:{
    companyScopeConfigured:!!configuredId,
    matchesCanonicalCompany:!!configuredId&&!!company&&configuredId.toLowerCase()===company.id.toLowerCase()
   },
   note:'No secrets, raw job data or customer records are returned'
  });
 }catch{
  return res.status(503).json({error:'Preview database identity is unavailable'});
 }
}
