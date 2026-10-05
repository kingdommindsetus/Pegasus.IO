import React,{useEffect,useState} from 'react';
import {Play,RotateCcw,ShieldCheck} from 'lucide-react';
import {AGENTS} from '../data/agents';
import {AvatarFace} from './AvatarFace';

type Proof={completedTasks:number;completedRuns:number;evidenceCount:number;memoryCount:number;verified:boolean};
const IDS=['simon','marie','iris','mark','cammy','evan','tube','lucy','snake','alice','echo','booker'];

async function readApiJson(r:Response){
 const raw=await r.text();
 if(!raw)return {};
 try{return JSON.parse(raw);}
 catch{throw Error((r.ok?'Invalid server response: ':'Server error: ')+raw.slice(0,240));}
}

export function CoreWarRoomV2({objective,setObjective}:{objective:string;setObjective:(v:string)=>void}){
 const fresh=()=>Object.fromEntries(IDS.map(x=>[x,{state:'queued',decision:null as any,telemetry:null as any}]));
 const emptyProof:Proof={completedTasks:0,completedRuns:0,evidenceCount:0,memoryCount:0,verified:false};

 const [states,setStates]=useState<any>(fresh());
 const [proof,setProof]=useState<Proof>(emptyProof);
 const [running,setRunning]=useState(false);
 const [active,setActive]=useState('');
 const [error,setError]=useState('');
 const [executiveClose,setExecutiveClose]=useState<any>(null);
 const [unlocked,setUnlocked]=useState(false);
 const [password,setPassword]=useState('');
 const [currentMissionId,setCurrentMissionId]=useState<string|null>(null);
 const [resumeAvailable,setResumeAvailable]=useState(false);
 const [hydrating,setHydrating]=useState(true);

 function clearMissionView(){
  setStates(fresh());
  setProof(emptyProof);
  setExecutiveClose(null);
  setActive('');
  setError('');
 }

 function reset(){
  clearMissionView();
  setCurrentMissionId(null);
  setResumeAvailable(false);
 }

 async function hydrateMission(missionId?:string){
  setHydrating(true);
  try{
   const r=await fetch('/api/core/mission',{
    method:'POST',
    headers:{'content-type':'application/json'},
    credentials:'same-origin',
    body:JSON.stringify({action:'hydrate',...(missionId?{missionId}:{})})
   });
   const h=await readApiJson(r);
   if(!r.ok)throw Error(h.error||'Mission hydration failed');
   if(!h.found){setHydrating(false);return null;}

   const restored=fresh();
   for(const stage of h.stages||[]){
    if(!stage?.agentId||!restored[stage.agentId])continue;
    const completed=stage.jobStatus==='completed'&&Boolean(stage.decision);
    const inFlight=['claimed','running','retrying'].includes(stage.jobStatus);
    restored[stage.agentId]={
     state:completed?'completed':inFlight?'thinking':'queued',
     decision:stage.decision||null,
     telemetry:stage.telemetry||null
    };
   }

   setStates(restored);
   setProof(h.proof||emptyProof);
   setExecutiveClose(h.executiveClose||null);
   setCurrentMissionId(h.missionId);
   setResumeAvailable(Boolean(!h.complete||h.needsExecutiveClose));
   if(typeof h.founderObjective==='string')setObjective(h.founderObjective);
   return h;
  }catch(e:any){
   setError(e?.message||String(e));
   return null;
  }finally{
   setHydrating(false);
  }
 }

 useEffect(()=>{
  let cancelled=false;
  (async()=>{
   try{
    const r=await fetch('/api/core/session',{method:'GET',credentials:'same-origin',cache:'no-store'});
    if(r.ok&&!cancelled){
     setUnlocked(true);
     await hydrateMission();
    }
   }finally{
    if(!cancelled)setHydrating(false);
   }
  })();
  return()=>{cancelled=true;};
 },[]);

 async function prepareSpeech(id:string,text:string,jobId?:string){
  try{
   const r=await fetch('/api/agent/speak',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({agentId:id,text:text.slice(0,450),...(jobId?{jobId}:{})})
   });
   const j=await readApiJson(r);
   if(!r.ok)return {audio:null,provider:'Voice Error',voiceName:null,fallback:true};
   if(j.fallbackToWebSpeech||!j.audioUrl)return {audio:null,provider:'Browser Speech',voiceName:null,fallback:true};
   const a=new Audio(j.audioUrl);
   a.preload='auto';
   a.load();
   await new Promise<void>(ok=>{
    let done=false;
    const finish=()=>{if(done)return;done=true;ok();};
    a.oncanplaythrough=finish;
    a.onerror=finish;
    setTimeout(finish,2500);
   });
   return {
    audio:a,
    provider:j.provider==='ELEVENLABS'?'ElevenLabs':String(j.provider||'Voice'),
    voiceName:j.voiceName||j.voice||null,
    fallback:String(j.provider||'').includes('FALLBACK')
   };
  }catch{
   return {audio:null,provider:'Browser Speech',voiceName:null,fallback:true};
  }
 }

 async function playPrepared(a:HTMLAudioElement|null){
  if(!a)return;
  try{
   await a.play();
   await new Promise<void>(ok=>{a.onended=()=>ok();a.onerror=()=>ok();});
  }catch{}
 }

 async function fetchPreparedStep(missionId:string){
  const r=await fetch('/api/core/step',{
   method:'POST',
   headers:{'content-type':'application/json'},
   body:JSON.stringify({missionId})
  });
  const x=await readApiJson(r);
  if(!r.ok||x.status!=='completed')throw Error(x.error||'Core step failed');
  const id=x.agentId;
  const decision=x.result?.decision;
  const text=decision?.rationale||id+' completed the mission stage.';
  const speech=await prepareSpeech(id,text,x.jobId);
  const runtime=decision?.runtime||{};
  const telemetry={
   reasoningProvider:runtime.reasoningProvider||'Google AI Studio',
   model:runtime.model||'unknown',
   reasoningMs:runtime.reasoningMs||0,
   quotaWaitMs:runtime.quotaWaitMs||0,
   voiceProvider:speech.provider,
   voiceName:speech.voiceName,
   fallback:Boolean(runtime.fallback||speech.fallback)
  };
  return {x,id,decision,audio:speech.audio,telemetry};
 }

 async function login(){
  setError('');
  try{
   const r=await fetch('/api/core/session',{
    method:'POST',
    headers:{'content-type':'application/json'},
    credentials:'same-origin',
    body:JSON.stringify({action:'login',password})
   });
   const j=await readApiJson(r);
   if(!r.ok)throw Error(j.error||'Unlock failed');
   setUnlocked(true);
   setPassword('');
   await hydrateMission();
  }catch(e:any){setError(e?.message||String(e));}
 }

 async function finishExecutiveClose(missionId:string){
  const closeRes=await fetch('/api/core/mission',{
   method:'POST',
   headers:{'content-type':'application/json'},
   body:JSON.stringify({action:'close',missionId})
  });
  const close=await readApiJson(closeRes);
  if(!closeRes.ok)throw Error(close.error||'Simon executive close failed');
  setExecutiveClose(close);
  const closeText=close.briefing?.spokenSummary||close.briefing?.finalDecision||'Executive close complete.';
  setActive('simon');
  const closeSpeech=await prepareSpeech('simon',closeText);
  await playPrepared(closeSpeech.audio);
  setActive('');
 }

 async function run(){
  if(running||!unlocked)return;
  const isResume=Boolean(currentMissionId&&resumeAvailable);
  if(!isResume&&!objective.trim())return;

  setError('');
  setRunning(true);
  try{
   let missionId=currentMissionId;

   if(!isResume){
    clearMissionView();
    const a=await fetch('/api/core/mission',{
     method:'POST',
     headers:{'content-type':'application/json'},
     body:JSON.stringify({action:'start',objective})
    });
    const start=await readApiJson(a);
    if(!a.ok)throw Error(start.error||'Core start failed');
    missionId=start.missionId;
    setCurrentMissionId(missionId);
   }

   if(!missionId)throw Error('Mission ID unavailable');

   const remaining=IDS.filter(id=>states[id]?.state!=='completed');
   if(!isResume)remaining.splice(0,remaining.length,...IDS);

   if(remaining.length){
    const first=remaining[0];
    setStates((p:any)=>({...p,[first]:{...p[first],state:'thinking'}}));
    let prepared=fetchPreparedStep(missionId);

    for(let i=0;i<remaining.length;i++){
     const current=await prepared;
     const expected=remaining[i];
     const id=current.id||expected;
     const decision=current.decision;

     setActive(id);
     setStates((p:any)=>({...p,[id]:{state:'decision ready',decision,telemetry:current.telemetry}}));

     let nextPrepared:Promise<any>|null=null;
     if(i<remaining.length-1){
      const nextExpected=remaining[i+1];
      setStates((p:any)=>({...p,[nextExpected]:{...p[nextExpected],state:'thinking'}}));
      nextPrepared=fetchPreparedStep(missionId);
     }

     setStates((p:any)=>({...p,[id]:{...p[id],state:'speaking'}}));
     await playPrepared(current.audio);
     setStates((p:any)=>({...p,[id]:{...p[id],state:'completed'}}));

     if(nextPrepared)prepared=nextPrepared;
    }
   }

   await finishExecutiveClose(missionId);

   const q=await fetch('/api/core/mission',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({action:'status',missionId})
   });
   if(q.ok)setProof(await readApiJson(q));
   setResumeAvailable(false);
  }catch(e:any){
   setError(e?.message||String(e));
   if(currentMissionId)setResumeAvailable(true);
  }finally{
   setActive('');
   setRunning(false);
  }
 }

 const buttonLabel=running?'MISSION RUNNING':resumeAvailable?'RESUME MISSION':proof.verified?'RUN NEW MISSION':'START CORE MISSION';

 return <section className="space-y-4 rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-5">
  <div className="flex justify-between gap-4">
   <div>
    <div className="text-[11px] font-black tracking-[.2em] text-cyan-300">PEGASUS CORE · WAR ROOM v2</div>
    <h2 className="text-xl font-black text-white">Durable Mission Execution</h2>
    <p className="text-xs text-slate-400">Real reasoning → governed skills → memory → evidence → database verification.</p>
   </div>
   <div className={"h-fit rounded-full border px-3 py-1 text-[10px] font-black "+(proof.verified?'border-emerald-500/50 text-emerald-300':'border-slate-700 text-slate-400')}>
    {hydrating?'RESTORING CORE':proof.verified?'VERIFIED COMPLETE':resumeAvailable?'RESUME READY':'CORE READY'}
   </div>
  </div>

  {!unlocked&&<div className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
   <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')login();}} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-amber-400" placeholder="Founder access password"/>
   <button onClick={login} className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-black text-slate-950">UNLOCK CORE</button>
  </div>}

  <textarea value={objective} onChange={e=>setObjective(e.target.value)} rows={3} disabled={!unlocked||resumeAvailable} className="w-full rounded-xl border border-slate-700 bg-black/40 p-3 text-sm text-white outline-none focus:border-cyan-400 disabled:opacity-50" placeholder={unlocked?'Founder objective':'Unlock Core to enter a founder objective'}/>

  <div className="flex gap-2">
   <button onClick={run} disabled={running||hydrating||!unlocked||(!resumeAvailable&&!objective.trim())} className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-40">
    <Play className="h-4 w-4"/>{buttonLabel}
   </button>
   <button onClick={reset} disabled={running} className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300">
    <RotateCcw className="h-4 w-4"/>RESET
   </button>
  </div>

  {error&&<div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-300">{error}</div>}

  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
   {IDS.map(id=>{
    const agent=AGENTS.find(a=>a.id===id)!;
    const s=states[id];
    const live=active===id;
    const voiceLabel=s.telemetry?.voiceProvider||'Voice persisted';
    return <article key={id} className={"rounded-2xl border bg-slate-900 p-3 "+(s.state==='completed'?'border-emerald-500/30':live?'border-cyan-400/60':'border-slate-800')}>
     <div className="flex h-28 items-center justify-center"><AvatarFace agent={agent} isSpeaking={live} frequencyData={new Uint8Array(32)}/></div>
     <div className="text-center font-black text-white">{agent.name}</div>
     <div className="text-center text-[9px] uppercase tracking-widest text-slate-500">{s.state}</div>
     {s.telemetry&&<div className={"mx-auto mt-1 w-fit rounded-full border px-2 py-0.5 text-[8px] font-black "+(s.telemetry.fallback?'border-amber-500/40 bg-amber-950/30 text-amber-300':'border-emerald-500/30 bg-emerald-950/20 text-emerald-300')} title={(s.telemetry.model||'unknown')+" · "+(s.telemetry.voiceName||voiceLabel)}>
      {s.telemetry.fallback?'Fallback':'Google · '+voiceLabel}
     </div>}
     {s.decision&&<div className="mt-2 rounded-xl bg-black/30 p-2 text-[10px] text-slate-300">
      <div className="flex items-center justify-between gap-2"><b className="text-cyan-300">{s.decision.skillKey}</b><span className="text-[8px] uppercase tracking-widest text-slate-600">decision</span></div>
      <p className="mt-1 max-h-16 overflow-y-auto leading-relaxed">{s.decision.rationale}</p>
     </div>}
    </article>;
   })}
  </div>

  {executiveClose?.briefing&&<div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-950/25 to-slate-950 p-5">
   <div className="flex items-center justify-between gap-3">
    <div><div className="text-[10px] font-black tracking-[.2em] text-amber-300">SIMON · EXECUTIVE CLOSE</div><h3 className="text-lg font-black text-white">Founder Briefing</h3></div>
    <div className="rounded-full border border-emerald-500/30 px-2 py-1 text-[9px] font-black text-emerald-300">Persisted · Postgres</div>
   </div>
   <div className="mt-4 grid gap-4 lg:grid-cols-2">
    <div><div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Final Decision</div><p className="mt-1 text-sm text-slate-200">{executiveClose.briefing.finalDecision}</p></div>
    <div><div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Core Priorities</div><ul className="mt-1 space-y-1 text-sm text-slate-300">{(executiveClose.briefing.corePriorities||[]).map((x:string,i:number)=><li key={i}>• {x}</li>)}</ul></div>
    <div><div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Immediate Next Steps</div><ul className="mt-1 space-y-1 text-sm text-slate-300">{(executiveClose.briefing.immediateNextSteps||[]).map((x:any,i:number)=><li key={i}><b className="text-cyan-300">{x.owner}:</b> {x.action}</li>)}</ul></div>
    <div><div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Risks / Blockers</div><ul className="mt-1 space-y-1 text-sm text-slate-300">{(executiveClose.briefing.riskBlockers||[]).map((x:string,i:number)=><li key={i}>• {x}</li>)}</ul></div>
    <div className="lg:col-span-2"><div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Action Owners</div><div className="mt-2 flex flex-wrap gap-2">{(executiveClose.briefing.actionOwners||[]).map((x:any,i:number)=><span key={i} className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300"><b className="text-white">{x.owner}</b> · {x.responsibility}</span>)}</div></div>
   </div>
  </div>}

  <div className="grid grid-cols-4 gap-2">
   {[['TASKS',proof.completedTasks],['RUNS',proof.completedRuns],['EVIDENCE',proof.evidenceCount],['MEMORIES',proof.memoryCount]].map(([k,v])=><div key={String(k)} className="rounded-xl border border-slate-800 bg-slate-900 p-3"><div className="text-[9px] tracking-widest text-slate-500">{k}</div><div className="text-xl font-black text-white">{String(v)}</div></div>)}
  </div>
  <div className="flex items-center gap-2 text-[11px] text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-400"/>Completion authority comes from persisted Core state—not model claims.</div>
 </section>;
}
