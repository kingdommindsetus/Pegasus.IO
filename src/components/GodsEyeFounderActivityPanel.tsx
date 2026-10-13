import React,{useCallback,useEffect,useState} from 'react';
import {Database,LockKeyhole,RefreshCw,ShieldCheck} from 'lucide-react';
type Job={
 jobId:string;taskId:string;objectiveId:string|null;agentId:string|null;skill:string|null;
 status:string;attempts:number;maxAttempts:number;taskTitle:string;updatedAt:string;
 runCount:number;evidenceCount:number;eventCount:number;memoryCount:number;
};
type View={scope:'configured_founder_organization';readOnly:true;generatedAt:string;records:Job[]};
type LoadState='loading'|'ready'|'locked'|'unavailable';
/** A projection of verified founder-company job records, never raw input/output. */
export function GodsEyeFounderActivityPanel(){
 const [state,setState]=useState<LoadState>('loading');
 const [view,setView]=useState<View|null>(null);
 const reload=useCallback(async()=>{
  setState('loading');setView(null);
  try{
   const response=await fetch('/api/core/founder-activity?limit=30',{credentials:'same-origin',cache:'no-store'});
   if(response.status===401||response.status===403){setState('locked');return;}
   if(!response.ok){setState('unavailable');return;}
   const payload=await response.json() as View;
   if(payload.scope!=='configured_founder_organization'||payload.readOnly!==true||
      !Array.isArray(payload.records))throw Error('Unexpected scoped response');
   setView(payload);setState('ready');
  }catch{setState('unavailable');}
 },[]);
 useEffect(()=>{void reload();},[reload]);
 return <section aria-label="God's Eye founder-scoped activity" className="rounded-2xl border border-slate-800 bg-[#101725] p-5 space-y-3">
  <header className="flex flex-wrap items-start justify-between gap-3">
   <div className="flex items-start gap-3">
    <Database size={24} className="shrink-0 text-amber-300"/>
    <div>
     <h2 className="text-xl font-bold">FOUNDER · COMPANY JOB ACTIVITY</h2>
     <p className="mt-1 text-xs text-slate-400">Read-only, server-scoped PostgreSQL history. The browser cannot choose another company or view private inputs, outputs or evidence content.</p>
    </div>
   </div>
   <button type="button" onClick={()=>void reload()} disabled={state==='loading'}
    className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-40">
    <RefreshCw size={14}/> Refresh
   </button>
  </header>
  {state==='loading'&&<p className="text-sm text-slate-400">Checking signed founder session and scoped records...</p>}
  {state==='locked'&&<p className="flex gap-2 text-sm text-amber-200"><LockKeyhole size={16}/> Founder sign-in required. Open the War Room to unlock Pegasus Core.</p>}
  {state==='unavailable'&&<p className="flex gap-2 text-sm text-amber-200"><LockKeyhole size={16}/> Company-scoped activity is unavailable or not configured. No activity has been verified.</p>}
  {state==='ready'&&view&&<>
   <p className="flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck size={15}/> Scoped database response received · {view.records.length} job records · as of {view.generatedAt}</p>
   {view.records.length===0?<p className="text-sm text-slate-400">No jobs found in the configured company.</p>:
    <div className="grid gap-2">{view.records.map(j=><details key={j.jobId} className="rounded-lg border border-slate-800 bg-slate-950/45 p-3">
     <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm">
      <span className="font-semibold text-white">{j.agentId||'Agent unavailable'} · {j.taskTitle||'Untitled task'}</span>
      <span className="text-amber-200">{j.status} · attempts {j.attempts}/{j.maxAttempts}</span>
     </summary>
     <p className="mt-2 text-xs text-slate-500">Job {j.jobId} · updated {j.updatedAt}</p>
     <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
      <span>Runs {j.runCount}</span><span>Events {j.eventCount}</span>
      <span>Evidence {j.evidenceCount}</span><span>Memories {j.memoryCount}</span>
     </div>
    </details>)}</div>}
  </>}
  <p className="text-xs text-slate-500">Database completion is not equivalent to human approval. This panel never executes tasks, approves results or processes money.</p>
 </section>;
}
