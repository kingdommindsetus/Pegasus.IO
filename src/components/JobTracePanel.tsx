import {useEffect,useState} from 'react';
type Trace={jobId:string;agentId:string|null;skill:string|null;status:string;timelineState:string;attempts:number;maxAttempts:number;lastError:string|null;leaseExpiresAt:string|null;updatedAt:string;runs:{id:string;attempt:number;workerId:string|null;status:string;startedAt:string;finishedAt:string|null;error:string|null}[];events:{id:string;type:string;at:string}[];evidence:{id:string;type:string;at:string;verified:boolean}[];memoryIds:string[]};
type Snapshot={status:string;generatedAt?:string;records?:Trace[]};
export function JobTracePanel({token}:{token:string}){
 const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[error,setError]=useState('');
 const [lastResponse,setLastResponse]=useState(0);
 useEffect(()=>{
  let closed=false;
  async function refresh(){
   if(!token){setSnapshot(null);setLastResponse(0);return;}
   try{
    const response=await fetch('/api/dev/job-trace',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
    if(!response.ok)throw Error('Read-only job trace unavailable ('+response.status+')');
    const data=await response.json() as Snapshot;
    if(!closed){setSnapshot(data);setError('');setLastResponse(Date.now());}
   }catch(e){if(!closed){setSnapshot(null);setLastResponse(0);setError(e instanceof Error?e.message:'Trace unavailable');}}
  }
  void refresh();const timer=setInterval(()=>{void refresh();},15000);
  return()=>{closed=true;clearInterval(timer);};
 },[token]);
 const old=!lastResponse||Date.now()-lastResponse>45000||!snapshot?.generatedAt||
  Number.isNaN(Date.parse(snapshot.generatedAt))||Date.now()-Date.parse(snapshot.generatedAt)>45000||Date.parse(snapshot.generatedAt)>Date.now()+5000;
 const status=!token||old?'stale':snapshot?.status||'stale';
 return <section aria-label="Pegasus isolated job lifecycle trace" className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 space-y-3">
  <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">JARVIS · JOB LIFECYCLE</h2><strong data-testid="job-trace-status" className={status==='live'?'text-emerald-300':'text-amber-300'}>{status.toUpperCase()}</strong></div>
  <p className="text-xs text-slate-400">Read-only development evidence · job, run, event, memory and evidence IDs; no customer input exposed.</p>
  {error&&<p role="alert" className="text-amber-300 text-xs">{error}</p>}
  {status!=='live'?<p className="text-amber-300 text-xs">Trace is stale or disconnected. No current lifecycle claims are verified.</p>:
   <div className="space-y-2">{(snapshot?.records||[]).length===0?<p className="text-xs">No scoped jobs available.</p>:(snapshot?.records||[]).map(job=>
    <details key={job.jobId} className="border border-slate-700 rounded-lg p-3 text-xs">
     <summary className="cursor-pointer flex gap-2 flex-wrap items-center"><strong className="text-cyan-300">{job.agentId||'Unknown agent'}</strong><span>{job.skill||'Unknown skill'}</span><span className="font-semibold uppercase">{job.timelineState}</span><span>Attempts {job.attempts}/{job.maxAttempts}</span><code>{job.jobId}</code></summary>
     <div className="mt-3 space-y-2 text-slate-300">
      <p>Updated: {job.updatedAt}; lease: {job.leaseExpiresAt||'none'}; {job.lastError?'Error: '+job.lastError:'No recorded error'}</p>
      <p className="font-semibold">Runs ({job.runs.length})</p>
      {job.runs.map(r=><p key={r.id}>#{r.attempt} · {r.status} · {r.workerId||'unassigned'} · {r.startedAt} → {r.finishedAt||'unfinished'} · run {r.id}{r.error?' · '+r.error:''}</p>)}
      <p className="font-semibold">Events ({job.events.length})</p>
      {job.events.map(e=><p key={e.id}>Event {e.id} · {e.type} · {e.at}</p>)}
      <p className="font-semibold">Evidence ({job.evidence.length})</p>
      {job.evidence.map(e=><p key={e.id}>Evidence {e.id} · {e.type} · verified {String(e.verified)} · {e.at}</p>)}
      <p>Linked memory IDs ({job.memoryIds.length}): {job.memoryIds.join(', ')||'none'}</p>
     </div>
    </details>)}</div>}
 </section>;
}
