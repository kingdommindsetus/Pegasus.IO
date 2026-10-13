/**
 * Read-only identity probe. Invoke ONLY through a branch-scoped Vercel preview
 * environment injector. Never prints DB URL, password, hostname or tokens.
 * No task claims, writes, migrations, agent execution, or billing.
 */
import postgres from 'postgres';
const url=String(process.env.DATABASE_URL||'').trim();
if(!url)throw Error('Branch preview DATABASE_URL is not available');
const parsed=new URL(url);
if(!['postgres:','postgresql:'].includes(parsed.protocol))throw Error('Expected PostgreSQL URL');
if(!parsed.hostname || !parsed.username || !parsed.pathname)throw Error('Database URL incomplete');
const sql=postgres(url,{max:1,idle_timeout:2,connect_timeout:8});
try{
 const out=await sql.begin(async tx=>{
  await tx`SET TRANSACTION READ ONLY`;
  const [r]=await tx`
   SELECT current_database() AS database_name,current_user AS database_role,
    to_regclass('pegasus_core.organizations') IS NOT NULL AS organization_table_exists
  `;
  let company=null;
  if(r.organization_table_exists){
   const [o]=await tx`
    SELECT id,name,slug FROM pegasus_core.organizations
    WHERE slug='kingdom-mindset-ce' AND name='Kingdom Mindset CE' LIMIT 1
   `;
   if(o)company={id:String(o.id),name:String(o.name),slug:String(o.slug)};
  }
  return {databaseName:String(r.database_name),databaseRole:String(r.database_role),
   organizationTableExists:!!r.organization_table_exists,company};
 });
 const configured=String(process.env.PEGASUS_FOUNDER_ORGANIZATION_ID||'').trim();
 const match=!!out.company && configured.toLowerCase()===out.company.id.toLowerCase();
 console.log('PEGASUS_BRANCH_PREVIEW_READONLY_DB_PROOF',JSON.stringify({
  ...out,founderOrgConfigPresent:!!configured,founderOrgMatches:match,
  readOnly:true,credentialsPrinted:false,productionChanges:false
 }));
}finally{await sql.end({timeout:3});}
