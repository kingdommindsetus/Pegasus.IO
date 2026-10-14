import test from 'node:test';
import assert from 'node:assert/strict';
import {FOUNDER_SKILL_AGENT_MAP,FOUNDER_SKILL_SAFE_DEFAULTS,
 founderSkillsForAgent,assertFounderSkillSafeRequest} from '../core/runtime/founderSkillCatalog.mjs';
test('all twelve canonical agents mapped to eleven allowlisted skills',()=>{
 assert.equal(Object.keys(FOUNDER_SKILL_AGENT_MAP).length,12);
 const all=new Set(Object.values(FOUNDER_SKILL_AGENT_MAP).flat());
 assert.deepEqual([...all].sort(),[
  'founder-board','founder-brand','founder-cfo','founder-competitors','founder-consumer',
  'founder-launch','founder-marketing','founder-offer','founder-ops','founder-plan',
  'founder-pricing'].sort());
});
test('capabilities are disabled until approved; no paid model or external action',()=>{
 assert.equal(FOUNDER_SKILL_SAFE_DEFAULTS.enabled,false);
 assert.equal(FOUNDER_SKILL_SAFE_DEFAULTS.thirdPartyCodeExecutionAllowed,false);
 assert.equal(FOUNDER_SKILL_SAFE_DEFAULTS.autonomousConsumerAgents,0);
 assert.equal(FOUNDER_SKILL_SAFE_DEFAULTS.paymentAllowed,false);
 assert.equal(FOUNDER_SKILL_SAFE_DEFAULTS.externalActionsRequireFounderApproval,true);
});
test('role allowlist and draft-only guard fail closed',()=>{
 assert.deepEqual(founderSkillsForAgent('snake'),['founder-cfo','founder-pricing','founder-plan']);
 assert.equal(assertFounderSkillSafeRequest({agentId:'snake',skillId:'founder-cfo'}),true);
 assert.throws(()=>assertFounderSkillSafeRequest({agentId:'echo',skillId:'founder-cfo'}),/not approved/);
 assert.throws(()=>assertFounderSkillSafeRequest({agentId:'snake',skillId:'founder-cfo',externalActionsAllowed:true}),/draft-only/);
 assert.throws(()=>founderSkillsForAgent('unknown'),/Unknown/);
});
