import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {db,closeDb} from '../core/database/client.js';
const database=new URL(process.env.DATABASE_URL||'http://invalid');
if(database.hostname!=='127.0.0.1'||database.pathname!=='/pegasus_world_accept_1011')throw Error('Isolated development database required');
const root=resolve('C:/Users/info/PegasusVoiceEngine/agent-world-core-connected');
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.webp':'image/webp','.svg':'image/svg+xml','.css':'text/css','.js':'application/javascript'};
const sql=db();
const srv=createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='GET'){res.writeHead(405);res.end('Method not allowed');return}
 try {
  const u=new URL(req.url||'/', 'http://localhost');
  if(u.pathname==='/api/gatekeeper-status'){
   const rows=await sql`SELECT status::text AS status,count(*)::int AS total FROM pegasus_core.approvals WHERE requested_by_agent_id='gatekeeper' GROUP BY status`;
   const counts={pending:0,approved:0,rejected:0};
   for(const r of rows){if(Object.prototype.hasOwnProperty.call(counts,r.status))counts[r.status as keyof typeof counts]=r.total}
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({source:'pegasus_core.approvals',...counts}));return;
  }
  if(u.pathname==='/api/core-jobs'){
   const jobs=await sql`SELECT j.id,j.agent_id,j.status,j.attempts,j.updated_at,t.title FROM pegasus_core.jobs j LEFT JOIN pegasus_core.tasks t ON t.id=j.task_id ORDER BY j.updated_at DESC LIMIT 100`;
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify({source:'pegasus_core.jobs',jobs:jobs.map(j=>({id:j.id,agentId:j.agent_id,status:j.status,title:j.title||'',attempts:j.attempts,updatedAt:j.updated_at}))}));return;
  }
  let relative=decodeURIComponent(u.pathname);
  if(relative.includes('..')||relative.includes('\\'))throw Error('Invalid file path');
  const file=resolve(root,'.'+(relative==='/'?'/index.html':relative));
  if(file!==root&&!file.startsWith(root+sep))throw Error('Invalid file path');
  const info=await stat(file);if(!info.isFile())throw Error('Not a file');
  const ext=file.slice(file.lastIndexOf('.')).toLowerCase();res.setHeader('Content-Type',mime[ext]||'application/octet-stream');
  const buf=await readFile(file);res.end(buf);
 }catch(e){res.writeHead(503);res.end('Unavailable')}
});
srv.listen(8783,'127.0.0.1',()=>console.log('AUTHORITATIVE_AGENT_WORLD http://127.0.0.1:8783'));
process.on('SIGINT',async()=>{srv.close();await closeDb();process.exit(0)});
