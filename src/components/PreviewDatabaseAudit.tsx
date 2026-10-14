import React,{useCallback,useEffect,useState} from 'react';
import {Database,ShieldCheck,LockKeyhole,RefreshCw} from 'lucide-react';
import {launchProgress} from '../../core/integrations/pegasusLaunchGates';

type Diagnostic={
 readOnly:true;environment:'preview';databaseName:string;connectionRole:string;
 endpointFingerprint?:string;neonEndpointId?:string|null;
 coreOrganizationSchemaReady:boolean;
 company:null|{id:string;name:string;slug:string};
 configuration:{companyScopeConfigured:boolean;matchesCanonicalCompany:boolean};
};
type Result='idle'|'loading'|'ready'|'locked'|'unavailable';
const gateProgress=launchProgress();
/** Operator-only visibility, not an authorization or execution surface. */
export function PreviewDatabaseAudit({unlocked}:{unlocked:boolean}){
 const [state,setState]=useState<Result>('idle');
 const [data,setData]=useState<Diagnostic|null>(null);
 const [status,setStatus]=useState('');
 const check=useCallback(async()=>{
  setState('loading');setData(null);setStatus('');
  try{
   const r=await fetch('/api/core/staging-diagnostics',{method:'GET',
    credentials:'same-origin',cache:'no-store',headers:{accept:'application/json'}});
   if(r.status===401||r.status===403){setState('locked');return;}
   if(r.status===404){setState('unavailable');setStatus('Not a protected preview deployment.');return;}
   if(!r.ok){setState('unavailable');setStatus('Diagnostic unavailable (HTTP '+r.status+').');return;}
   const x=await r.json() as Diagnostic;
   if(x.readOnly!==true||x.environment!=='preview'||typeof x.databaseName!=='string'
    ||typeof x.coreOrganizationSchemaReady!=='boolean'||!x.configuration)
    throw Error('Unexpected diagnostic response');
   setData(x);setState('ready');
  }catch{setState('unavailable');setStatus('Database verification could not complete.');}
 },[]);
 useEffect(()=>{
  if(unlocked)void check();
  else{setState('idle');setData(null);setStatus('');}
 },[unlocked,check]);
 return <section aria-label="Gate 6 protected staging database audit"
   className="rounded-2xl border border-amber-500/30 bg-slate-900/65 p-5 space-y-4">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div>
    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-amber-300"><Database size={16}/>Gate 6 · Secure Staging</div>
    <h3 className="mt-1 text-lg font-bold text-white">Verify the real Pegasus database</h3>
    <p className="mt-1 text-xs text-slate-400">Read-only evidence; never accesses payments, model keys, agent jobs or private customer records.</p>
   </div>
   <button type="button" disabled={!unlocked||state==='loading'} onClick={()=>void check()}
    className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-950/30 px-4 py-2 text-xs font-bold text-amber-200 disabled:opacity-40">
    <RefreshCw size={14}/>{state==='loading'?'VERIFYING…':'VERIFY DATABASE'}
   </button>
  </div>
  <div className="space-y-2">
   <div className="flex items-center justify-between gap-2 text-xs"><span className="font-semibold text-white">PEGASUS LAUNCH</span><span className="font-bold text-amber-200">{gateProgress.percent}% · {gateProgress.completed} of {gateProgress.total} gates</span></div>
   <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-amber-400" style={{width:`${gateProgress.percent}%`}}/></div>
  </div>
  {!unlocked&&<p className="flex items-center gap-2 text-sm text-amber-200"><LockKeyhole size={16}/>Unlock Core with your founder password above. The protected read-only database check will run automatically.</p>}
  {unlocked&&state==='idle'&&<p className="text-sm text-slate-300">Founder session active. Preparing read-only database verification.</p>}
  {unlocked&&state==='loading'&&<p role="status" className="text-sm text-slate-300">Checking the staging database identity securely…</p>}
  {state==='locked'&&<p className="text-sm text-amber-200">Founder session expired or was rejected. Sign in again.</p>}
  {state==='unavailable'&&<p className="text-sm text-amber-200">{status}</p>}
  {state==='ready'&&data&&<div className="grid gap-3 sm:grid-cols-2 text-sm">
   <div className="rounded-xl border border-slate-700 p-3"><div className="text-xs text-slate-400">Database</div><strong>{data.databaseName}</strong></div>
   <div className="rounded-xl border border-slate-700 p-3"><div className="text-xs text-slate-400">Database role</div><strong>{data.connectionRole}</strong></div>
   {data.neonEndpointId&&<div className="rounded-xl border border-slate-700 p-3 sm:col-span-2"><div className="text-xs text-slate-400">Neon database endpoint ID</div><code className="break-all text-xs text-amber-200">{data.neonEndpointId}</code><p className="mt-1 text-xs text-slate-500">Use this endpoint ID to locate the matching Neon project and confirm it is safe for staging. It is not a connection string.</p></div>}
   {data.endpointFingerprint&&<div className="rounded-xl border border-slate-700 p-3 sm:col-span-2"><div className="text-xs text-slate-400">Database endpoint verification fingerprint</div><code className="text-xs text-amber-200">{data.endpointFingerprint}</code><p className="mt-1 text-xs text-slate-500">Non-secret endpoint identifier for matching with the approved Neon branch before provisioning.</p></div>}
   <div className="rounded-xl border border-slate-700 p-3"><div className="text-xs text-slate-400">Pegasus organizations schema</div><strong>{data.coreOrganizationSchemaReady?'Present':'Missing'}</strong></div>
   <div className="rounded-xl border border-slate-700 p-3"><div className="text-xs text-slate-400">KMCE company record</div><strong>{data.company?'Found':'Not found'}</strong></div>
   {data.company&&<div className="rounded-xl border border-slate-700 p-3 sm:col-span-2">
    <div className="text-xs text-slate-400">Verified staging organization ID (not the local test UUID)</div>
    <code className="break-all text-xs text-amber-200">{data.company.id}</code></div>}
   <div className="rounded-xl border border-slate-700 p-3"><div className="text-xs text-slate-400">Founder organization configured</div><strong>{data.configuration.companyScopeConfigured?'Yes':'No'}</strong></div>
   <div className="rounded-xl border border-slate-700 p-3"><div className="text-xs text-slate-400">Company ID matches</div><strong>{data.configuration.matchesCanonicalCompany?'Yes':'No'}</strong></div>
   <p className="sm:col-span-2 flex items-center gap-2 text-xs text-slate-400"><ShieldCheck size={14}/>Verification completed read-only. Gate 6 stays open until the founder company matches and tenant-isolation checks pass.</p>
  </div>}
 </section>;
}
