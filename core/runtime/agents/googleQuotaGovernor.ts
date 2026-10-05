import { db } from '../../database/client.js';

const WINDOW_MS = Number(process.env.GOOGLE_REASONING_WINDOW_MS || 60_000);
const MAX_REQUESTS = Number(process.env.GOOGLE_REASONING_RPM || 9);
const SAFETY_MS = Number(process.env.GOOGLE_REASONING_SAFETY_MS || 1_500);
const PROVIDER = 'google-ai-studio-reasoning';

function sleep(ms:number){
 return new Promise(resolve=>setTimeout(resolve,ms));
}

export async function acquireGoogleReasoningSlot(){
 const sql=db();
 let totalWaitMs=0;

 while(true){
  const waitMs=await sql.begin(async tx=>{
   await tx`select pg_advisory_xact_lock(hashtext('pegasus-google-ai-reasoning-rpm'))`;
   await tx`
    delete from pegasus_core.provider_rate_events
    where occurred_at < now() - interval '2 minutes'
   `;

   const rows:any[]=await tx`
    select count(*)::int as count, min(occurred_at) as oldest
    from pegasus_core.provider_rate_events
    where provider=${PROVIDER}
      and occurred_at > now() - interval '60 seconds'
   `;

   const count=Number(rows?.[0]?.count||0);
   if(count < MAX_REQUESTS){
    await tx`insert into pegasus_core.provider_rate_events(provider) values(${PROVIDER})`;
    return 0;
   }

   const oldest=rows?.[0]?.oldest ? new Date(rows[0].oldest).getTime() : Date.now();
   return Math.max(500, WINDOW_MS-(Date.now()-oldest)+SAFETY_MS);
  });

  if(waitMs<=0)return totalWaitMs;
  totalWaitMs+=waitMs;
  await sleep(waitMs);
 }
}
