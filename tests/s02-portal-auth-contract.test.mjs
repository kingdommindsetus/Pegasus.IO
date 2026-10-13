import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {test} from 'node:test';
const repository='C:/Users/info/kmce-educator-platform';
const read=(file)=>execFileSync('git',['-C',repository,'show','origin/main:'+file],{encoding:'utf8'});
const auth=read('frontend/lib/auth/server.ts');
const sessions=read('frontend/lib/auth.ts');
const middleware=read('frontend/middleware.ts');
const me=read('frontend/app/api/auth/me/route.ts');
const performance=read('frontend/app/api/educator/performance/route.ts');
const events=read('frontend/app/api/educator/events/route.ts');
const admin=read('frontend/app/api/admin/educators/[id]/finance/route.ts');
test('portal uses Neon Auth and a session cache TTL, not a specified login duration',()=>{
 assert.match(auth,/createNeonAuth/);assert.match(auth,/sessionDataTtl:300/);
});
test('middleware protects educator API and protects authenticated routes by default',()=>{
 assert.match(middleware,/auth\.middleware/);assert.match(middleware,/loginUrl/);
 assert.doesNotMatch(middleware,/api\/educator\/performance|api\/educator\/events/);
});
test('session-backed role and ownership restrictions exist',()=>{
 assert.match(sessions,/auth\.getSession\(\)/);assert.match(sessions,/FOUNDЕР_ADMIN|FOUNDER_ADMIN/);
 assert.match(sessions,/u\.role===\"EDUCATOR\"\s*&&\s*Number\(u\.educator_id\)===educatorId/);
 assert.match(performance,/user\.role!==\"EDUCATOR\"/);assert.match(performance,/WHERE educator_id=\$\{educatorId\}/);
 assert.match(events,/user\.role!==\"EDUCATOR\"/);
 assert.match(admin,/requireFounder\(\)/);
});
test('self-auth endpoint returns 401 without an authenticated app user',()=>{
 assert.match(me,/status:401/);
});
test('risk: auth source contains explicit development fallback and identity lookup performs writes',()=>{
 assert.match(auth,/build-time-placeholder-change-in-production/);
 assert.match(sessions,/INSERT INTO app_users/);assert.match(sessions,/ON CONFLICT\(email\) DO UPDATE/);
});
