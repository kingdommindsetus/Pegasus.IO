/**
 * Pegasus Open-Source Integration Registry
 * Read-only, review-first candidates. Importing this module does not install or activate software.
 * Scores are planning heuristics and are NOT benchmarks, security certifications, or measured RAM usage.
 */
export const REGISTRY_VERSION=1;
const candidates=[
 {id:'cua-driver',name:'Cua Driver',category:'computer_use',source:'https://github.com/trycua/cua',
  license:'MIT (Driver only; optional components have other terms)',platform:'Windows/macOS/Linux',
  capabilities:['desktop_observation','governed_ui_actions'],requiresApproval:['mouse_keyboard_control','account_access'],
  risk:'high',resourceClass:'moderate_unknown',reusesExisting:false,priority:1,
  evidence:'Upstream Cua repository and Driver README',status:'research_only'},
 {id:'activepieces-ce',name:'Activepieces Community',category:'workflows',source:'https://github.com/activepieces/activepieces',
  license:'MIT core; commercial enterprise features excluded',platform:'Self-hosted container/server',
  capabilities:['workflow_orchestration','connectors'],requiresApproval:['external_connectors','workflow_execution'],
  risk:'high',resourceClass:'moderate_unknown',reusesExisting:true,priority:3,
  evidence:'Upstream Activepieces license',status:'research_only'},
 {id:'uptime-kuma',name:'Uptime Kuma',category:'monitoring',source:'https://github.com/louislam/uptime-kuma',
  license:'MIT',platform:'Self-hosted server/container',
  capabilities:['uptime_monitoring','health_checks'],requiresApproval:['monitor_target_configuration'],
  risk:'medium',resourceClass:'light_to_moderate_unmeasured',reusesExisting:false,priority:2,
  evidence:'Upstream Uptime Kuma LICENSE',status:'research_only'},
 {id:'forgejo',name:'Forgejo',category:'source_control',source:'https://codeberg.org/forgejo/forgejo',
  license:'GPL-3.0-or-later (current releases)',platform:'Self-hosted server/container',
  capabilities:['git_hosting','code_review'],requiresApproval:['repository_migration','git_write'],
  risk:'high',resourceClass:'moderate_unknown',reusesExisting:true,priority:5,
  evidence:'Official Forgejo 2024 GPL announcement',status:'research_only'},
 {id:'open-webui',name:'Open WebUI',category:'ai_interface',source:'https://github.com/open-webui/open-webui',
  license:'Review exact installed version/license before use',platform:'Self-hosted server/container',
  capabilities:['local_model_chat_ui'],requiresApproval:['model_connection','data_access'],
  risk:'medium',resourceClass:'moderate_unknown',reusesExisting:true,priority:4,
  evidence:'Requires exact-version license and deployment review',status:'research_only'}
];
export const OPEN_SOURCE_CANDIDATES=Object.freeze(candidates.map(c=>Object.freeze({...c,
 capabilities:Object.freeze([...c.capabilities]),requiresApproval:Object.freeze([...c.requiresApproval])})));
export const REGISTRY_POLICY=Object.freeze({
 defaultStatus:'research_only',
 installAutomatically:false,executeAutomatically:false,downloadScriptsAutomatically:false,
 externalNetworkActionsAllowed:false,productionAccessAllowed:false,customerDataAllowed:false,
 paidModelsRequired:false,founderApprovalRequired:true,verificationRequired:true
});
const byId=new Map(OPEN_SOURCE_CANDIDATES.map(c=>[c.id,c]));
export function getOpenSourceCandidate(id){
 if(typeof id!=='string'||!byId.has(id))throw Error('Unknown open-source integration');
 return byId.get(id);
}
export function assessIntegration(id,context={}){
 const c=getOpenSourceCandidate(id);
 const missing=[];
 if(context.licenseReviewed!==true)missing.push('review_exact_component_license');
 if(context.hardwareBenchmarked!==true)missing.push('measure_ram_cpu_storage');
 if(context.securityReviewed!==true)missing.push('review_install_security');
 if(context.tenantScopeVerified!==true)missing.push('verify_pegasus_tenant_boundary');
 if(context.founderApproved!==true)missing.push('founder_approval');
 if(c.reusesExisting)missing.push('prove_added_value_over_existing_pegasus');
 return Object.freeze({id:c.id,rank:c.priority,status:missing.length?'blocked_pending_review':'eligible_for_isolated_test_only',
  activationAllowed:false,productionAllowed:false,missing:Object.freeze(missing)});
}
export function listOpenSourceCandidates({category}={}){
 if(category&&typeof category!=='string')throw Error('Invalid category');
 return OPEN_SOURCE_CANDIDATES.filter(c=>!category||c.category===category);
}
