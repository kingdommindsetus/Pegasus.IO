import {createServer} from 'node:http';
const sessions=new Map([
 ['founder-stage',{id:'founder-stage',email:'founder@staging.invalid',exp:Date.now()+3600000}],
 ['educator-stage',{id:'educator-stage',email:'educator@staging.invalid',exp:Date.now()+3600000}],
 ['student-expired',{id:'student-stage',email:'student@staging.invalid',exp:Date.now()-300000}]
]);
const server=createServer((req,res)=>{
 const cookie=String(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('__Secure-neon-auth.session_token='))||'';
 const token=cookie.split('=').slice(1).join('=');
 const v=sessions.get(token);console.log('S02_IDP',req.method,req.url,'cookieName',cookie.split('=')[0], 'found',Boolean(v), 'valid',Boolean(v&&v.exp>Date.now()));
 if(req.url?.includes('get-session')&&v&&v.exp>Date.now()){
  const now=new Date().toISOString();
  res.writeHead(200,{'content-type':'application/json'});
  res.end(JSON.stringify({session:{id:v.id,token,expiresAt:new Date(v.exp).toISOString(),createdAt:now,updatedAt:now},user:{id:v.id,email:v.email,createdAt:now,updatedAt:now}}));
 }else if(req.url?.includes('sign-out')&&req.method==='POST'){
  sessions.delete(token);res.writeHead(200,{'content-type':'application/json'});res.end('{}');
 }else{res.writeHead(401,{'content-type':'application/json'});res.end(JSON.stringify({session:null,user:null}));}
});
server.listen(48983,'127.0.0.1',()=>console.log('S02_STAGING_IDP_READY_48983'));
