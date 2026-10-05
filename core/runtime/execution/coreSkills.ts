import type {SkillExecutor} from './executeAgentTask.js';

const implemented=new Set([
 'search_company_memory','create_task','handoff_task',
 'research_company','research_person','draft_email',
 'create_campaign','generate_content','analyze_metrics','inspect_website'
]);

const contextEvidence=(context:any)=>[
 {source:'project',item:context.project||null},
 {source:'objective',item:context.objectiveContext||null},
 {source:'memory',count:Array.isArray(context.relevantMemories)?context.relevantMemories.length:0}
];

export const coreSkills:SkillExecutor={async execute(skillKey,input,context){
 if(!implemented.has(skillKey)) throw new Error('Skill adapter not implemented: '+skillKey);
 switch(skillKey){
  case 'search_company_memory':
   return {output:{memories:context.relevantMemories,query:input},evidence:(context.relevantMemories||[]).map((x:any)=>({source:'memory',item:x}))};
  case 'create_task':
   return {output:{draftTask:input,note:'Task creation prepared by Core skill executor'},evidence:contextEvidence(context)};
  case 'handoff_task':
   return {output:{handoff:input,from:context.agent.id,to:input.target||null},evidence:contextEvidence(context)};
  case 'research_company':
   return {output:{researchBrief:{target:input.target||input.query||'company',notes:input.notes||'',knownContext:context.companyCore,relevantMemories:context.relevantMemories}},evidence:contextEvidence(context)};
  case 'research_person':
   return {output:{personResearchBrief:{target:input.target||input.query||'person',notes:input.notes||'',knownContext:context.entityContext,relevantMemories:context.relevantMemories}},evidence:contextEvidence(context)};
  case 'draft_email':
   return {output:{emailDraft:{target:input.target||'',purpose:input.task||'',notes:input.notes||'',status:'draft_only'}},evidence:contextEvidence(context)};
  case 'create_campaign':
   return {output:{campaignPlan:{objective:input.task||input.query||'',target:input.target||'',notes:input.notes||'',project:context.project}},evidence:contextEvidence(context)};
  case 'generate_content':
   return {output:{contentBrief:{deliverable:input.task||'',audience:input.target||'',notes:input.notes||'',objective:context.objectiveContext}},evidence:contextEvidence(context)};
  case 'analyze_metrics':
   return {output:{analysis:{query:input.query||input.task||'',notes:input.notes||'',evidence:context.evidence,relevantMemories:context.relevantMemories}},evidence:[...contextEvidence(context),...(context.evidence||[]).map((x:any)=>({source:'task_evidence',item:x}))]};
  case 'inspect_website':
   return {output:{inspectionPlan:{target:input.target||input.query||'',focus:input.task||'',notes:input.notes||'',status:'analysis_only'}},evidence:contextEvidence(context)};
  default:
   throw new Error('Skill adapter not implemented: '+skillKey);
 }
}};
