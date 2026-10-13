// Pilot-only deterministic answer gate for five code-derived KMCE facts.
// It is NOT a general-purpose truth checker. Never promote model output to verified facts.
import {answerKmceWithAstra,selectKmceKnowledge,KMCE_KNOWLEDGE_VERSION,type KnowledgeDraftResult} from './kmceAstraKnowledge.js';
import {draftWithAstra} from './astraDraftBridge.js';

export type ValidationReport={
 status:'accepted_draft'|'needs_review'|'not_established';
 knowledgeVersion:string;
 answer:string;
 reasons:string[];
 requiredFacts:string[];
 citedSources:{id:string;path:string;revision:string}[];
 modelAnswer?:string;
};
const RULES:Readonly<Record<string,{question:RegExp;required:readonly string[]}[]>>={
 provider_identifiers:[
  {question:/\b(identifiers|ids|both|national and local|local id|local identifier)\b/i,required:['441585','217702']},
  {question:/\b(provider|agd|pace)\b/i,required:['441585']},
 ],
 faculty_profile:[
  {question:/\b(credentials|degrees|qualification)\b/i,required:['DDS','D.ASBA','D.ACSDD']},
  {question:/\b(timothy|adams|faculty)\b/i,required:['Dr. Timothy Adams']},
 ],
 role_boundaries:[
  {question:/\b(roles|role types|account roles)\b/i,required:['FOUNDER_ADMIN','EDUCATOR','STUDENT']},
 ],
 outreach_gate:[
  {question:/\b(approval|permission|outreach|podcast)\b/i,required:['founder approval']},
 ],
};
const riskTerms=/\b(approved for 2027|officially accredited|currently accredited|verified by agd|guaranteed|live enrollment|seats sold|revenue generated|scheduled on|confirmed seminar date)\b/i;
const tokenPattern=/\b\d{5,}\b/g;

export function validateKmceAnswer(question:string,result:KnowledgeDraftResult):ValidationReport {
 const citations=result.usedSources.map(s=>({id:s.id,path:s.source,revision:s.sourceRevision}));
 const initial={knowledgeVersion:KMCE_KNOWLEDGE_VERSION,requiredFacts:[] as string[],citedSources:citations};
 if(result.status==='not_established'||result.usedSources.length===0)
  return {...initial,status:'not_established',answer:'Not established by the current KMCE source pack.',reasons:['no_matching_approved_source']};
 const reasons:string[]=[];
 if(result.knowledgeVersion!==KMCE_KNOWLEDGE_VERSION)reasons.push('source_version_mismatch');
 const approved=selectKmceKnowledge(question);
 if(approved.length!==result.usedSources.length ||approved.some((s,i)=>s.id!==result.usedSources[i]?.id||s.source!==result.usedSources[i]?.source||s.sourceRevision!==result.usedSources[i]?.sourceRevision))
  reasons.push('source_provenance_mismatch');
 if(!result.astra ||result.astra.status!=='draft' ||
    result.astra.evidenceIds.length!==approved.length ||
    approved.some((s,i)=>result.astra?.evidenceIds[i]!==s.id))
  reasons.push('model_evidence_ids_mismatch');
 const needed=new Set<string>();
 for(const source of approved){
  for(const rule of RULES[source.id]||[]){
   if(rule.question.test(question)){for(const fact of rule.required)needed.add(fact);break;}
  }
 }
 const requiredFacts=[...needed];
 for(const fact of requiredFacts)if(!result.answer.toLowerCase().includes(fact.toLowerCase()))reasons.push('missing_required_fact:'+fact);
 if(!result.answer.trim()||result.answer.length>2500)reasons.push('bad_answer_length');
 if(riskTerms.test(result.answer))reasons.push('unverified_external_claim');
 const approvedNumeric=new Set(approved.flatMap(s=>s.claim.match(tokenPattern)||[]));
 const answerNumeric=result.answer.match(tokenPattern)||[];
 for(const n of answerNumeric)if(!approvedNumeric.has(n))reasons.push('unreferenced_numeric_claim:'+n);
 const status=reasons.length?'needs_review':'accepted_draft';
 return {...initial,status,answer:status==='accepted_draft'?result.answer:'Draft withheld: factual completeness or provenance needs review.',
  modelAnswer:result.answer,reasons,requiredFacts};
}
export async function answerKmceWithValidation(
 args:{question:string;taskId:string;agentId:'simon';draftOnly:true;externalActionsAllowed:false},
 invoke:typeof draftWithAstra=draftWithAstra,
):Promise<ValidationReport>{
 const draft=await answerKmceWithAstra(args,invoke);
 return validateKmceAnswer(args.question,draft);
}
