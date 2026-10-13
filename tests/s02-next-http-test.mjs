import assert from 'node:assert/strict';
const base='http://127.0.0.1:4327';
for(const [name,cookie] of [
 ['missing',''],['forged','__Secure-neon-auth.session_token=forged'],
 ['valid','__Secure-neon-auth.session_token=educator-stage'],
 ['expired','__Secure-neon-auth.session_token=student-expired'],
]){
 const headers=cookie?{Cookie:cookie}:{};
 const response=await fetch(base+'/secure',{headers,redirect:'manual',signal:AbortSignal.timeout(20000)});
 const location=response.headers.get('location')||'';
 console.log('S02_NEXT_ROUTE',name,response.status,location.slice(0,80));
 assert.ok([200,302,303,307,308].includes(response.status));
 if(name==='valid'){assert.equal(response.status,200);}
 else{assert.ok([302,303,307,308].includes(response.status));assert.match(location,/auth\/sign-in/);}
}
console.log('S02_NEXT_WRAPPER_SMOKE_PASSED');
