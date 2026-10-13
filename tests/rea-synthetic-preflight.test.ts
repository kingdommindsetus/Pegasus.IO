import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectSyntheticRegistration,compareSyntheticRegistration} from '../core/integrations/reaSyntheticPreflight.js';

test('synthetic known-good registration CTA maps to a declared route',()=>{
 const baseline=inspectSyntheticRegistration('baseline');
 assert.equal(baseline.registrationTarget,'/events/register');
 assert.deepEqual(baseline.issues,[]);
 assert.equal(baseline.reaRuntimeUsed,false);
 assert.equal(baseline.externalActionsExecuted,false);
 assert.match(baseline.artifactSha256,/^[a-f0-9]{64}$/);
});
test('synthetic candidate regression is found with artifact evidence',()=>{
 const comparison=compareSyntheticRegistration();
 assert.equal(comparison.regressionDetected,true);
 assert.equal(comparison.reviewRequired,true);
 assert.deepEqual(comparison.candidate.issues,['registration_cta_points_to_missing_route']);
 assert.equal(comparison.candidate.registrationTarget,'/events/register-missing');
 assert.notEqual(comparison.candidate.artifactSha256,comparison.baseline.artifactSha256);
});
test('preflight denies arbitrary, production or user-supplied targets',()=>{
 for(const input of ['../../server.ts','production','C:/secrets','../baseline',''] as const){
  assert.throws(()=>inspectSyntheticRegistration(input as never),/REA_PREFLIGHT_DENIED/);
 }
});
