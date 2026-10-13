/**
 * End-to-end read-only God's Eye development acceptance using actual isolated Postgres.
 * Never exposes the local bearer credential. Never opens a network listener or writes DB.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {db,closeDb} from '../core/database/client.js';
import {jobTraceDevelopmentHandler} from '../core/runtime/jobTraceDevelopment.js';
const u=new URL(process.env.DATABASE_URL||'http://invalid');
assert.ok(['postgres:','postgresql:'].includes(u.protocol));
assert.equal(u.hostname,'127.0.0.1');
assert.ok(!u.port||u.port==='5432');
assert.equal(u.pathname,'/pegasus_world_windows_accept_1011');
assert.equal(decodeURIComponent(u.username),'pegasus_windows_accept_role');
assert.notEqual(process.env.NODE_ENV,'production');
const token=readFileSync('C:/Users/info/PegasusVoiceEngine/acceptance-isolated/.jarvis-local-ui-token','utf8').trim();
assert.ok(token.length>=32);

type TestRes={statusCode:number;body:any;headers:Record<string,string>;status:(n:number)=>TestRes;setHeader:(k:string,v:string)=>TestRes;json:(x:any)=>TestRes;end:()=>TestRes};
function response():TestRes{
 const r:TestRes={statusCode:200,body:null,headers:{},
  status(n){r.statusCode=n;return r},
  setHeader(k,v){r.headers[k.toLowerCase()]=v;return r},
  json(v){r.body=v;return r},
  end(){return r}};
 return r;
}
function request(opts:{bearer:string;remote?:string;origin?:string;method?:string}){
 const heads:{[k:string]:string}={authorization:'Bearer '+opts.bearer};
 if(opts.origin)heads.origin=opts.origin;
 return {method:opts.method||'GET',socket:{remoteAddress:opts.remote||'127.0.0.1'},
  get(k:string){return heads[k.toLowerCase()]||undefined}} as any;
}
const sql=db();
try{
 const [i]=await sql`SELECT current_database() db,current_user role`;
 assert.equal(i.db,'pegasus_world_windows_accept_1011');
 assert.equal(i.role,'pegasus_windows_accept_role');
 const rejected=response();
 await jobTraceDevelopmentHandler(request({bearer:'totally-wrong-token'}),rejected as any);
 assert.equal(rejected.statusCode,401);
 const wrongOrigin=response();
 await jobTraceDevelopmentHandler(request({bearer:token,origin:'https://attacker.example'}),wrongOrigin as any);
 assert.equal(wrongOrigin.statusCode,403);
 const remote=response();
 await jobTraceDevelopmentHandler(request({bearer:token,remote:'203.0.113.9'}),remote as any);
 assert.equal(remote.statusCode,403);
 const attemptedWrite=response();
 await jobTraceDevelopmentHandler(request({bearer:token,method:'POST'}),attemptedWrite as any);
 assert.equal(attemptedWrite.statusCode,405);
 const permitted=response();
 await jobTraceDevelopmentHandler(request({bearer:token}),permitted as any);
 assert.equal(permitted.statusCode,200);
 assert.equal(permitted.body.scope,'windows-isolated-development');
 assert.equal(permitted.body.readOnly,true);
 assert.equal(permitted.body.status,'live');
 assert.equal(permitted.headers['cache-control'],'no-store, private');
 assert.ok(Array.isArray(permitted.body.records));
 assert.ok(permitted.body.records.length>0,'No isolated jobs are available');
 const completed=permitted.body.records.find((j:any)=>j.skill==='astra_knowledge_draft'&&j.status==='completed');
 assert.ok(completed,'Latest isolated Astra completion absent from live trace');
 assert.ok(completed.runs.some((x:any)=>x.status==='completed'));
 assert.ok(completed.events.some((x:any)=>x.type==='job_completed'));
 assert.ok(completed.evidence.length>=2);
 assert.ok(completed.memoryIds.length>=1);
 for(const record of permitted.body.records){
  assert.equal(Object.hasOwn(record,'input'),false);
  assert.equal(Object.hasOwn(record,'result'),false);
  assert.equal(Object.hasOwn(record,'question'),false);
 }
 console.log('P0_GODS_EYE_REAL_POSTGRES_READ_PASS',JSON.stringify({
  database:i.db,readOnly:true,scope:permitted.body.scope,records:permitted.body.records.length,
  completedJobId:completed.jobId,completedRuns:completed.runs.filter((x:any)=>x.status==='completed').length,
  evidenceCount:completed.evidence.length,memoryIds:completed.memoryIds.length,
  unauthorizedDenied:true,nonlocalDenied:true,foreignOriginDenied:true,writeDenied:true,
  credentialsExposed:false,productionChanges:false
 }));
}finally{await closeDb();}
