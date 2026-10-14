import test from 'node:test';
import assert from 'node:assert/strict';
import {OPEN_SOURCE_CANDIDATES,REGISTRY_POLICY,getOpenSourceCandidate,
 assessIntegration,listOpenSourceCandidates} from '../core/runtime/openSourceIntegrationRegistry.mjs';
test('candidate IDs are unique and source-bound',()=>{
 assert.equal(new Set(OPEN_SOURCE_CANDIDATES.map(c=>c.id)).size,OPEN_SOURCE_CANDIDATES.length);
 assert.ok(OPEN_SOURCE_CANDIDATES.length>=4);
 for(const c of OPEN_SOURCE_CANDIDATES){
  assert.match(c.source,/^https:\/\//);
  assert.equal(c.status,'research_only');
  assert.ok(c.requiresApproval.length>0);
 }
});
test('registry is immutable, disabled by default, and refuses unknown tools',()=>{
 assert.equal(REGISTRY_POLICY.installAutomatically,false);
 assert.equal(REGISTRY_POLICY.executeAutomatically,false);
 assert.equal(REGISTRY_POLICY.productionAccessAllowed,false);
 assert.equal(REGISTRY_POLICY.customerDataAllowed,false);
 assert.equal(REGISTRY_POLICY.founderApprovalRequired,true);
 assert.throws(()=>getOpenSourceCandidate('malicious-external-script'),/Unknown/);
 assert.equal(Object.isFrozen(OPEN_SOURCE_CANDIDATES[0]),true);
});
test('an unreviewed CUA candidate is never automatically activated',()=>{
 const evaluation=assessIntegration('cua-driver');
 assert.equal(evaluation.status,'blocked_pending_review');
 assert.equal(evaluation.activationAllowed,false);
 assert.ok(evaluation.missing.includes('founder_approval'));
});
test('even completed review only qualifies a sandbox test, not production',()=>{
 const review={licenseReviewed:true,hardwareBenchmarked:true,securityReviewed:true,
  tenantScopeVerified:true,founderApproved:true};
 const evaluation=assessIntegration('cua-driver',review);
 assert.equal(evaluation.status,'eligible_for_isolated_test_only');
 assert.equal(evaluation.productionAllowed,false);
 assert.equal(evaluation.activationAllowed,false);
});
test('duplicate existing platforms must prove added value',()=>{
 const review={licenseReviewed:true,hardwareBenchmarked:true,securityReviewed:true,
  tenantScopeVerified:true,founderApproved:true};
 assert.ok(assessIntegration('activepieces-ce',review).missing.includes('prove_added_value_over_existing_pegasus'));
 assert.ok(assessIntegration('forgejo',review).missing.includes('prove_added_value_over_existing_pegasus'));
});
test('category filtering works without executing software',()=>{
 assert.deepEqual(listOpenSourceCandidates({category:'monitoring'}).map(c=>c.id),['uptime-kuma']);
});
