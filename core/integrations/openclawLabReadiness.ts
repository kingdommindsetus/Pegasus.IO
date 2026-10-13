/** Read-only OpenClaw lab admission gate. Does not install, run or contact OpenClaw. */
export type OpenClawLabConditions={
 nodeVersion:string;freeMemoryBytes:number;separateOsIdentity:boolean;
 sandboxReviewed:boolean;gatewayLoopbackOnly:boolean;noLiveCredentials:boolean;
 channelsDisabled:boolean;hostExecDenied:boolean;
};
export type OpenClawLabReadiness={ready:boolean;blockingReasons:string[];
 mode:'assessment_only';externalActionsExecuted:false};
function supportedNode(version:string):boolean{
 const match=/^v?(\d+)\.(\d+)\.(\d+)(?:[+-].*)?$/.exec(version);
 if(!match)return false;
 const major=Number(match[1]),minor=Number(match[2]);
 return major===24&&minor>=16 || major===26&&minor>=1 || major>26;
}
export function assessOpenClawLab(input:OpenClawLabConditions):OpenClawLabReadiness{
 const blockingReasons:string[]=[];
 // Conservative Pegasus lab planning floor, not an official OpenClaw hardware requirement.
 if(!supportedNode(input.nodeVersion))blockingReasons.push('node_version_not_supported_by_uploaded_openclaw');
 if(!Number.isFinite(input.freeMemoryBytes)||input.freeMemoryBytes<2*1024**3)
   blockingReasons.push('lab_free_ram_below_conservative_2_gib_floor');
 if(!input.separateOsIdentity)blockingReasons.push('isolated_os_identity_missing');
 if(!input.sandboxReviewed)blockingReasons.push('sandbox_not_reviewed');
 if(!input.gatewayLoopbackOnly)blockingReasons.push('gateway_network_exposure_not_restricted');
 if(!input.noLiveCredentials)blockingReasons.push('live_credentials_mounted');
 if(!input.channelsDisabled)blockingReasons.push('messaging_channels_enabled');
 if(!input.hostExecDenied)blockingReasons.push('host_execution_not_denied');
 return {ready:blockingReasons.length===0,blockingReasons,
   mode:'assessment_only',externalActionsExecuted:false};
}
