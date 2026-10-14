/**
 * Founder Skill: explicit, read-only capability registry for Pegasus agents.
 * Importing this module never loads untrusted instructions or runs Python.
 * Enabling any skill for an actual agent must go through normal Pegasus governance.
 */
export const FOUNDER_SKILL_SOURCE='Jakeschincariol/founder-skill';
export const FOUNDER_SKILL_LICENSE='MIT';
export const FOUNDER_SKILL_AGENT_MAP=Object.freeze({
 simon:['founder-board','founder-plan'],
 marie:['founder-ops','founder-launch'],
 iris:['founder-competitors'],
 mark:['founder-marketing','founder-brand'],
 cammy:['founder-launch','founder-marketing'],
 evan:['founder-marketing','founder-brand'],
 tube:['founder-marketing'],
 lucy:['founder-marketing','founder-launch'],
 snake:['founder-cfo','founder-pricing','founder-plan'],
 alice:['founder-offer','founder-brand'],
 echo:['founder-consumer','founder-competitors','founder-offer'],
 booker:['founder-launch']
});
export const FOUNDER_SKILL_SAFE_DEFAULTS=Object.freeze({
 enabled:false,
 readOnly:true,
 draftOnly:true,
 simulatedBuyerResearchIsNotEvidence:true,
 thirdPartyCodeExecutionAllowed:false,
 emailAllowed:false,
 bookingAllowed:false,
 pricingChangesAllowed:false,
 paymentAllowed:false,
 deploymentAllowed:false,
 customerRecordAccessAllowed:false,
 modelProvider:'existing-local-or-approved',
 autonomousConsumerAgents:0,
 externalActionsRequireFounderApproval:true
});
export function founderSkillsForAgent(agentId){
 if(typeof agentId!=='string'||!Object.hasOwn(FOUNDER_SKILL_AGENT_MAP,agentId))
  throw Error('Unknown canonical Pegasus agent');
 return Object.freeze([...FOUNDER_SKILL_AGENT_MAP[agentId]]);
}
export function assertFounderSkillSafeRequest({agentId,skillId,draftOnly=true,externalActionsAllowed=false}={}){
 const assigned=founderSkillsForAgent(agentId);
 if(!assigned.includes(skillId))throw Error('Founder Skill is not approved for this agent');
 if(draftOnly!==true||externalActionsAllowed!==false)
  throw Error('Founder Skill requires draft-only execution without external actions');
 return true;
}
