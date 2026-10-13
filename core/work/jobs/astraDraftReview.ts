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
// No caller can self-approve a draft based on supplied role strings or model output.
// Actual approval requires server-verified founder/staff identity, audit and S02 acceptance.
export function assertNoAutomaticReviewApproval():never{
 throw new Error('ASTRA_REVIEW_DENIED: human identity and S02 security gate not verified');
}
