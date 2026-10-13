import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authorizeIsolatedIntent,assertIsolatedIntent} from '../core/work/jobs/isolatedSafetyPolicy.js';
const base={objectiveId:'cbe5f353-25de-4daa-a69e-09b326299fea',
 databaseUrl:'postgresql://pegasus_windows_accept_role:unused@127.0.0.1:5432/pegasus_world_windows_accept_1011',
 agentId:'simon',skillKey:'search_company_memory',input:{draftOnly:true,externalActionsAllowed:false}};
test('scoped internal draft-only operation allowed',()=>assert.equal(authorizeIsolatedIntent(base).allowed,true));
for(const [name,patch] of [
 ['production database',{databaseUrl:'postgresql://pegasus_windows_accept_role:unused@prod.example.com/pegasus_world_windows_accept_1011'}],
 ['other local database',{databaseUrl:'postgresql://pegasus_windows_accept_role:unused@127.0.0.1:5432/pegasus_production'}],
 ['other DB role',{databaseUrl:'postgresql://postgres:unused@127.0.0.1:5432/pegasus_world_windows_accept_1011'}],
 ['other objective',{objectiveId:'00000000-0000-0000-0000-000000000000'}],
 ['other agent',{agentId:'echo'}],['mail skill',{skillKey:'send_email'}],['publish skill',{skillKey:'publish_social'}],
 ['payment skill',{skillKey:'create_checkout'}],['live work',{input:{draftOnly:false,externalActionsAllowed:false}}],
 ['external allowed',{input:{draftOnly:true,externalActionsAllowed:true}}],
 ['send flag',{input:{draftOnly:true,externalActionsAllowed:false,send:true}}],
 ['publish flag',{input:{draftOnly:true,externalActionsAllowed:false,publish:true}}],
 ['charge flag',{input:{draftOnly:true,externalActionsAllowed:false,charge:true}}],
 ['deploy flag',{input:{draftOnly:true,externalActionsAllowed:false,deploy:true}}],
 ['email action',{input:{draftOnly:true,externalActionsAllowed:false,action:'send email'}}],
 ['explicit external action',{externalAction:'stripe_checkout'}],
 ['remote reasoning',{skillKey:'generate_content',input:{draftOnly:true,externalActionsAllowed:false,reasoningProvider:'remote'}}],
] as const){
 test('reject '+name,()=>{
  const intent={...base,...patch};
  assert.equal(authorizeIsolatedIntent(intent).allowed,false);
  assert.throws(()=>assertIsolatedIntent(intent),/Isolated execution denied/);
 });
}
test('local model draft allowed',()=>assert.equal(authorizeIsolatedIntent({...base,skillKey:'generate_content',input:{...base.input,reasoningProvider:'ollama_local'}}).allowed,true));
