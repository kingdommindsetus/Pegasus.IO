import {readFileSync} from 'node:fs';
import {timingSafeEqual} from 'node:crypto';
import type {Request,Response} from 'express';

const TOKEN_FILE='C:/Users/info/PegasusVoiceEngine/acceptance-isolated/.jarvis-local-ui-token';
const SNAPSHOT_FILE='C:/Users/info/PegasusVoiceEngine/acceptance-isolated/jarvis-health/latest.json';
const HISTORY_FILE='C:/Users/info/PegasusVoiceEngine/acceptance-isolated/jarvis-health/history.jsonl';
const MAX_AGE_MS=180_000;
function safeToken(a:string,b:string){
 const aa=Buffer.from(a),bb=Buffer.from(b);
 return aa.length===bb.length && aa.length>=32 && timingSafeEqual(aa,bb);
}
export function computeJarvisView(raw:string | undefined, now=Date.now()){
 const unavailable={schemaVersion:1,source:'jarvis-isolated',scope:'windows-isolated-development',status:'stale',stale:true,lastSeen:null,ageSeconds:null,signals:{},alerts:[{signal:'monitor',severity:'stale',detail:'Snapshot missing or invalid'}]};
 if(!raw)return unavailable;
 try{
  const s=JSON.parse(raw);
  if(s.scope!=='windows-isolated-development'||!['healthy','degraded','offline','blocked'].includes(s.overall))return unavailable;
  const ts=Date.parse(s.timestamp);
  if(!Number.isFinite(ts)||ts>now+5000||now-ts>MAX_AGE_MS)
   return {...unavailable,lastSeen:typeof s.timestamp==='string'?s.timestamp:null,alerts:[{signal:'monitor',severity:'stale',detail:'Snapshot expired or future dated'}]};
  return {schemaVersion:1,source:'jarvis-isolated',scope:s.scope,status:s.overall,stale:false,lastSeen:s.timestamp,ageSeconds:Math.floor((now-ts)/1000),signals:s.signals||{},alerts:Array.isArray(s.alerts)?s.alerts:[]};
 }catch{return unavailable;}
}
export function jarvisDevelopmentHandler(req:Request,res:Response){
 if(process.env.NODE_ENV==='production'){res.status(404).end();return;}
 const remote=req.socket.remoteAddress||'';
 if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(remote)){res.status(403).end();return;}
 const origin=req.get('origin');
 if(origin){
  try{const u=new URL(origin);if(!['localhost','127.0.0.1'].includes(u.hostname)){res.status(403).end();return;}}
  catch{res.status(403).end();return;}
 }
 let expected='';
 try{expected=readFileSync(TOKEN_FILE,'utf8').trim();}catch{res.status(503).json({error:'Local Jarvis authentication not configured'});return;}
 const supplied=String(req.get('authorization')||'').replace(/^Bearer /i,'');
 if(!safeToken(supplied,expected)){res.status(401).json({error:'Unauthorized'});return;}
 res.setHeader('Cache-Control','no-store, private');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.status(405).end();return;}
 let raw: string|undefined;
 try{raw=readFileSync(SNAPSHOT_FILE,'utf8');}catch{}
 const view=computeJarvisView(raw);
 if(req.query.history==='1'){
  let entries:unknown[]=[];
  try{entries=readFileSync(HISTORY_FILE,'utf8').trim().split(/\r?\n/).filter(Boolean).slice(-12).map(line=>{
    const s=JSON.parse(line);
    return {timestamp:s.timestamp,status:s.overall,alerts:Array.isArray(s.alerts)?s.alerts:[]};
  });}catch{}
  res.json({...view,history:entries});
  return;
 }
 res.json(view);
}
