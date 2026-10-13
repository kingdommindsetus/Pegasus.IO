/** Lab-only contract for proposed OpenClaw and REA. No runtime invocation. */
export const RESEARCH_OBJECTIVE='cbe5f353-25de-4daa-a69e-09b326299fea' as const;
export const LAB_CAPABILITIES={
 'openclaw.gateway_health':{system:'openclaw',purpose:'Read isolated Gateway health',requiresSandbox:true},
 'rea.inspect_owned_bundle':{system:'rea',purpose:'Static analysis of approved synthetic JS bundle',requiresSandbox:true},
} as const;
export type LabCapability=keyof typeof LAB_CAPABILITIES;
export type LabResearchRequest={
 objectiveId:typeof RESEARCH_OBJECTIVE;jobId:string;requestedBy:'simon';
 capability:LabCapability;mode:'plan_only';environment:'isolated_development';
 dataClass:'synthetic_only';externalActionsAllowed:false;credentialsAllowed:false;
 target?:'approved_synthetic_js_bundle';
};
export type LabResearchPlan={accepted:true;jobId:string;system:'openclaw'|'rea';capability:LabCapability;
 mode:'plan_only';nextGate:'runtime_isolation_and_security_review';externalActionsExecuted:false};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const KEYS=new Set(['objectiveId','jobId','requestedBy','capability','mode','environment','dataClass','externalActionsAllowed','credentialsAllowed','target']);
export function planExternalResearch(request:unknown):LabResearchPlan{
 if(!request||typeof request!=='object'||Array.isArray(request))throw Error('PEGASUS_RESEARCH_DENIED: invalid request');
 const x=request as Record<string,unknown>;
 if(Object.keys(x).some(key=>!KEYS.has(key)))throw Error('PEGASUS_RESEARCH_DENIED: unexpected input');
 if(x.objectiveId!==RESEARCH_OBJECTIVE||typeof x.jobId!=='string'||!UUID.test(x.jobId)||
    x.requestedBy!=='simon'||x.mode!=='plan_only'||x.environment!=='isolated_development'||
    x.dataClass!=='synthetic_only'||x.externalActionsAllowed!==false||x.credentialsAllowed!==false)
   throw Error('PEGASUS_RESEARCH_DENIED: unsafe authority or data class');
 if(typeof x.capability!=='string'||!Object.hasOwn(LAB_CAPABILITIES,x.capability))
   throw Error('PEGASUS_RESEARCH_DENIED: capability not allowlisted');
 const capability=x.capability as LabCapability;
 if(capability==='rea.inspect_owned_bundle'){
   if(x.target!=='approved_synthetic_js_bundle')throw Error('PEGASUS_RESEARCH_DENIED: target not approved');
 }else if('target' in x)throw Error('PEGASUS_RESEARCH_DENIED: unexpected target');
 return {accepted:true,jobId:x.jobId,system:LAB_CAPABILITIES[capability].system,capability,
   mode:'plan_only',nextGate:'runtime_isolation_and_security_review',externalActionsExecuted:false};
}
export function executeExternalResearch():never{
 throw Error('PEGASUS_RESEARCH_DENIED: runtime connector not yet authorized');
}
