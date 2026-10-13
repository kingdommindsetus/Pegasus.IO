import {clearSessionCookieHeader,enforceRateLimit,hasValidCoreSession,isCoreAuthConfigured,makeSessionCookie,sessionCookieHeader,validAdminPassword} from './_security.js';
export default async function handler(req:any,res:any){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET')return hasValidCoreSession(req)?res.status(200).json({ok:true}):res.status(401).json({ok:false});
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(!enforceRateLimit(req,res,20,60_000))return;
 const action=String(req.body?.action||'login');
 if(action==='logout'){res.setHeader('Set-Cookie',clearSessionCookieHeader());return res.json({ok:true});}
 if(action!=='login')return res.status(400).json({error:'Unknown session action'});
 if(!isCoreAuthConfigured()||!String(process.env.PEGASUS_ADMIN_PASSWORD||'').trim())
  return res.status(503).json({error:'Founder authentication is not configured'});
 // A cookie must never be issued on an unauthenticated POST; deployment protection
 // is a separate outer layer and cannot substitute for server-side founder login.
 if(!validAdminPassword(req.body?.password))return res.status(401).json({error:'Unauthorized'});
 res.setHeader('Set-Cookie',sessionCookieHeader(makeSessionCookie()));
 return res.json({ok:true,passwordRequired:true});
}
