import {createServer} from 'node:http';
import {db,closeDb} from '../core/database/client.js';
import {getPegasusVoiceForPlayback} from '../src/agents/voice-core/voiceRegistryCore.js';
const uri=new URL(process.env.DATABASE_URL||'http://invalid');
if(uri.hostname!=='127.0.0.1'||uri.pathname!=='/pegasus_world_accept_1011')throw Error('Isolated database required');
const sql=db();
const esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const server=createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'||req.url!=='/'){res.writeHead(404);res.end('Not found');return}
 try{
 const jobs=await sql`SELECT j.id,j.agent_id,j.status,j.attempts,j.result,j.updated_at,t.title FROM pegasus_core.jobs j JOIN pegasus_core.tasks t ON t.id=j.task_id ORDER BY j.updated_at DESC LIMIT 30`;
 const events=await sql`SELECT e.entity_id,e.agent_id,e.event_type,e.created_at FROM pegasus_core.events e WHERE e.entity_type='job' ORDER BY id DESC LIMIT 50`;
 const cards=jobs.map(j=>'<article><h2>'+esc(j.agent_id)+' <small>'+esc(j.status)+'</small></h2><p>'+esc(j.title)+'</p><p>Job '+esc(j.id)+' · Attempt '+esc(j.attempts)+'</p><p>Voice '+esc(getPegasusVoiceForPlayback(j.agent_id)?.voiceId||'unregistered')+'</p><pre>'+esc(JSON.stringify(j.result||{},null,2))+'</pre></article>').join('');
 const rows=events.map(e=>'<tr><td>'+esc(e.agent_id)+'</td><td>'+esc(e.event_type)+'</td><td>'+esc(e.entity_id)+'</td></tr>').join('');
 const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="5"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KMCE Agent World · PostgreSQL Acceptance</title><style>body{font:16px system-ui;background:#080d14;color:#f4e8d2;max-width:1050px;margin:auto;padding:30px}h1{color:#e0bd83}article{border:1px solid #927952;border-radius:14px;padding:18px;margin:15px 0;background:#17202d}small{color:#96d8b4}pre{white-space:pre-wrap;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse}td{padding:9px;border-bottom:1px solid #39414c}</style><h1>KMCE AGENT WORLD · CORE EXECUTION</h1><p>Authoritative PostgreSQL · local isolated test database · refreshes every 5 seconds · read-only</p>'+cards+'<h2>Core job events</h2><table>'+rows+'</table></html>';
 res.setHeader('Content-Type','text/html; charset=utf-8');res.writeHead(200);res.end(html);
 }catch(e){res.writeHead(503);res.end('Database unavailable')}
});
server.listen(8781,'127.0.0.1',()=>console.log('WORLD_ACCEPTANCE_VIEW http://127.0.0.1:8781'));
process.on('SIGINT',async()=>{server.close();await closeDb();process.exit(0)});
