import assert from 'node:assert/strict';
import {test} from 'node:test';
const publicPaths=['/auth/sign-in','/api/public/certificate/test','/api/public/evaluation/test','/checkout','/register','/_next/static/example.js'];
const protectedPaths=['/','/secure','/founder','/educator','/student','/api/auth/me','/api/admin/educators/2/finance','/api/educator/performance','/api/faculty/documents'];
const isPublic=(path)=>/^\/(?:auth(?:\/|$)|api\/public(?:\/|$)|checkout(?:\/|$)|register(?:\/|$)|_next(?:\/|$))/.test(path);
function signedProviderQuery(url){
 const parsed=new URL(url,'http://localhost');
 if(!isPublic(parsed.pathname))parsed.searchParams.set('disableCookieCache','true');
 return parsed;
}
test('all named privileged pages and APIs force provider session revalidation',()=>{
 for(const path of protectedPaths){
  for(const suffix of ['', '?disableCookieCache=false','?disableCookieCache=0']){
   const url=signedProviderQuery(path+suffix);
   assert.equal(url.searchParams.get('disableCookieCache'),'true',path+suffix);
  }
 }
});
test('public route exclusions remain explicit and narrow',()=>{
 for(const path of publicPaths)assert.ok(isPublic(path),path);
 for(const path of protectedPaths)assert.ok(!isPublic(path),path);
});
test('protected route parameter spoofing cannot disable revalidation',()=>{
 for(const path of ['/api/educator/performance','/api/admin/educators/2/finance']){
  const url=signedProviderQuery(path+'?disableCookieCache=false');
  assert.equal(url.searchParams.getAll('disableCookieCache').length,1);
  assert.equal(url.searchParams.get('disableCookieCache'),'true');
 }
});
