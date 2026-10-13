import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
 CAPABILITY_REGISTRY,planTubeMontage,reaReviewSignal,tubeStoryboardSignal,
 buildGodsEyeLabSnapshot,makeRedisWakeupHint
} from '../core/integrations/pegasusCapabilityFabric.js';
import type {ReaRouteFinding} from '../core/integrations/reaEvidenceIngest.js';

const projectId='aaa00000-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const objectiveId='bbb00000-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
const event1='ccc00000-cccc-4ccc-cccc-cccccccccccc';
const event2='ddd00000-dddd-4ddd-dddd-dddddddddddd';
const eventTime='2026-10-13T16:30:00.000Z';
const request={projectId,objectiveId,requester:'tube',pipeline:'screen-demo',
 dataClass:'synthetic_only',mode:'dry_run_only',budgetUsd:0,
 externalActionsAllowed:false,credentialsAllowed:false} as const;
const finding:ReaRouteFinding={
 evidenceId:'ev_'+'f'.repeat(64),provider:'rea-javascript-application',
 operation:'analyze_javascript_application',rootArtifactSha256:'b'.repeat(64),
 sourceArtifactSha256:'c'.repeat(64),
 registration:{value:'/events/register-missing',modulePath:'main.js',line:2,artifactSha256:'c'.repeat(64)},
 declaredPages:[{value:'/events/register',modulePath:'main.js',line:3,artifactSha256:'c'.repeat(64)}],
 brokenRoute:true,reviewState:'pending_human_review',externalActionsExecuted:false
};
test('Registry preserves Pegasus authority, treats Redis as optional',()=>{
 assert.equal(CAPABILITY_REGISTRY.pegasus.authority,'system_of_record');
 assert.equal(CAPABILITY_REGISTRY.gods_eye.authority,'read_only');
 assert.equal(CAPABILITY_REGISTRY.redis.authority,'not_system_of_record');
 assert.equal(CAPABILITY_REGISTRY.openmontage.mode,'planning_only');
 assert.equal(CAPABILITY_REGISTRY.openclaw.mode,'not_enabled');
});
test('Tube plans synthetic zero-credit storyboard only and requires approval',()=>{
 const x=planTubeMontage(request);
 assert.equal(x.pipeline,'screen-demo');
 assert.equal(x.stage,'idea');
 assert.equal(x.budgetUsd,0);
 assert.equal(x.launchAuthorized,false);
 assert.equal(x.publishingAllowed,false);
 assert.equal(x.sourceMediaAccessAllowed,false);
 assert.equal(x.approval,'required');
 assert.equal(planTubeMontage({...request,pipeline:'animated-explainer'}).stage,'research');
 assert.equal(planTubeMontage({...request,pipeline:'podcast-repurpose'}).stage,'idea');
});
test('Tube never accepts external actions, payments, paths or production media',()=>{
 for(const x of [
  {...request,dataClass:'customer_video'},
  {...request,mode:'execute'},
  {...request,externalActionsAllowed:true},
  {...request,credentialsAllowed:true},
  {...request,budgetUsd:1},
  {...request,sourcePath:'C:/Users/info/private'},
  {...request,requester:'other'},
  {...request,projectId:'fake'},
  {...request,pipeline:'some-other-pipeline'}
 ])assert.throws(()=>planTubeMontage(x),/CAPABILITY_DENIED/);
});
test('Real-REA-shaped evidence and Tube draft create verified synthetic snapshot',()=>{
 const video=planTubeMontage(request);
 const a=reaReviewSignal(finding,event1,objectiveId,eventTime);
 const b=tubeStoryboardSignal(video,event2,'2026-10-13T16:31:00.000Z');
 const snap=buildGodsEyeLabSnapshot([b,a]);
 assert.equal(snap.displayMode,'synthetic_lab_only');
 assert.equal(snap.eventCount,2);assert.equal(snap.reviewRequired,2);
 assert.equal(snap.deployments,0);assert.equal(snap.externalActionsExecuted,false);
 assert.equal(snap.activities[0].agentId,'iris');
 assert.equal(snap.activities[1].agentId,'tube');
 assert.equal(snap.activities[0].status,'human_review_required');
 assert.equal(snap.activities[0].evidenceId,finding.evidenceId);
 const hint=makeRedisWakeupHint(a);
 assert.equal(hint.transportStatus,'not_published');
 assert.equal(hint.durableSource,'postgres_required');
 assert.equal(hint.executionAuthorized,false);
 assert.equal('evidenceId' in hint,false);
});
test('Signals refuse duplicate IDs, faked live state and unverified REA results',()=>{
 const a=reaReviewSignal(finding,event1,objectiveId,eventTime);
 assert.throws(()=>buildGodsEyeLabSnapshot([a,a]),/CAPABILITY_DENIED/);
 assert.throws(()=>buildGodsEyeLabSnapshot([{...a,externalActionsExecuted:true} as never]),/CAPABILITY_DENIED/);
 assert.throws(()=>buildGodsEyeLabSnapshot([{...a,kind:'job_completed'} as never]),/CAPABILITY_DENIED/);
 assert.throws(()=>buildGodsEyeLabSnapshot([{...a,dataClass:'private'} as never]),/CAPABILITY_DENIED/);
 assert.throws(()=>reaReviewSignal({...finding,brokenRoute:false},event1,objectiveId,eventTime),/CAPABILITY_DENIED/);
 assert.throws(()=>reaReviewSignal(finding,event1,objectiveId,'not-date'),/CAPABILITY_DENIED/);
});
