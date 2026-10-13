/**
 * Manual lab acceptance: actual REA-generated evidence -> Pegasus read-only God's Eye
 * plus a synthetic Tube/OpenMontage plan and an untransmitted Redis hint.
 * Does not run REA, OpenMontage, Redis, or any live business workflow.
 */
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {summarizeReaRegistrationEvidence,compareReaRouteEvidence} from '../core/integrations/reaEvidenceIngest.js';
import {
 planTubeMontage,reaReviewSignal,tubeStoryboardSignal,
 buildGodsEyeLabSnapshot,makeRedisWakeupHint
} from '../core/integrations/pegasusCapabilityFabric.js';
const lab='C:/Users/info/PegasusVoiceEngine/acceptance-isolated/rea-lab-20261013';
function load(variant:'baseline'|'candidate'){
 const bytes=readFileSync(join(lab,'results',variant+'.json'));
 const content=(bytes[0]===0xff&&bytes[1]===0xfe?bytes.toString('utf16le'):bytes.toString('utf8')).replace(/^\uFEFF/,'');
 const source=readFileSync(join(lab,'samples',variant,'main.js'));
 return summarizeReaRegistrationEvidence(JSON.parse(content),createHash('sha256').update(source).digest('hex'));
}
const baseline=load('baseline'),candidate=load('candidate');
const diff=compareReaRouteEvidence(baseline,candidate);
const objectiveId='cbe5f353-25de-4daa-a69e-09b326299fea';
const reaSignal=reaReviewSignal(candidate,'11111111-1111-4111-8111-111111111111',objectiveId,'2026-10-13T16:30:00.000Z');
const videoPlan=planTubeMontage({
 projectId:'22222222-2222-4222-8222-222222222222',objectiveId,
 requester:'tube',pipeline:'screen-demo',dataClass:'synthetic_only',
 mode:'dry_run_only',budgetUsd:0,externalActionsAllowed:false,credentialsAllowed:false,
});
const tubeSignal=tubeStoryboardSignal(videoPlan,'33333333-3333-4333-8333-333333333333','2026-10-13T16:31:00.000Z');
const snapshot=buildGodsEyeLabSnapshot([reaSignal,tubeSignal]);
const hint=makeRedisWakeupHint(reaSignal);
if(snapshot.eventCount!==2||snapshot.reviewRequired!==2||
 snapshot.activities[0].agentId!=='iris'||snapshot.activities[1].agentId!=='tube'||
 diff.candidateLocation.line!==2||hint.transportStatus!=='not_published'||
 snapshot.displayMode!=='synthetic_lab_only')throw Error('PEGASUS_LAB_ACCEPTANCE_FAILED');
console.log('PEGASUS_CAPABILITY_LAB_ACCEPTANCE',JSON.stringify({
 success:true,reaEvidenceId:candidate.evidenceId,regression:diff,
 tubePipeline:videoPlan.pipeline,tubeMode:videoPlan.mode,
 godsEye:snapshot,redisHint:hint,
 productionChanges:false,modelsInvoked:false,externalActionsExecuted:false,
}));
