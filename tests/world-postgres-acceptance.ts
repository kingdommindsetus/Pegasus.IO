import {db,closeDb} from '../core/database/client.js';
import {claimNextJobForObjective,postgresJobStore,closeJobRun,unlockDependents} from '../core/work/jobs/repository.js';
import {runJob} from '../core/work/workers/runJob.js';
import {executeAgentTask} from '../core/runtime/execution/executeAgentTask.js';
import {coreSkills} from '../core/runtime/execution/coreSkills.js';
const expected='pegasus_world_accept_1011';
const url=new URL(process.env.DATABASE_URL||'http://invalid');
if(url.pathname.slice(1)!==expected || url.hostname!=='127.0.0.1')throw Error('Refusing non-isolated database');
const sql=db();
try {
 const [identity]=await sql`SELECT current_database() AS name,current_user AS usr`;
 if(identity.name!==expected || identity.usr!=='pegasus_world_test_1011') throw Error('Database/role mismatch');
 const [agent]=await sql`SELECT id FROM pegasus_core.agents WHERE id='mark'`;
 if(!agent)throw Error('Mark was not seeded by migrations');
 const [project]=await sql`INSERT INTO pegasus_core.projects(name,objective) VALUES('World acceptance isolated','Test draft only') RETURNING id`;
 const [objective]=await sql`INSERT INTO pegasus_core.objectives(project_id,title) VALUES(${project.id},'Safe draft-only execution') RETURNING id`;
 const [task]=await sql`INSERT INTO pegasus_core.tasks(project_id,objective_id,assigned_agent_id,title,instructions,input) VALUES(${project.id},${objective.id},'mark','Draft internal sample','No external actions',${sql.json({draftOnly:true})}) RETURNING id`;
 const [seed]=await sql`INSERT INTO pegasus_core.jobs(task_id,agent_id,skill_key,input,idempotency_key) VALUES(${task.id},'mark','draft_email',${sql.json({draftOnly:true})},${'acceptance-'+task.id}) RETURNING id`;
 const job=await claimNextJobForObjective(objective.id,'kingdom-acceptance-worker',60);
 if(!job||job.id!==seed.id)throw Error('Claim mismatch');
 await postgresJobStore.recordEvent(job,'job_claimed',{workerId:'kingdom-acceptance-worker'});
 const context:any={agent:{id:'mark',role:'Marketing',mission:'Draft internal review only'},projectId:project.id,project:{id:project.id},objectiveContext:{id:objective.id},relevantMemories:[]};
 const result=await runJob(job,postgresJobStore,async()=>{
  const execution=await executeAgentTask({context,reasoner:{async decide(){return {skillKey:'draft_email',rationale:'Isolated acceptance',input:{target:'internal',task:'test draft'}}}},permissions:{async permission(){return 'allow' as const}},skills:coreSkills});
  return {status:execution.status,output:execution.output,evidence:execution.evidence};
 });
 await closeJobRun(result,'kingdom-acceptance-worker');
 result.leaseExpiresAt=undefined;await postgresJobStore.save(result);
 await unlockDependents(result);
 const [persisted]=await sql`SELECT id,agent_id,status,attempts,result FROM pegasus_core.jobs WHERE id=${job.id}`;
 const events=await sql`SELECT event_type FROM pegasus_core.events WHERE entity_id=${job.id} ORDER BY id`;
 const evidence=await sql`SELECT id FROM pegasus_core.evidence WHERE job_id=${job.id}`;
 const memories=await sql`SELECT id FROM pegasus_core.memories WHERE metadata->>'jobId'=${job.id}`;
 if(persisted.status!=='completed'||persisted.attempts!==1||events.length<2||!evidence.length||!memories.length)throw Error('Persistence acceptance failed');
 console.log('ACCEPTANCE_PASS',JSON.stringify({database:identity.name,role:identity.usr,objectiveId:objective.id,taskId:task.id,jobId:job.id,agentId:persisted.agent_id,status:persisted.status,attempts:persisted.attempts,events:events.map(e=>e.event_type),evidenceCount:evidence.length,memoryCount:memories.length,result:persisted.result}));
} finally {await closeDb()}
