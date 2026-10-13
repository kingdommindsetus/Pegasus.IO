import assert from 'node:assert/strict';
import {test} from 'node:test';
import {planExternalResearch,executeExternalResearch,RESEARCH_OBJECTIVE} from '../core/integrations/externalResearchPolicy.js';
const req={objectiveId:RESEARCH_OBJECTIVE,jobId:'a1234567-b123-c123-d123-e12345678901',
 requestedBy:'simon',capability:'openclaw.gateway_health',mode:'plan_only',
 environment:'isolated_development',dataClass:'synthetic_only',
 externalActionsAllowed:false,credentialsAllowed:false} as const;
test('OpenClaw health request is plan-only with no external execution',()=>{
 const plan=planExternalResearch(req);
 assert.equal(plan.system,'openclaw');assert.equal(plan.mode,'plan_only');
 assert.equal(plan.externalActionsExecuted,false);
 assert.equal(plan.nextGate,'runtime_isolation_and_security_review');
});
test('REA accepts only an approved synthetic JavaScript bundle',()=>{
 const plan=planExternalResearch({...req,capability:'rea.inspect_owned_bundle',target:'approved_synthetic_js_bundle'});
 assert.equal(plan.system,'rea');assert.equal(plan.externalActionsExecuted,false);
 for(const x of [{...req,capability:'rea.inspect_owned_bundle'},
  {...req,capability:'rea.inspect_owned_bundle',target:'C:/Users/info/private'},
  {...req,target:'approved_synthetic_js_bundle'}])assert.throws(()=>planExternalResearch(x),/DENIED/);
});
test('No unrestricted execution, live data, hidden fields, or privileges allowed',()=>{
 for(const x of [
  {...req,mode:'execute'}, {...req,environment:'production'},
  {...req,dataClass:'patient_data'}, {...req,requestedBy:'unknown'},
  {...req,externalActionsAllowed:true},{...req,credentialsAllowed:true},
  {...req,capability:'openclaw.exec'}, {...req,command:'powershell'},
  {...req,jobId:'not-a-uuid'}, {...req,objectiveId:'other'}
 ])assert.throws(()=>planExternalResearch(x),/DENIED/);
 assert.throws(()=>planExternalResearch(null),/DENIED/);
 assert.throws(executeExternalResearch,/DENIED/);
});
