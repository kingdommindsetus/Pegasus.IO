import assert from 'node:assert/strict';
import {test} from 'node:test';
import {makeSessionCookie} from '../api/core/_security.js';
import stagingDiagnostics from '../api/core/staging-diagnostics.js';

type R={statusCode:number;body:any;headers:Record<string,string>;setHeader:(k:string,v:string)=>R;status:(n:number)=>R;json:(v:any)=>R};
let index=0;
function response():R{
 const r:R={statusCode:200,body:null,headers:{},
  setHeader(k,v){r.headers[k.toLowerCase()]=v;return r;},
  status(n){r.statusCode=n;return r;},json(v){r.body=v;return r}};
 return r;
}
async function invoke(opts:{method?:string;cookie?:string;crossSite?:boolean;serviceSecret?:boolean}={}){
 const res=response();
 await stagingDiagnostics({
  method:opts.method||'GET',query:{},
  headers:{...(opts.cookie?{cookie:opts.cookie}:{}),
   ...(opts.crossSite?{'sec-fetch-site':'cross-site'}:{}),
   ...(opts.serviceSecret?{'x-pegasus-core-secret':process.env.PEGASUS_CORE_API_SECRET}:{})},
  socket:{remoteAddress:'127.88.0.'+(++index)}
 },res);
 return res;
}
test('preview database diagnostics only allow authorized founder session',async()=>{
 const oldEnv=process.env.VERCEL_ENV;
 const oldKey=process.env.PEGASUS_CORE_API_SECRET;
 try{
  process.env.PEGASUS_CORE_API_SECRET='synthetic-preview-guard-secret';
  const cookie='pegasus_core_session='+makeSessionCookie();
  process.env.VERCEL_ENV='production';
  assert.equal((await invoke({cookie})).statusCode,404);
  delete process.env.VERCEL_ENV;
  assert.equal((await invoke({cookie})).statusCode,404);
  process.env.VERCEL_ENV='preview';
  assert.equal((await invoke()).statusCode,401);
  assert.equal((await invoke({serviceSecret:true})).statusCode,401);
  assert.equal((await invoke({cookie:'pegasus_core_session=forged'})).statusCode,401);
  assert.equal((await invoke({cookie,crossSite:true})).statusCode,403);
  assert.equal((await invoke({cookie,method:'POST'})).statusCode,405);
  console.log('PEGASUS_PREVIEW_DB_DIAGNOSTICS_DENY_PASS',JSON.stringify({
   productionDisabled:true,unconfiguredDisabled:true,sessionRequired:true,
   serviceSecretDenied:true,forgedCookieDenied:true,crossSiteDenied:true,
   mutationsDenied:true,remoteConnections:0
  }));
 }finally{
  if(oldEnv===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=oldEnv;
  if(oldKey===undefined)delete process.env.PEGASUS_CORE_API_SECRET;else process.env.PEGASUS_CORE_API_SECRET=oldKey;
 }
});
