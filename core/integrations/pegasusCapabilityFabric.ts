/**
 * Pegasus capability fabric V1 — typed, synthetic-only planning and evidence signals.
 *
 * No calls to Redis, OpenMontage, remote APIs, browser, production Postgres,
 * external messaging, or payments. Pegasus retains all execution authority.
 */
import {createHash} from 'node:crypto';
import type {ReaRouteFinding} from './reaEvidenceIngest.js';
export {CAPABILITY_REGISTRY} from './capabilityRegistry.js';
export type {CapabilityId} from './capabilityRegistry.js';
export const VIDEO_PIPELINES=['screen-demo','animated-explainer','podcast-repurpose'] as const;
export type VideoPipeline=typeof VIDEO_PIPELINES[number];
// Verified against the uploaded OpenMontage pipeline_defs manifests.
export const VIDEO_INITIAL_STAGE={
 'screen-demo':'idea','animated-explainer':'research','podcast-repurpose':'idea'
} as const;
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HASH=/^[0-9a-f]{64}$/i;
const REA_ID=/^ev_[0-9a-f]{64}$/i;

type ReviewEventName='rea_evidence_verified'|'tube_storyboard_planned';
export type PegasusLabSignal={
 version:'pegasus-capability-signal-v1';signalId:string;objectiveId:string;
 kind:ReviewEventName;agentId:'iris'|'tube';producer:'rea'|'openmontage';
 dataClass:'synthetic_only';sourceSha256:string;occurredAt:string;
 evidenceId?:string;pipeline?:VideoPipeline;externalActionsExecuted:false;
};
export type TubePlan={
 version:'pegasus-tube-plan-v1';projectId:string;objectiveId:string;
 requester:'tube';pipeline:VideoPipeline;dataClass:'synthetic_only';
 stage:'idea'|'research';budgetUsd:0;approval:'required';mode:'dry_run_only';
 launchAuthorized:false;publishingAllowed:false;sourceMediaAccessAllowed:false;
};
export type TubeRequest={
 projectId:string;objectiveId:string;requester:'tube';pipeline:VideoPipeline;
 dataClass:'synthetic_only';mode:'dry_run_only';budgetUsd:0;
 externalActionsAllowed:false;credentialsAllowed:false;
};
const EXACT_KEYS=new Set(['projectId','objectiveId','requester','pipeline','dataClass','mode','budgetUsd','externalActionsAllowed','credentialsAllowed']);
export function planTubeMontage(request:unknown):TubePlan{
 if(!request||typeof request!=='object'||Array.isArray(request))throw Error('CAPABILITY_DENIED: invalid plan');
 const x=request as Record<string,unknown>;
 if(Object.keys(x).some(k=>!EXACT_KEYS.has(k))||
    typeof x.projectId!=='string'||!UUID.test(x.projectId)||
    typeof x.objectiveId!=='string'||!UUID.test(x.objectiveId)||
    x.requester!=='tube'||!VIDEO_PIPELINES.includes(x.pipeline as VideoPipeline)||
    x.dataClass!=='synthetic_only'||x.mode!=='dry_run_only'||x.budgetUsd!==0||
    x.externalActionsAllowed!==false||x.credentialsAllowed!==false)
   throw Error('CAPABILITY_DENIED: tube plan must be synthetic and nonexecuting');
 return {version:'pegasus-tube-plan-v1',projectId:x.projectId,objectiveId:x.objectiveId,
  requester:'tube',pipeline:x.pipeline as VideoPipeline,dataClass:'synthetic_only',stage:VIDEO_INITIAL_STAGE[x.pipeline as VideoPipeline],
  budgetUsd:0,approval:'required',mode:'dry_run_only',
  launchAuthorized:false,publishingAllowed:false,sourceMediaAccessAllowed:false};
}
const isoValid=(value:string)=>!Number.isNaN(Date.parse(value))&&new Date(value).toISOString()===value;
function assertSignal(signal:PegasusLabSignal){
 if(!UUID.test(signal.signalId)||!UUID.test(signal.objectiveId)||!HASH.test(signal.sourceSha256)||
   !isoValid(signal.occurredAt)||signal.externalActionsExecuted!==false||
   signal.dataClass!=='synthetic_only'||signal.version!=='pegasus-capability-signal-v1')
   throw Error('CAPABILITY_DENIED: invalid synthetic signal');
 if(signal.kind==='rea_evidence_verified'){
   if(signal.agentId!=='iris'||signal.producer!=='rea'||typeof signal.evidenceId!=='string'||
      !REA_ID.test(signal.evidenceId)||signal.pipeline!==undefined)
     throw Error('CAPABILITY_DENIED: bad REA provenance');
 } else if(signal.kind==='tube_storyboard_planned'){
   if(signal.agentId!=='tube'||signal.producer!=='openmontage'||signal.evidenceId!==undefined||
      !VIDEO_PIPELINES.includes(signal.pipeline as VideoPipeline))
     throw Error('CAPABILITY_DENIED: bad OpenMontage plan');
 } else throw Error('CAPABILITY_DENIED: unknown event kind');
}
export function reaReviewSignal(finding:ReaRouteFinding,signalId:string,objectiveId:string,occurredAt:string):PegasusLabSignal{
 if(!finding.brokenRoute||finding.reviewState!=='pending_human_review'||
    finding.externalActionsExecuted!==false||!REA_ID.test(finding.evidenceId)||
    !HASH.test(finding.sourceArtifactSha256))throw Error('CAPABILITY_DENIED: REA not verified for review');
 const signal:PegasusLabSignal={version:'pegasus-capability-signal-v1',signalId,objectiveId,
  kind:'rea_evidence_verified',agentId:'iris',producer:'rea',dataClass:'synthetic_only',
  sourceSha256:finding.sourceArtifactSha256,evidenceId:finding.evidenceId,
  occurredAt,externalActionsExecuted:false};
 assertSignal(signal);return signal;
}
export function tubeStoryboardSignal(plan:TubePlan,signalId:string,occurredAt:string):PegasusLabSignal{
 if(plan.mode!=='dry_run_only'||plan.launchAuthorized!==false||plan.approval!=='required')
   throw Error('CAPABILITY_DENIED: unapproved video plan');
 const sourceSha256=createHash('sha256').update(JSON.stringify(plan)).digest('hex');
 const signal:PegasusLabSignal={version:'pegasus-capability-signal-v1',signalId,
  objectiveId:plan.objectiveId,kind:'tube_storyboard_planned',agentId:'tube',
  producer:'openmontage',pipeline:plan.pipeline,dataClass:'synthetic_only',
  sourceSha256,occurredAt,externalActionsExecuted:false};
 assertSignal(signal);return signal;
}
export function buildGodsEyeLabSnapshot(input:readonly PegasusLabSignal[]){
 if(input.length>200)throw Error('CAPABILITY_DENIED: oversized snapshot');
 const events=[...input];const seen=new Set<string>();
 for(const event of events){
  assertSignal(event);
  if(seen.has(event.signalId))throw Error('CAPABILITY_DENIED: duplicate event ID');
  seen.add(event.signalId);
 }
 events.sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)||a.signalId.localeCompare(b.signalId));
 return {version:'gods-eye-lab-snapshot-v1' as const,displayMode:'synthetic_lab_only' as const,
  eventCount:events.length,reviewRequired:events.length,
  deployments:0,externalActionsExecuted:false as const,
  activities:events.map(({signalId,objectiveId,kind,agentId,producer,occurredAt,evidenceId,pipeline})=>
   ({signalId,objectiveId,kind,agentId,producer,occurredAt,evidenceId,pipeline,status:'human_review_required' as const}))};
}
/** Redis is a disposable wakeup hint only. Postgres remains durable truth. No publish happens here. */
export function makeRedisWakeupHint(signal:PegasusLabSignal){
 assertSignal(signal);
 return {stream:'pegasus:dev:capability-hints' as const,signalId:signal.signalId,
  objectiveId:signal.objectiveId,kind:signal.kind,
  payloadSha256:signal.sourceSha256,durableSource:'postgres_required' as const,
  transportStatus:'not_published' as const,executionAuthorized:false as const};
}
