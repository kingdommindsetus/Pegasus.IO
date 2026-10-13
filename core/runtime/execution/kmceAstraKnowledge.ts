// Small versioned, source-backed public/business-facts pack for isolated Astra draft testing.
// Source is a reviewed local KMCE Git revision; NO live database, credentials, leads, student or patient data.
import {draftWithAstra,type AstraDraftResponse} from './astraDraftBridge.js';
export const KMCE_KNOWLEDGE_VERSION='kmce-source-31438cc1-pilot-v1';
export type KnowledgeEntry={id:string; topic:string; claim:string; source:string; sourceRevision:string; verification:'source_code_only'};
export const KMCE_KNOWLEDGE:readonly KnowledgeEntry[]=[
 {id:'provider_identifiers',topic:'agd pace provider identification',
  claim:'The KMCE CE issue handler embeds AGD PACE provider identifier 441585 and local identifier 217702 in certificate metadata. This establishes what is coded, not independent verification of current approval status.',
  source:'frontend/app/api/delivery/ce/issue/route.ts',sourceRevision:'31438cc1',verification:'source_code_only'},
 {id:'provider_roster',topic:'agd pace provider roster',
  claim:'The KMCE educator AGD roster export source identifies Kingdom Mindset CE with provider identifier 441585.',
  source:'frontend/app/api/admin/educators/[id]/agd-roster/route.ts',sourceRevision:'31438cc1',verification:'source_code_only'},
 {id:'faculty_profile',topic:'faculty dr timothy adams credentials',
  claim:'The authenticated KMCE role bootstrap code refers to Dr. Timothy Adams with credentials DDS, D.ASBA, D.ACSDD, titled Lead Faculty & Clinical Innovator | Craniofacial Biodentistry & Airway Development. This is a configured profile, not a live educator enrollment count.',
  source:'frontend/lib/auth.ts',sourceRevision:'31438cc1',verification:'source_code_only'},
 {id:'outreach_gate',topic:'educator podcast outreach approval',
  claim:'The educator podcast route instructs Scout to research verified shows, Claire to review matches, Echo to prepare pitches, and explicitly requires founder approval before external outreach. It forbids sending or booking without approved action.',
  source:'frontend/app/api/admin/educators/[id]/podcasts/route.ts',sourceRevision:'31438cc1',verification:'source_code_only'},
 {id:'role_boundaries',topic:'founder educator student account role',
  claim:'The KMCE application auth source declares FOUNDER_ADMIN, EDUCATOR, and STUDENT roles, with a requireEducatorAccess function comparing the signed-in educator ID to the target educator ID. It does not establish that the planned seven-role matrix is deployed.',
  source:'frontend/lib/auth.ts',sourceRevision:'31438cc1',verification:'source_code_only'},
];
const TERM_GROUPS:readonly {test:RegExp;ids:readonly string[]}[]=[
 {test:/\b(agd|pace|provider|certificate|credit)\b/i,ids:['provider_identifiers','provider_roster']},
 {test:/\b(timothy|adams|faculty|credentials|craniofacial)\b/i,ids:['faculty_profile']},
 {test:/\b(podcast|outreach|pitch|scout|claire|echo)\b/i,ids:['outreach_gate']},
 {test:/\b(student|educator|founder|role|account|permission)\b/i,ids:['role_boundaries']},
];
export function selectKmceKnowledge(question:string):KnowledgeEntry[]{
 if(typeof question!=='string'||question.length<3||question.length>1000)throw new Error('KMCE_KNOWLEDGE_INVALID_QUESTION');
 const ids=new Set<string>();
 for(const group of TERM_GROUPS)if(group.test.test(question))for(const id of group.ids)ids.add(id);
 return KMCE_KNOWLEDGE.filter(entry=>ids.has(entry.id)).slice(0,6);
}
export type KnowledgeDraftResult={status:'draft'|'not_established';knowledgeVersion:string;answer:string;usedSources:KnowledgeEntry[];astra?:AstraDraftResponse};
export async function answerKmceWithAstra(args:{question:string;taskId:string;agentId:'simon';draftOnly:true;externalActionsAllowed:false},invoke:typeof draftWithAstra=draftWithAstra):Promise<KnowledgeDraftResult>{
 const entries=selectKmceKnowledge(args.question);
 if(!entries.length)return {status:'not_established',knowledgeVersion:KMCE_KNOWLEDGE_VERSION,
  answer:'Not established by the approved KMCE source pack. No source evidence found for this question.',usedSources:[]};
 const result=await invoke({...args,evidence:entries.map(x=>({id:x.id,text:x.claim+' Source: '+x.source+' @ '+x.sourceRevision+'.'}))});
 return {status:'draft',knowledgeVersion:KMCE_KNOWLEDGE_VERSION,answer:result.answer,usedSources:entries,astra:result};
}
