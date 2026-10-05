import crypto from 'node:crypto';
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const buckets=new Map<string,{count:number,reset:number}>();
const COOKIE='pegasus_core_session';

function safeEqual(a:string,b:string){const ab=Buffer.from(a),bb=Buffer.from(b);if(!ab.length||ab.length!==bb.length)return false;return crypto.timingSafeEqual(ab,bb);}
function secret(){return String(process.env.PEGASUS_CORE_API_SECRET||'').trim();}
export function isCoreAuthConfigured(){return !!secret();}
function sign(value:string){const key=secret();if(!key)throw Error('Core API authentication is not configured');return crypto.createHmac('sha256',key).update(value).digest('hex');}
export function makeSessionCookie(){
 if(!isCoreAuthConfigured())throw Error('Core API authentication is not configured');
 const exp=Date.now()+8*60*60*1000;const payload=Buffer.from(JSON.stringify({role:'founder',exp})).toString('base64url');
 return payload+'.'+sign(payload);
}
function cookieValue(req:any){const raw=String(req.headers?.cookie||'');for(const part of raw.split(';')){const [k,...v]=part.trim().split('=');if(k===COOKIE)return v.join('=');}return '';}
function validSession(req:any){const token=cookieValue(req);const [payload,sig]=token.split('.');if(!payload||!sig||!isCoreAuthConfigured())return false;let expected='';try{expected=sign(payload);}catch{return false;}if(!safeEqual(sig,expected))return false;try{const data=JSON.parse(Buffer.from(payload,'base64url').toString());return data.role==='founder'&&Number(data.exp)>Date.now();}catch{return false;}}
export function hasValidCoreSession(req:any){return validSession(req);}
function secureCookieFlag(){return String(process.env.NODE_ENV||'').toLowerCase()==='production'?'; Secure':'';}
export function sessionCookieHeader(token:string){return COOKIE+'='+token+'; HttpOnly'+secureCookieFlag()+'; SameSite=Strict; Path=/; Max-Age=28800';}
export function clearSessionCookieHeader(){return COOKIE+'=; HttpOnly'+secureCookieFlag()+'; SameSite=Strict; Path=/; Max-Age=0';}
export function validAdminPassword(value:unknown){const configured=String(process.env.PEGASUS_ADMIN_PASSWORD||'');return !!configured&&safeEqual(String(value||''),configured);}
export function getRequestIp(req:any){const xf=String(req.headers?.['x-forwarded-for']||'').split(',')[0].trim();return xf||String(req.headers?.['x-real-ip']||req.socket?.remoteAddress||'unknown');}
export function enforceRateLimit(req:any,res:any,limit=30,windowMs=60_000){const now=Date.now(),key=getRequestIp(req),cur=buckets.get(key);if(!cur||cur.reset<=now){buckets.set(key,{count:1,reset:now+windowMs});return true;}if(cur.count>=limit){res.setHeader?.('Retry-After',String(Math.max(1,Math.ceil((cur.reset-now)/1000))));res.status(429).json({error:'Too many requests'});return false;}cur.count++;return true;}
export function requireCoreAuth(req:any,res:any){const configured=secret();if(!configured){res.status(503).json({error:'Core API authentication is not configured'});return false;}const provided=String(req.headers?.['x-pegasus-core-secret']||'').trim();if((provided&&safeEqual(provided,configured))||validSession(req))return true;res.status(401).json({error:'Unauthorized'});return false;}
export function requirePost(req:any,res:any){if(req.method!=='POST'){res.status(405).json({error:'Method not allowed'});return false;}return true;}
export function parseUuid(value:unknown,name:string){const v=String(value||'').trim();if(!UUID_RE.test(v))throw Error(name+' must be a valid UUID');return v;}
export function parseObjective(value:unknown){const v=String(value||'').trim();if(!v)throw Error('objective required');if(v.length>2000)throw Error('objective too long');return v;}
