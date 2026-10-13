/**
 * Read-only REA Evidence interpretation for the fixed synthetic KMCE route fixture.
 * No REA invocation, arbitrary target paths, tool access, or approval.
 */
export type ReaRouteNode={value:string;modulePath:'main.js';line:number;artifactSha256:string};
export type ReaRouteFinding={
 evidenceId:string;provider:'rea-javascript-application';operation:'analyze_javascript_application';
 rootArtifactSha256:string;sourceArtifactSha256:string;registration:ReaRouteNode;
 declaredPages:ReaRouteNode[];brokenRoute:boolean;
 reviewState:'pending_human_review';externalActionsExecuted:false;
};
function rec(x:unknown):Record<string,unknown>|null{
 return x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:null;
}
function prop(x:unknown,key:string):unknown{return rec(x)?.[key];}
const HASH=/^[0-9a-f]{64}$/i;
const EVIDENCE=/^ev_[0-9a-f]{64}$/i;
export function summarizeReaRegistrationEvidence(value:unknown,expectedSourceSha256:string):ReaRouteFinding{
 const root=rec(value);const provider=prop(value,'provider');
 const normalized=prop(value,'normalized_result');
 const subjectDigest=prop(prop(value,'subject'),'digest');
 const graph=prop(normalized,'semantic_graph');
 const rootSha=prop(normalized,'root_artifact_sha256');
 if(!root||root.operation!=='analyze_javascript_application'||
   prop(provider,'id')!=='rea-javascript-application'||
   typeof root.evidence_id!=='string'||!EVIDENCE.test(root.evidence_id)||
   typeof rootSha!=='string'||!HASH.test(rootSha)||
   prop(subjectDigest,'sha256')!==rootSha||
   typeof expectedSourceSha256!=='string'||!HASH.test(expectedSourceSha256)||
   !Array.isArray(prop(graph,'nodes')))
   throw Error('REA_EVIDENCE_DENIED: invalid provenance or graph');
 const items=(prop(graph,'nodes') as unknown[]).filter(node=>prop(node,'kind')==='literal');
 const take=(node:unknown):ReaRouteNode|null=>{
   const identity=prop(node,'identity');const loc=prop(prop(node,'evidence'),'location');
   const sourceRange=prop(loc,'value');const start=prop(sourceRange,'start');
   const hash=prop(identity,'artifact_sha256'),modulePath=prop(identity,'module_path');
   const value=prop(prop(node,'properties'),'value'),line=prop(start,'line');
   if(modulePath!=='main.js'||prop(loc,'available')!==true||
     prop(sourceRange,'source')!=='main.js'||hash!==expectedSourceSha256||
     typeof value!=='string'||!value.startsWith('/')||!value.slice(1).split('/').every(part=>/^[a-z0-9_-]+$/i.test(part))||
     typeof line!=='number'||!Number.isInteger(line)||line<=0)return null;
   return {value,modulePath:'main.js',line,artifactSha256:hash};
 };
 const registration=items.filter(node=>
    String(prop(prop(node,'identity'),'role_key')||'').includes('binding:navigation:property:/registration:'));
 const pages=items.filter(node=>
    String(prop(prop(node,'identity'),'role_key')||'').includes('binding:declaredPages:property:'));
 if(registration.length!==1||pages.length<1||pages.length>30)
   throw Error('REA_EVIDENCE_DENIED: missing or ambiguous route evidence');
 const reg=take(registration[0]);const declared=pages.map(take);
 if(!reg||declared.some(x=>!x)||new Set(declared.map(x=>x?.value)).size!==declared.length)
   throw Error('REA_EVIDENCE_DENIED: source location or digest mismatch');
 const declaredPages=declared as ReaRouteNode[];
 return {evidenceId:root.evidence_id as string,provider:'rea-javascript-application',
   operation:'analyze_javascript_application',rootArtifactSha256:rootSha,
   sourceArtifactSha256:expectedSourceSha256,registration:reg,declaredPages,
   brokenRoute:!declaredPages.some(x=>x.value===reg.value),
   reviewState:'pending_human_review',externalActionsExecuted:false};
}
export function compareReaRouteEvidence(baseline:ReaRouteFinding,candidate:ReaRouteFinding){
 if(baseline.brokenRoute||baseline.registration.value!=='/events/register'||
   !candidate.brokenRoute||baseline.sourceArtifactSha256===candidate.sourceArtifactSha256||
   candidate.registration.modulePath!=='main.js')
   throw Error('REA_EVIDENCE_DENIED: no verified synthetic route regression');
 return {kind:'rea_synthetic_registration_regression_v1' as const,
   baselineEvidenceId:baseline.evidenceId,candidateEvidenceId:candidate.evidenceId,
   expectedRoute:baseline.registration.value,observedRoute:candidate.registration.value,
   candidateLocation:{path:candidate.registration.modulePath,line:candidate.registration.line},
   decision:'human_review_required' as const,externalActionsAllowed:false as const,
   externalActionsExecuted:false as const};
}
