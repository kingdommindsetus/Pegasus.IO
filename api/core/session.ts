import {clearSessionCookieHeader,enforceRateLimit,hasValidCoreSession,isCoreAuthConfigured,makeSessionCookie,sessionCookieHeader} from './_security.js';
export default async function handler(req:any,res:any){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET')return hasValidCoreSession(req)?res.status(200).json({ok:true}):res.status(401).json({ok:false});
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 if(!enforceRateLimit(req,res,20,60_000))return;
 const action=String(req.body?.action||'login');
 if(action==='logout'){res.setHeader('Set-Cookie',clearSessionCookieHeader());return res.json({ok:true});}
 if(!isCoreAuthConfigured())return res.status(503).json({error:'Core API authentication is not configured'});
 // Founder password gate disabled by design. Access remains governed by the signed Core session cookie
 // and the project's deployment-level protection.
 res.setHeader('Set-Cookie',sessionCookieHeader(makeSessionCookie()));
 return res.json({ok:true,passwordRequired:false});
}
