import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const stagingRequire=createRequire('C:/Users/info/PegasusVoiceEngine/acceptance-isolated/s02-auth-staging/package.json');
const {SignJWT}=await import(pathToFileURL(stagingRequire.resolve('jose')).href);
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
const folder=process.env.PEGASUS_S02_AUTH_LIB_PATH||'C:/Users/info/PegasusVoiceEngine/acceptance-isolated/s02-auth-staging/node_modules/@neondatabase/auth/dist/server-b0OzGjXl.mjs';
const auth=await import(pathToFileURL(folder).href);
const secret='s02-isolated-cache-integration-secret-thirty-two-characters-long';
const sessions=new Map();
let visits=0;
const server=createServer((req,res)=>{
 visits++;
 const token=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(auth.S+'='))?.slice(auth.S.length+1);
 const s=sessions.get(token);
 if(req.url?.startsWith('/get-session')&&s&&s.exp>Date.now()){
   const now=new Date().toISOString();
   res.writeHead(200,{'content-type':'application/json'});
   res.end(JSON.stringify({session:{id:'session-1',token,expiresAt:new Date(s.exp).toISOString(),createdAt:now,updatedAt:now},user:{id:'staging-student',email:'student@example.invalid',createdAt:now,updatedAt:now}}));
 }else if(req.url?.startsWith('/sign-out')&&req.method==='POST'){
   sessions.delete(token);res.writeHead(200,{'content-type':'application/json'});res.end('{}');
 }else{res.writeHead(401,{'content-type':'application/json'});res.end(JSON.stringify({session:null,user:null}));}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const baseUrl='http://127.0.0.1:'+server.address().port;
const token='test-token-local-only';
sessions.set(token,{exp:Date.now()+60000});
const getReq=(cookie)=>new Request('http://127.0.0.1:7777/api/auth/get-session',{headers:{cookie}});
const mw=async(cookie)=>auth.t({request:new Request('http://127.0.0.1:7777/secure',{headers:{cookie}}),pathname:'/secure',skipRoutes:[],loginUrl:'/auth/sign-in',baseUrl,cookieSecret:secret,sessionDataTtl:300});
try{
 const first=await auth.a({request:getReq(auth.S+'='+token),path:'get-session',baseUrl,cookieSecret:secret,sessionDataTtl:300});
 assert.equal(first.status,200);
 const cookie=first.headers.getSetCookie().find(x=>x.startsWith(auth.C+'='));
 assert.ok(cookie,'SDK did not mint signed session-data cookie');
 for(const part of ['HttpOnly','Secure','SameSite=Lax'])assert.ok(cookie.includes(part),'missing cookie policy: '+part);
 const cacheToken=cookie.split(';')[0];
 const cachePayload=cacheToken.slice(auth.C.length+1);
 assert.equal((await auth.m(cachePayload,secret)).valid,true);
 assert.equal((await auth.m(cachePayload,'wrong-secret-32chars-too-short-xxx')).valid,false);
 console.log('S02_SIGNED_CACHE_COOKIE_FLAGS_AND_SIGNATURE_PASS'); const expiredSigned=await new SignJWT({session:{id:'session-expired'},user:{id:'staging-student'}}).setProtectedHeader({alg:'HS256'}).setExpirationTime(Math.floor(Date.now()/1000)-20).sign(new TextEncoder().encode(secret));
 assert.equal((await auth.m(expiredSigned,secret)).valid,false);
 const refreshed=await auth.a({request:getReq(auth.S+'='+token+'; '+auth.C+'='+expiredSigned),path:'get-session',baseUrl,cookieSecret:secret,sessionDataTtl:300});
 assert.equal(refreshed.status,200);
 assert.ok(refreshed.headers.getSetCookie().some(x=>x.startsWith(auth.C+'=')));
 console.log('S02_EXPIRED_SIGNED_CACHE_REFRESHED_FROM_ACTIVE_PROVIDER_SESSION');
 const full=auth.S+'='+token+'; '+cacheToken;
 const before=visits;
 assert.equal((await mw(full)).action,'allow');
 console.log('S02_CACHE_MIDDLEWARE_ALLOWED',JSON.stringify({providerRequestDelta:visits-before}));
 const signOut=await auth.a({request:new Request('http://127.0.0.1:7777/api/auth/sign-out',{method:'POST',headers:{cookie:auth.S+'='+token,'content-type':'application/json'},body:'{}'}),path:'sign-out',baseUrl,cookieSecret:secret,sessionDataTtl:300});
 assert.equal(signOut.status,200);
 assert.equal(sessions.has(token),false);
 assert.equal((await mw(auth.S+'='+token)).action,'redirect_login');
 const withCache=await mw(full);
 console.log('S02_REVOKED_WITH_VALID_CACHE',withCache.action); const forceFresh=await auth.t({request:new Request('http://127.0.0.1:7777/secure?disableCookieCache=true',{headers:{cookie:full}}),pathname:'/secure',skipRoutes:[],loginUrl:'/auth/sign-in',baseUrl,cookieSecret:secret,sessionDataTtl:300,logLevel:'silent'});
 assert.equal(forceFresh.action,'redirect_login');
 console.log('S02_REVOKED_FORCED_REVALIDATION_DENIED',forceFresh.action);
 console.log('S02_LOCAL_CACHE_INTEGRATION_TEST_PASSED',JSON.stringify({cookieFlags:['HttpOnly','Secure','SameSite=Lax'],freshRevokedDenied:true,revokedCacheAction:withCache.action,provider:'isolated-mock'}));
}finally{await new Promise(ok=>server.close(ok));}
