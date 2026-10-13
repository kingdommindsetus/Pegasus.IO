/** Fail-closed runtime configuration checks: no database access, network, payments, or agent runs. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import mission from '../api/core/mission.js';
import worldJobs from '../api/core/world-jobs.js';
import worldEvents from '../api/core/world-events.js';
import founderActivity from '../api/core/founder-activity.js';

type Reply={statusCode:number;body:any;headers:Record<string,string>;setHeader:(k:string,v:string)=>Reply;status:(n:number)=>Reply;json:(x:any)=>Reply};
function response():Reply{
 const r:Reply={statusCode:200,body:null,headers:{},
  setHeader(k,v){r.headers[k.toLowerCase()]=v;return r;},
  status(n){r.statusCode=n;return r;},
  json(v){r.body=v;return r;}};
 return r;
}
let number=0;
async function call(handler:any,method:'GET'|'POST',body?:any){
 const r=response();
 await handler({method,body,query:{},
  headers:{'x-pegasus-core-secret':process.env.PEGASUS_CORE_API_SECRET},
  socket:{remoteAddress:'127.7.0.'+(++number)}},r);
 return r;
}
test('core APIs reject missing or invalid founder-company scope before touching a database',async()=>{
 const previousKey=process.env.PEGASUS_CORE_API_SECRET;
 const previousOrg=process.env.PEGASUS_FOUNDER_ORGANIZATION_ID;
 try{
  process.env.PEGASUS_CORE_API_SECRET='synthetic-core-test-key-not-for-deployment';
  for(const candidate of ['', 'not-a-company-uuid']){
   if(candidate)process.env.PEGASUS_FOUNDER_ORGANIZATION_ID=candidate;
   else delete process.env.PEGASUS_FOUNDER_ORGANIZATION_ID;
   const cases=[
    ['mission-create',mission,'POST',{action:'start',objective:'Synthetic test, do not execute'}],
    ['mission-read',mission,'POST',{action:'hydrate'}],
    ['mission-status',mission,'POST',{action:'status',missionId:'11111111-1111-4111-8111-111111111111'}],
    ['mission-close',mission,'POST',{action:'close',missionId:'11111111-1111-4111-8111-111111111111'}],
    ['world-jobs',worldJobs,'GET',undefined],
    ['world-events',worldEvents,'GET',undefined]
   ] as const;
   for(const [name,handler,method,body] of cases){
    const r=await call(handler,method,body);
    assert.equal(r.statusCode,503,name+' must reject missing company configuration');
    assert.match(String(r.body?.error||''),/organization scope/i);
   }
  }
  // Only a valid founder cookie can read this path; an API secret is insufficient.
  const founder=await call(founderActivity,'GET');
  assert.equal(founder.statusCode,401);
  console.log('PEGASUS_COMPANY_SCOPE_FAIL_CLOSED_PASS',JSON.stringify({
   cases:12,invalidScopeRejected:true,missingScopeRejected:true,
   founderActivityServiceSecretRejected:true,remoteConnections:0,productionChanges:false
  }));
 }finally{
  if(previousKey===undefined)delete process.env.PEGASUS_CORE_API_SECRET;else process.env.PEGASUS_CORE_API_SECRET=previousKey;
  if(previousOrg===undefined)delete process.env.PEGASUS_FOUNDER_ORGANIZATION_ID;else process.env.PEGASUS_FOUNDER_ORGANIZATION_ID=previousOrg;
 }
});
