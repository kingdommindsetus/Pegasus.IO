import React,{useEffect,useState} from 'react';
import {Database,LockKeyhole,ShieldCheck} from 'lucide-react';
import {JobTracePanel} from './JobTracePanel';

/**
 * Local development ONLY. Uses the existing token-gated, loopback-only,
 * isolated Postgres trace endpoint. Never stores a bearer token outside React state.
 * Do not promote this as the production founder authorization strategy.
 */
export function GodsEyeLocalEvidencePanel(){
 const [token,setToken]=useState('');
 const [connected,setConnected]=useState(false);
 const [draft,setDraft]=useState('');
 useEffect(()=>()=>{setToken('');},[]);
 if(!import.meta.env.DEV)return null;
 return <section aria-label="God's Eye isolated PostgreSQL evidence" className="rounded-2xl border border-emerald-800/40 bg-[#101925] p-5 space-y-4">
  <div className="flex items-start gap-3">
   <Database className="shrink-0 text-emerald-300" size={24}/>
   <div>
    <h2 className="text-xl font-bold">REAL POSTGRESQL · DEVELOPMENT TRACE</h2>
    <p className="mt-1 text-xs leading-relaxed text-slate-400">
     Source: Pegasus isolated Windows database only. Existing local job-trace endpoint verifies
     loopback, a separate access token and exact acceptance scope. No production or customer records.
    </p>
   </div>
  </div>
  {!connected?<form onSubmit={e=>{
   e.preventDefault();
   const value=draft.trim();
   if(!value)return;
   setToken(value);setDraft('');setConnected(true);
  }} className="flex flex-wrap gap-2">
   <label className="flex-1 min-w-52">
    <span className="mb-1 block text-xs text-slate-400">Isolated development read token</span>
    <input type="password" autoComplete="off" value={draft} onChange={e=>setDraft(e.target.value)}
     placeholder="Local token only" aria-label="God's Eye local read token"
     className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"/>
   </label>
   <button type="submit" disabled={!draft.trim()}
    className="self-end rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Connect read-only</button>
  </form>:<div className="space-y-3">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <span className="flex items-center gap-2 text-xs font-semibold text-emerald-300"><ShieldCheck size={15}/> Development trace access requested; server verifies each request</span>
    <button type="button" onClick={()=>{setToken('');setConnected(false);setDraft('');}}
     className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300">Disconnect</button>
   </div>
   <JobTracePanel token={token}/>
  </div>}
  <p className="flex items-start gap-2 text-xs text-amber-200/80"><LockKeyhole size={14} className="shrink-0"/>
   The access token is not saved to local storage, transmitted to another site or included in the URL.
   The endpoint is unavailable in production. A separate founder-authenticated tenant-scoped reader is still required before launch.
  </p>
 </section>;
}
