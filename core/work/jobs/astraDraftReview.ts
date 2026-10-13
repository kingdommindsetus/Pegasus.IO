// Isolated draft-review policy. This is NOT an authority to publish, email or execute actions.
export type AstraReviewState='pending_human_review'|'not_required'|'rejected';
export type AstraDraftJobResult={
 status?:unknown;validationStatus?:unknown;answer?:unknown;
 draftOnly?:unknown;externalActionsExecuted?:unknown;
};
export function classifyAstraDraftReview(result:unknown):{state:AstraReviewState;reason:string}{
 if(!result||typeof result!=='object')return {state:'rejected',reason:'missing_result'};
 const x=result as AstraDraftJobResult;
 if(x.status!=='draft_assessed'||x.draftOnly!==true||x.externalActionsExecuted!==false)
  return {state:'rejected',reason:'invalid_draft_provenance'};
 if(x.validationStatus==='needs_review'||x.validationStatus==='not_established')
  return {state:'pending_human_review',reason:String(x.validationStatus)};
 if(x.validationStatus==='accepted_draft')
  return {state:'pending_human_review',reason:'factual_checks_passed_but_human_approval_required'};
 return {state:'rejected',reason:'unrecognized_validation'};
}
// Internal Pegasus/SIMON receipt: explicitly not an approval, dispatch or external handoff.
export type SimonAstraReceipt={
 kind:'simon_astra_internal_review_v1';jobId:string;owner:'simon';
 contentStatus:'pending_human_review';validationStatus:'accepted_draft'|'needs_review'|'not_established';
 reviewReason:string;sourceIds:string[];externalActionsAllowed:false;
 publishAllowed:false;nextAction:'request_authenticated_human_review';
};
export function createSimonAstraReceipt(jobId:string,result:unknown):SimonAstraReceipt{
 if(!/^[0-9a-f-]{36}$/i.test(jobId))throw Error('ASTRA_RECEIPT_DENIED: invalid job');
 const x=result as Record<string,unknown>|null;
 const review=classifyAstraDraftReview(x);
 if(review.state!=='pending_human_review'||!x||
   !Array.isArray(x.sourceIds)||x.sourceIds.length>8||(x.sourceIds.length===0&&x.validationStatus!=='not_established')||
   x.sourceIds.some((id:unknown)=>typeof id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(id)))
   throw Error('ASTRA_RECEIPT_DENIED: missing validated draft provenance');
 if(!['accepted_draft','needs_review','not_established'].includes(String(x.validationStatus)))
   throw Error('ASTRA_RECEIPT_DENIED: invalid validation');
 return {kind:'simon_astra_internal_review_v1',jobId,owner:'simon',
   contentStatus:'pending_human_review',validationStatus:x.validationStatus as SimonAstraReceipt['validationStatus'],
   reviewReason:review.reason,sourceIds:[...x.sourceIds] as string[],
   externalActionsAllowed:false,publishAllowed:false,nextAction:'request_authenticated_human_review'};
}
// No caller can self-approve a draft based on supplied role strings or model output.
// Actual approval requires server-verified founder/staff identity, audit and S02 acceptance.
export function assertNoAutomaticReviewApproval():never{
 throw new Error('ASTRA_REVIEW_DENIED: human identity and S02 security gate not verified');
}
