import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
const modulePath='C:/Users/info/PegasusVoiceEngine/acceptance-isolated/s02-auth-staging/node_modules/@neondatabase/auth/dist/server-b0OzGjXl.mjs';
const auth=await import(pathToFileURL(modulePath).href);
const secret='s02-isolated-test-only-local-secret-at-least-thirty-two-chars';
auth.u({secret,sessionDataTtl:300});
assert.throws(()=>auth.u({secret:'bad'}),/at least 32/);
const active=new Map();
let requests=0;
const server=createServer(async(req,res)=>{
 requests++;
 const cookie=String(req.headers.cookie||'');
 const match=cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith(auth.S+'='))?.split('=');
 const entry=match&&active.get(match.slice(1).join('='));
 if(req.url?.includes('get-session')&&entry&&entry.expires>Date.now()){
  res.writeHead(200,{'Content-Type':'application/json'});
  res.end(JSON.stringify({session:{id:entry.id,token:match[1],expiresAt:new Date(entry.expires).toISOString(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},user:{id:entry.id,email:entry.email,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}));
 }else{res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({session:null,user:null}));}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const baseUrl='http://127.0.0.1:'+server.address().port;
const roleBindings=new Map([['founder-1',{role:'FOUNDER_ADMIN'}],['educator-1',{role:'EDUCATOR',educatorId:11}],['educator-2',{role:'EDUCATOR',educatorId:22}],['student-1',{role:'STUDENT',enrollmentId:101}],['student-2',{role:'STUDENT',enrollmentId:202}]]);
const request=(token='')=>new Request('http://127.0.0.1:7777/secure',{headers:token?{cookie:auth.S+'='+token}:{}});
const check=(token='')=>auth.t({request:request(token),pathname:'/secure',skipRoutes:[],loginUrl:'/auth/sign-in',baseUrl,cookieSecret:secret,sessionDataTtl:300,logLevel:'silent'});
const issue=(id,expires=Date.now()+60000)=>{const token='isolated-'+id+'-'+(active.size+1);active.set(token,{id,email:id+'@test.invalid',expires});return token;};
const gate=(token,action,ownerId)=>{
 const entry=active.get(token);if(!entry||entry.expires<=Date.now())return false;
 const binding=roleBindings.get(entry.id);if(!binding)return false;
 if(action==='founder')return binding.role==='FOUNDER_ADMIN';
 if(action==='educator')return binding.role==='EDUCATOR'&&binding.educatorId===ownerId;
 if(action==='student')return binding.role==='STUDENT'&&binding.enrollmentId===ownerId;
 return false;
};
try{
 assert.equal((await check()).action,'redirect_login');
 assert.equal((await check('forged')).action,'redirect_login');
 console.log('S02_UNAUTHORIZED_AND_FORGED_DENIED');
 const founder=issue('founder-1'),edu1=issue('educator-1'),edu2=issue('educator-2'),student1=issue('student-1'),student2=issue('student-2');
 for(const token of [founder,edu1,edu2,student1,student2])assert.equal((await check(token)).action,'allow');
 console.log('S02_ACTIVE_STAGING_SESSIONS_ALLOWED',5);
 assert.ok(gate(founder,'founder'));
 assert.ok(!gate(edu1,'founder')&&!gate(student1,'founder'));
 assert.ok(gate(edu1,'educator',11)&&!gate(edu1,'educator',22)&&!gate(edu2,'educator',11));
 assert.ok(gate(student1,'student',101)&&!gate(student1,'student',202)&&!gate(student2,'student',101));
 console.log('S02_ROLE_AND_TENANT_NEGATIVE_PASS');
 const expired=issue('student-1',Date.now()-5000);
 assert.equal((await check(expired)).action,'redirect_login');assert.equal(gate(expired,'student',101),false);
 console.log('S02_EXPIRED_SESSION_DENIED');
 active.delete(edu1);
 assert.equal((await check(edu1)).action,'redirect_login');
 console.log('S02_LOGOUT_OR_REVOKE_DENIED');
 // Simulate provider-issued renewal of an authenticated session; no user-facing cookie modification.
 const refreshed=issue('educator-1',Date.now()+90000);
 assert.equal((await check(refreshed)).action,'allow');
 assert.ok(gate(refreshed,'educator',11));
 console.log('S02_PROVIDER_REFRESHED_SESSION_ALLOWED');
 // Store a forged signed session-data cookie without a session token: cached data must not grant access.
 assert.equal((await auth.t({request:new Request('http://127.0.0.1:7777/secure',{headers:{cookie:auth.C+'=forged'}}),pathname:'/secure',skipRoutes:[],loginUrl:'/auth/sign-in',baseUrl,cookieSecret:secret,sessionDataTtl:300})).action,'redirect_login');
 console.log('S02_CACHE_ONLY_COOKIE_DENIED');
 console.log('S02_LOCAL_AUTH_CORE_ACCEPTANCE_PASSED',JSON.stringify({requests,identities:5,provider:'local-mock',productionAccess:false}));
}finally{await new Promise(ok=>server.close(ok));}
