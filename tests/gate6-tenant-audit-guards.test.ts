import {test} from 'node:test';
import assert from 'node:assert/strict';
import audit from '../api/core/gate6-tenant-audit.js';
type Reply={statusCode:number;body:any;headers:Record<string,string>;
 setHeader:(k:string,v:string)=>Reply;status:(n:number)=>Reply;json:(v:any)=>Reply};
function reply():Reply{
 return {statusCode:200,body:null,headers:{},
  setHeader(k:string,v:string){this.headers[k.toLowerCase()]=v;return this;},
  status(n:number){this.statusCode=n;return this;},
  json(v:any){this.body=v;return this;}};
}
async function call(method='GET',headers={}){
 const res=reply();
 await audit({method,headers,socket:{remoteAddress:'127.0.0.24'}},res);
 return res;
}
test('Gate 6 tenant diagnostic is absent outside preview',async()=>{
 const old=process.env.VERCEL_ENV;
 try{
  process.env.VERCEL_ENV='production';
  const r=await call();
  assert.equal(r.statusCode,404);
  assert.equal(r.body.error,'Not found');
 }finally{
  if(old===undefined)delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV=old;
 }
});
test('Gate 6 tenant diagnostic rejects mutation, cross-site and missing founder cookie before DB',async()=>{
 const old=process.env.VERCEL_ENV;
 try{
  process.env.VERCEL_ENV='preview';
  assert.equal((await call('POST')).statusCode,405);
  assert.equal((await call('GET',{'sec-fetch-site':'cross-site'})).statusCode,403);
  const r=await call();
  assert.equal(r.statusCode,401);
  assert.equal(r.body.error,'Founder session required');
  assert.equal(r.headers['cache-control'],'private, no-store');
 }finally{
  if(old===undefined)delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV=old;
 }
});
