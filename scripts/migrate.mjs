import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import dotenv from 'dotenv';

const root=process.cwd();
dotenv.config({path:path.join(root,'.env.local'),quiet:true});
dotenv.config({quiet:true});

const databaseUrl=String(process.env.DATABASE_URL||'').trim();
if(!databaseUrl)throw new Error('DATABASE_URL is required. Copy .env.example to .env.local and set DATABASE_URL.');

const migrationsDir=path.join(root,'core','database','migrations');
const files=fs.readdirSync(migrationsDir)
  .filter(name=>/^\d+.*\.sql$/i.test(name))
  .sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));

if(!files.length)throw new Error('No database migrations found.');

const sql=postgres(databaseUrl,{max:1});

try{
  await sql.unsafe('CREATE SCHEMA IF NOT EXISTS pegasus_core');
  const state=await sql.unsafe("SELECT to_regclass('pegasus_core.agents')::text AS agents, to_regclass('pegasus_core.schema_migrations')::text AS ledger");
  if(state[0]?.agents && !state[0]?.ledger){
    throw new Error('Existing Pegasus schema detected without migration ledger. This onboarding command is intended for a fresh database. Do not run it against an existing production database.');
  }
  await sql.unsafe("CREATE TABLE IF NOT EXISTS pegasus_core.schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  const appliedRows=await sql.unsafe('SELECT version FROM pegasus_core.schema_migrations');
  const applied=new Set(appliedRows.map(row=>String(row.version)));

  for(const file of files){
    if(applied.has(file)){
      console.log('SKIP '+file);
      continue;
    }
    const body=fs.readFileSync(path.join(migrationsDir,file),'utf8');
    console.log('APPLY '+file);
    await sql.begin(async tx=>{
      await tx.unsafe('SET LOCAL search_path TO pegasus_core, public');
      await tx.unsafe(body);
      const safeFile=file.replaceAll("'","''");
      await tx.unsafe("INSERT INTO pegasus_core.schema_migrations(version) VALUES ('"+safeFile+"')");
    });
  }

  console.log('MIGRATIONS_COMPLETE');
}finally{
  await sql.end({timeout:5});
}
