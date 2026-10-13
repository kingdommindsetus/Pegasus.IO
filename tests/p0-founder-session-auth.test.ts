import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {test} from 'node:test';
import sessionHandler from '../api/core/session.js';

type R={statusCode:number;body:any;headers:Record<string,string>;setHeader:(k:string,v:string)=>R;status:(n:number)=>R;json:(x:any)=>R};
function response():R{
 const r:R={statusCode:200,body:null,headers:{},
  setHeader(k,v){r.headers[k.toLowerCase()]=v;return r},
  status(n){r.statusCode=n;return r},
  json(v){r.body=v;return r}};
 return r;
}
let index=0;
async function call(method:string,body?:Record<string,unknown>,cookie?:string){
 const headers:Record<string,string>=cookie?{cookie}:{};
 const req={method,body,headers,socket:{remoteAddress:'127.0.0.'+(10+(index++))}};
 const res=response();
 await sessionHandler(req,res);
 return res;
}
test('founder session always requires actual server-side credentials',async()=>{
 const originalKey=process.env.PEGASUS_CORE_API_SECRET;
 const originalPassword=process.env.PEGASUS_ADMIN_PASSWORD;
 const secret='isolated-auth-acceptance-signing-key-only-2026';
 const password='Synthetic-Pegasus-Founder-Password-Not-Real';
 try{
  delete process.env.PEGASUS_CORE_API_SECRET;
  delete process.env.PEGASUS_ADMIN_PASSWORD;
  const noSecrets=await call('POST',{action:'login',password});
  assert.equal(noSecrets.statusCode,503);
  assert.equal(noSecrets.headers['set-cookie'],undefined);
  process.env.PEGASUS_CORE_API_SECRET=secret;
  const noPasswordConfig=await call('POST',{action:'login',password});
  assert.equal(noPasswordConfig.statusCode,503);
  assert.equal(noPasswordConfig.headers['set-cookie'],undefined);
  process.env.PEGASUS_ADMIN_PASSWORD=password;
  const noPassword=await call('POST',{action:'login'});
  const bad=await call('POST',{action:'login',password:'invalid'});
  for(const result of [noPassword,bad]){
   assert.equal(result.statusCode,401);
   assert.equal(result.body.error,'Unauthorized');
   assert.equal(result.headers['set-cookie'],undefined);
  }
  const unknown=await call('POST',{action:'elevate',password});
  assert.equal(unknown.statusCode,400);
  assert.equal(unknown.headers['set-cookie'],undefined);
  const valid=await call('POST',{action:'login',password});
  assert.equal(valid.statusCode,200);
  assert.equal(valid.body.passwordRequired,true);
  assert.equal(valid.body.ok,true);
  const setCookie=valid.headers['set-cookie'];
  assert.match(setCookie,/pegasus_core_session=/);
  assert.match(setCookie,/HttpOnly/);
  assert.match(setCookie,/Secure/);
  assert.match(setCookie,/SameSite=Strict/);
  assert.equal(setCookie.includes(password),false);
  const browserCookie=setCookie.split(';')[0];
  const authorized=await call('GET',undefined,browserCookie);
  assert.equal(authorized.statusCode,200);
  const unsigned=await call('GET',undefined,'pegasus_core_session=forged');
  assert.equal(unsigned.statusCode,401);
  const signedExpiredPayload=Buffer.from(JSON.stringify({role:'founder',exp:Date.now()-5000})).toString('base64url');
  const expiredSig=createHmac('sha256',secret).update(signedExpiredPayload).digest('hex');
  const expired=await call('GET',undefined,'pegasus_core_session='+signedExpiredPayload+'.'+expiredSig);
  assert.equal(expired.statusCode,401);
  const unsupported=await call('PUT',{action:'login',password});
  assert.equal(unsupported.statusCode,405);
  assert.equal(unsupported.headers['set-cookie'],undefined);
  const logout=await call('POST',{action:'logout'});
  assert.equal(logout.statusCode,200);
  assert.match(logout.headers['set-cookie'],/Max-Age=0/);
  console.log('PEGASUS_FOUNDER_SESSION_DENIAL_AND_LOGIN_PASS',JSON.stringify({
   noConfigDenied:true,missingPasswordDenied:true,wrongPasswordDenied:true,
   founderCookieHttpOnly:true,forgedDenied:true,expiredDenied:true,
   logoutClearsSession:true,credentialsExposed:false,productionConnections:0
  }));
 }finally{
  if(originalKey===undefined)delete process.env.PEGASUS_CORE_API_SECRET;
  else process.env.PEGASUS_CORE_API_SECRET=originalKey;
  if(originalPassword===undefined)delete process.env.PEGASUS_ADMIN_PASSWORD;
  else process.env.PEGASUS_ADMIN_PASSWORD=originalPassword;
 }
});
