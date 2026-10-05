import postgres from 'postgres';

let client:ReturnType<typeof postgres>|null=null;

export function databaseUrlConfigured(){
 return Boolean(process.env.DATABASE_URL?.trim());
}
export function db(){
 if(client)return client;
 const url=process.env.DATABASE_URL?.trim();
 if(!url)throw new Error('DATABASE_URL is not configured');
 client=postgres(url,{max:5,idle_timeout:20,connect_timeout:10,connection:{search_path:'pegasus_core,public'}});
 return client;
}
export async function closeDb(){
 if(client){await client.end({timeout:5});client=null;}
}