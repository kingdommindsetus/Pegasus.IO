import {db} from '../../database/client.js';
import type {ContextSource} from './buildContextPacket.js';
import {rankSecondBrain,type SecondBrainMemory} from '../secondBrain.js';
const sql=db(), rows=(x:Iterable<unknown>)=>Array.from(x);
export const postgresContextSource:ContextSource={
 async companyCore(agentId){return rows(await sql`SELECT id,display_name,department,mission FROM pegasus_core.agents WHERE id=${agentId} OR enabled=true ORDER BY (id=${agentId}) DESC,display_name LIMIT 12`);},
 async project(projectId){const r=await sql`SELECT id,name,objective,status,metadata FROM pegasus_core.projects WHERE id=${projectId}`;return r[0]||null;},
 async client(){return [];},
 async objective(objectiveId){if(!objectiveId)return null;const r=await sql`SELECT id,title,description,success_criteria,constraints,metrics,status_v2,progress FROM pegasus_core.objectives WHERE id=${objectiveId}`;return r[0]||null;},
 async entities(){return [];},
 async memories(agentId,projectId,task){
  const historical=agentId==='simon'||agentId==='iris';
  const result=historical
   ? await sql`
      SELECT id,scope,scope_id,agent_id,project_id,memory_kind,memory_partition,subject,left(content,2500) AS content,authority,confidence,importance,created_at,metadata
      FROM pegasus_core.memories
      WHERE valid_to IS NULL
        AND superseded_by IS NULL
        AND (
         (memory_partition='company_memory' AND scope='company')
         OR (memory_partition='agent_role_memory' AND scope='agent' AND agent_id=${agentId})
         OR (
          memory_partition='mission_run_memory'
          AND source_type='agent_execution'
          AND authority='agent_generated'
         )
        )
      ORDER BY created_at DESC
      LIMIT 60
     `
   : await sql`
      SELECT id,scope,scope_id,agent_id,project_id,memory_kind,memory_partition,subject,left(content,2500) AS content,authority,confidence,importance,created_at,metadata
      FROM pegasus_core.memories
      WHERE valid_to IS NULL
        AND superseded_by IS NULL
        AND (
         (memory_partition='company_memory' AND scope='company')
         OR (memory_partition='agent_role_memory' AND scope='agent' AND agent_id=${agentId})
         OR (
          memory_partition='mission_run_memory'
          AND source_type='agent_execution'
          AND authority='agent_generated'
          AND project_id=${projectId}::uuid
         )
        )
      ORDER BY created_at DESC
      LIMIT 60
     `;
  const r=rows(result) as SecondBrainMemory[];
  return rankSecondBrain(r,task,12);
 },
 async policies(agentId){return rows(await sql`SELECT skill_key,permission FROM pegasus_core.agent_skills WHERE agent_id=${agentId}`);},
 async skills(agentId){return rows(await sql`SELECT s.key,s.name,s.description,COALESCE(a.permission,'deny') permission FROM pegasus_core.skills s LEFT JOIN pegasus_core.agent_skills a ON a.skill_key=s.key AND a.agent_id=${agentId} WHERE s.enabled=true`);},
 async evidence(task:any){if(!task?.id)return [];return rows(await sql`SELECT evidence_type,content,verified,verifier,created_at FROM pegasus_core.evidence WHERE task_id=${task.id} ORDER BY created_at DESC LIMIT 20`);}
};
