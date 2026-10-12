import {createServer} from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {db,closeDb} from '../core/database/client.js';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
if(u.hostname!=='127.0.0.1'||u.pathname!=='/pegasus_world_accept_1011')throw Error('Refuse non-test DB');
const secret=process.env.WORLD_APPROVAL_TOKEN||'';
if(secret.length<32)throw Error('Approval token not configured');
const equal=(x:string,y:string)=>{const a=Buffer.from(x),b=Buffer.from(y);return a.length===b.length&&timingSafeEqual(a,b)};
const sql=db();
const reply=(res:any,status:number,data:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
const page=`<!doctype html><html><meta charset="utf-8"><title>Gatekeeper Founder Review</title><style>body{font:16px system-ui;background:#111821;color:#eee;max-width:800px;margin:30px auto;padding:16px}input,textarea{display:block;box-sizing:border-box;width:100%;margin:8px 0;padding:12px}article{background:#253044;border-radius:12px;padding:18px;margin:12px 0}button{padding:10px;margin:5px;background:#ddbc83;border:0}</style><h1>Gatekeeper — Founder Review</h1><p>Development-only draft reviews. Approval never sends, books or publishes.</p><label>Local approval token<input type="password" id="token" autocomplete="off"></label><button id="load">Load approvals</button><div id="items"></div><pre id="info"></pre><script>
const el=id=>document.getElementById(id);
async function request(path,method='GET',data){const r=await fetch(path,{method,headers:{'x-world-approval-token':el('token').value,'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});const o=await r.json();if(!r.ok)throw Error(o.error);return o}
async function load(){try{const x=await request('/api/approvals');el('items').replaceChildren();for(const a of x.approvals){const card=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p'),note=document.createElement('textarea');h.textContent=a.actionType+' — '+a.status;p.textContent=a.agentId+' · '+a.title+' · '+a.jobId;note.placeholder='Reason (required, at least 5 characters)';card.append(h,p);if(a.status==='pending'){card.append(note);for(const [decision,label] of [['approved','Approve draft review'],['rejected','Reject draft']]){const btn=document.createElement('button');btn.textContent=label;btn.onclick=async()=>{try{const out=await request('/api/decide','POST',{id:a.id,decision,reason:note.value});el('info').textContent=JSON.stringify(out,null,2);await load()}catch(e){el('info').textContent=e.message}};card.append(btn)}}el('items').append(card)}}catch(e){el('info').textContent=e.message}}
el('load').onclick=load;</script></html>`;
const app=createServer(async(req,res)=>{
 const path=new URL(req.url||'/', 'http://localhost').pathname;
 if(path==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});res.end(page);return}
 if(!equal(String(req.headers['x-world-approval-token']||''),secret)){reply(res,401,{error:'Unauthorized'});return}
 try{
 if(path==='/api/approvals'&&req.method==='GET'){
 const a=await sql`SELECT a.id,a.job_id,a.requested_by_agent_id,a.action_type,a.status,a.decision_reason,t.title FROM pegasus_core.approvals a JOIN pegasus_core.jobs j ON j.id=a.job_id LEFT JOIN pegasus_core.tasks t ON t.id=j.task_id ORDER BY a.created_at DESC LIMIT 50`;
 reply(res,200,{approvals:a.map(x=>({id:x.id,jobId:x.job_id,agentId:x.requested_by_agent_id,actionType:x.action_type,status:x.status,reason:x.decision_reason,title:x.title||''}))});return}
 if(path==='/api/decide'&&req.method==='POST'){
 let body='';for await(const part of req){body+=part;if(body.length>2048){reply(res,413,{error:'Too large'});return}}
 const b=JSON.parse(body||'{}');
 if(!/^[0-9a-f-]{36}$/i.test(String(b.id))||!['approved','rejected'].includes(b.decision)||typeof b.reason!=='string'||b.reason.trim().length<5||b.reason.length>500){reply(res,400,{error:'Invalid decision or reason'});return}
 const decision=await sql.begin(async tx=>{
 const [a]=await tx`SELECT a.id,a.job_id,a.status,a.action_type,j.status AS job_status FROM pegasus_core.approvals a JOIN pegasus_core.jobs j ON j.id=a.job_id WHERE a.id=${b.id} FOR UPDATE OF a,j`;
 if(!a)return {status:404,error:'Not found'};
 if(a.status!=='pending')return {status:409,error:'Already decided'};
 if(a.action_type!=='founder_review_draft'||a.job_status!=='waiting_approval')return {status:409,error:'Not eligible'};
 await tx`UPDATE pegasus_core.approvals SET status=${b.decision}::pegasus_core.approval_status,decided_by='local-founder-test',decision_reason=${b.reason.trim()},decided_at=now() WHERE id=${b.id}`;
 await tx`INSERT INTO pegasus_core.audit_log(actor_type,actor_id,action,entity_type,entity_id,before_state,after_state) VALUES('founder','local-founder-test',${'review_'+b.decision},'approval',${b.id},${tx.json({status:'pending'})},${tx.json({status:b.decision,reason:b.reason.trim()})})`;
 await tx`INSERT INTO pegasus_core.events(agent_id,event_type,entity_type,entity_id,payload) VALUES('gatekeeper',${'founder_draft_'+b.decision},'job',${a.job_id},${tx.json({approvalId:b.id,draftOnly:true})})`;
 return {status:200,id:b.id,decision:b.decision,jobId:a.job_id,jobStatus:'waiting_approval',externalActionsExecuted:false};
 });
 reply(res,decision.status,decision.status===200?decision:{error:decision.error});return}
 reply(res,405,{error:'Unsupported method'});
 }catch{reply(res,503,{error:'Request or database unavailable'})}
});
app.listen(8784,'127.0.0.1',()=>console.log('FOUNDER_APPROVAL http://127.0.0.1:8784'));
process.on('SIGINT',async()=>{app.close();await closeDb();process.exit(0)});
