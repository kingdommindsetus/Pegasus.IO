import {db} from '../../database/client.js';
import {buildContextPacket} from '../context/buildContextPacket.js';
import {postgresContextSource} from '../context/postgresContextSource.js';
import {PegasusReasoner} from '../agents/pegasusReasoner.js';
import {executeAgentTask} from './executeAgentTask.js';
import {postgresPermissions} from './postgresPermissions.js';
import {coreSkills} from './coreSkills.js';
import type {PegasusJob} from '../../work/jobs/stateMachine.js';
export async function realAgentWork(job:PegasusJob){const sql=db();if(!job.taskId)throw Error('Real agent job requires task');
 const [row]=await sql`SELECT t.*,a.mission,a.department,o.id objective_id FROM pegasus_core.tasks t JOIN pegasus_core.agents a ON a.id=t.assigned_agent_id LEFT JOIN pegasus_core.objectives o ON o.id=t.objective_id WHERE t.id=${job.taskId}`;if(!row)throw Error('Task not found');
 const context=await buildContextPacket(postgresContextSource,{agent:{id:job.agentId,mission:row.mission,role:row.department,objective:row.objective_id},projectId:row.project_id,task:row});
 const result=await executeAgentTask({context,reasoner:new PegasusReasoner(),skills:coreSkills,permissions:postgresPermissions});
 return {status:result.status,output:{decision:result.decision,skillOutput:result.output},evidence:result.evidence};
}
