// Explicit deny-by-default policy for the isolated Windows acceptance workers.
// This module never grants permission to production or external side-effect systems.
const OBJECTIVE='cbe5f353-25de-4daa-a69e-09b326299fea';
const SKILLS=new Set(['search_company_memory','generate_content']);
const OUTPUT_DENIED=/\b(send|email|publish|deploy|checkout|payment|charge|refund|webhook|external_action)\b/i;
export type IsolatedIntent={
 objectiveId:string;databaseUrl:string;agentId:string;skillKey:string;
 input:Record<string,unknown>;externalAction?:string|null;
};
export function authorizeIsolatedIntent(intent:IsolatedIntent):{allowed:boolean;reason:string}{
 let u:URL;
 try{u=new URL(intent.databaseUrl);}catch{return {allowed:false,reason:'invalid_database_url'};}
 if(u.hostname!=='127.0.0.1'||u.port&&u.port!=='5432'||
    u.pathname!=='/pegasus_world_windows_accept_1011'||
    decodeURIComponent(u.username)!=='pegasus_windows_accept_role')
  return {allowed:false,reason:'database_out_of_scope'};
 if(intent.objectiveId!==OBJECTIVE)return {allowed:false,reason:'objective_out_of_scope'};
 if(intent.agentId!=='simon'||!SKILLS.has(intent.skillKey))return {allowed:false,reason:'agent_skill_out_of_scope'};
 if(intent.input.draftOnly!==true||intent.input.externalActionsAllowed!==false)
  return {allowed:false,reason:'draft_only_required'};
 if(intent.skillKey==='generate_content'&&intent.input.reasoningProvider!=='ollama_local')
  return {allowed:false,reason:'local_model_required'};
 if(intent.externalAction||intent.input.send===true||intent.input.publish===true||
    intent.input.charge===true||intent.input.deploy===true||
    typeof intent.input.action==='string'&&OUTPUT_DENIED.test(intent.input.action))
  return {allowed:false,reason:'external_side_effect_denied'};
 return {allowed:true,reason:'isolated_draft_only'};
}
export function assertIsolatedIntent(intent:IsolatedIntent):void{
 const result=authorizeIsolatedIntent(intent);
 if(!result.allowed)throw new Error('Isolated execution denied: '+result.reason);
}
