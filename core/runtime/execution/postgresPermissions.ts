import {db} from '../../database/client.js';
import type {PermissionResolver} from './executeAgentTask.js';
import type {Permission} from '../../approvals/policy.js';
export const postgresPermissions:PermissionResolver={async permission(agentId,skillKey){const sql=db();const r=await sql`SELECT permission FROM pegasus_core.agent_skills WHERE agent_id=${agentId} AND skill_key=${skillKey}`;return (r[0]?.permission||'deny') as Permission;}};
