import {readFileSync} from 'node:fs';
import {timingSafeEqual} from 'node:crypto';
import type {Request,Response} from 'express';
import {db} from '../database/client.js';

const OBJECTIVE='cbe5f353-25de-4daa-a69e-09b326299fea';
const TOKEN='C:/Users/info/PegasusVoiceEngine/acceptance-isolated/.jarvis-local-ui-token';
const WINDOWS_DB='pegasus_world_windows_accept_1011';
export type TraceRecord={jobId:string;taskId:string|null;agentId:string|null;skill:string|null;status:string;attempts:number;maxAttempts:number;lastError:string|null;leaseExpiresAt:string|null;updatedAt:string;runs:Array<{id:string;attempt:number;workerId:string|null;status:string;startedAt:string;finishedAt:string|null;error:string|null}>;events:Array<{id:string;type:string;at:string}>;evidence:Array<{id:string;type:string;at:string;verified:boolean}>;memoryIds:string[];timelineState:string};
export function traceState(status:string,runs:Pick<TraceRecord['runs'][number],'finishedAt'|'status'>[],lease:string|null,now=Date.now()):string{
 if(status==='completed')return 'completed';
 if(status==='failed')return 'failed';
 if(status==='retrying')return 'retrying';
 if((status==='claimed'||status==='running')&&lease&&Date.parse(lease)<now)return 'interrupted';
 if((status==='claimed'||status==='running')&&runs.some(r=>r.finishedAt===null))return 'in_progress';
 return status;
}
export function traceViewExpired(generatedAt:string,now=Date.now()){
 const age=Date.parse(generatedAt);
 return !Number.isFinite(age)||age>now+5000||now-age>45000;
}
export async function jobTraceDevelopmentHandler(req:Request,res:Response){
 if(process.env.NODE_ENV==='production'){res.status(404).end();return;}
 if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress||'')){res.status(403).end();return;}
 const origin=req.get('origin');
 if(origin){try{const u=new URL(origin);if(!['localhost','127.0.0.1'].includes(u.hostname)){res.status(403).end();return;}}catch{res.status(403).end();return;}}
 let expected='';
 try{expected=readFileSync(TOKEN,'utf8').trim();}catch{res.status(503).json({error:'Local token unavailable'});return;}
 const supplied=String(req.get('authorization')||'').replace(/^Bearer /i,'');
 const aa=Buffer.from(supplied),bb=Buffer.from(expected);
 if(aa.length!==bb.length||aa.length<32||!timingSafeEqual(aa,bb)){res.status(401).json({error:'Unauthorized'});return;}
 res.setHeader('Cache-Control','no-store, private');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.status(405).end();return;}
 const connection=process.env.DATABASE_URL||'';
 let u:URL;
 try{u=new URL(connection);}catch{res.status(503).json({status:'stale',error:'Development database unavailable'});return;}
 if(u.hostname!=='127.0.0.1'||u.pathname!=='/'+WINDOWS_DB||decodeURIComponent(u.username)!=='pegasus_windows_accept_role'){
  res.status(503).json({status:'stale',error:'Isolated database guard failed'});return;
 }
 try{
  const sql=db();
  const list=await sql`SELECT j.id,j.task_id,j.agent_id,j.skill_key,j.status,j.attempts,j.max_attempts,
    j.last_error,j.lease_expires_at,j.updated_at FROM pegasus_core.jobs j
    JOIN pegasus_core.tasks t ON t.id=j.task_id
    WHERE t.objective_id=${OBJECTIVE} ORDER BY j.updated_at DESC,j.id LIMIT 12`;
  const records:TraceRecord[]=await Promise.all(list.map(async j=>{
   const [runs,events,evidence,memories]=await Promise.all([
    sql`SELECT id,attempt,worker_id,status,started_at,finished_at,error
      FROM pegasus_core.job_runs WHERE job_id=${j.id} ORDER BY started_at,id LIMIT 30`,
    sql`SELECT id,event_type,created_at FROM pegasus_core.events WHERE entity_type='job' AND entity_id=${String(j.id)}
      ORDER BY created_at,id LIMIT 60`,
    sql`SELECT id,evidence_type,created_at,verified FROM pegasus_core.evidence WHERE job_id=${j.id}
      ORDER BY created_at,id LIMIT 60`,
    sql`SELECT id FROM pegasus_core.memories WHERE metadata->>'jobId'=${String(j.id)} ORDER BY created_at,id LIMIT 60`
   ]);
   const fmt=(v:any)=>v instanceof Date?v.toISOString():v==null?null:String(v);
   const mappedRuns=runs.map(r=>({id:String(r.id),attempt:Number(r.attempt),workerId:r.worker_id||null,status:String(r.status),
     startedAt:fmt(r.started_at)!,finishedAt:fmt(r.finished_at),error:r.error?String(r.error).slice(0,180):null}));
   return {jobId:String(j.id),taskId:j.task_id?String(j.task_id):null,agentId:j.agent_id||null,
     skill:j.skill_key||null,status:String(j.status),attempts:Number(j.attempts),maxAttempts:Number(j.max_attempts),
     lastError:j.last_error?String(j.last_error).slice(0,180):null,leaseExpiresAt:fmt(j.lease_expires_at),
     updatedAt:fmt(j.updated_at)!,runs:mappedRuns,events:events.map(e=>({id:String(e.id),type:String(e.event_type),at:fmt(e.created_at)!})),
     evidence:evidence.map(e=>({id:String(e.id),type:String(e.evidence_type),at:fmt(e.created_at)!,verified:!!e.verified})),
     memoryIds:memories.map(m=>String(m.id)),timelineState:traceState(String(j.status),mappedRuns,fmt(j.lease_expires_at))};
  }));
  res.json({schemaVersion:1,scope:'windows-isolated-development',readOnly:true,generatedAt:new Date().toISOString(),status:'live',records});
 }catch{
  res.status(503).json({schemaVersion:1,scope:'windows-isolated-development',status:'stale',records:[],error:'Unable to verify job trace'});
 }
}
