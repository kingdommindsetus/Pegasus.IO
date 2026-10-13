import {JobTracePanel} from './JobTracePanel';
import {JarvisStatusBadge} from './JarvisStatusBadge';
import {useEffect,useRef,useState} from 'react';
type Signal={status:string;detail:string};
type Reading={status:string;stale:boolean;lastSeen:string|null;ageSeconds:number|null;scope:string;signals:Record<string,Signal>;alerts:{signal:string;severity:string;detail:string}[];history?:{timestamp:string;status:string}[]};
export function JarvisHealthPanel(){
 const [token,setToken]=useState('');
 const [reading,setReading]=useState<Reading|null>(null);
 const [error,setError]=useState('');
 const [lastChecked,setLastChecked]=useState(0);
 const tokenRef=useRef('');
 useEffect(()=>{tokenRef.current=token;},[token]);
 useEffect(()=>{
  let stopped=false;
  async function refresh(){
   if(!tokenRef.current)return;
   try{
    const response=await fetch('/api/dev/jarvis-health?history=1',{headers:{Authorization:'Bearer '+tokenRef.current},cache:'no-store'});
    if(!response.ok)throw Error(response.status===401?'Invalid development access token':'Health bridge unavailable ('+response.status+')');
    const value=await response.json() as Reading;
    if(!stopped){setReading(value);setError('');setLastChecked(Date.now());}
   }catch(e){if(!stopped){setReading(null);setError(e instanceof Error?e.message:'Health unavailable');}}
  }
  void refresh();const interval=setInterval(()=>{void refresh();},15000);
  return()=>{stopped=true;clearInterval(interval);};
 },[token]);
 const age=Math.max(0,Math.floor((Date.now()-lastChecked)/1000));
 const isStale=!reading||reading.stale||!lastChecked||age>45;
 const status=isStale?'stale':reading.status;
 return <section aria-label="Jarvis development runtime health" className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 space-y-3">
  <div className="flex flex-wrap justify-between items-center gap-3">
   <div><h2 className="font-bold text-slate-100">JARVIS · DEVELOPMENT HEALTH</h2>
    <p className="text-xs text-slate-400">Isolated Windows runtime · read-only · never production</p></div>
   <JarvisStatusBadge status={status}/>
  </div>
  <form onSubmit={e=>{e.preventDefault();setLastChecked(0);setError('');setToken((e.currentTarget.elements.namedItem('access') as HTMLInputElement).value.trim());}} className="flex flex-wrap gap-2">
   <input name="access" type="password" autoComplete="off" aria-label="Jarvis local access token" placeholder="Local development access token" className="rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs min-w-56" />
   <button type="submit" className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold">Connect locally</button>
   <button type="button" onClick={()=>{setToken('');setReading(null);setLastChecked(0);setError('');}} className="text-xs border border-slate-700 rounded-lg px-3 py-2">Disconnect</button>
  </form>
  {error&&<p role="alert" className="text-amber-300 text-xs">{error}</p>}
  {isStale?<p role="status" className="text-amber-300 text-xs">No verified fresh health reading. Do not treat earlier green results as live.</p>
  :<><p className="text-xs text-slate-300">Last observed: {reading?.lastSeen} · snapshot age {reading?.ageSeconds}s</p>
   <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{Object.entries(reading?.signals||{}).map(([name,signal])=>
    <div key={name} className="rounded-lg border border-slate-700 p-2 text-xs"><strong className="block uppercase">{name}</strong><span>{signal.status}</span><p className="text-slate-400">{signal.detail}</p></div>)}</div>
   {Boolean(reading?.alerts?.length)&&<ul className="text-amber-300 text-xs">{reading?.alerts.map((a,i)=><li key={i}>{a.signal}: {a.detail}</li>)}</ul>}
   <p className="text-xs text-slate-400">Last {reading?.history?.length||0} recorded snapshots: {(reading?.history||[]).map(s=>s.status).join(' · ')||'none'}</p>
  </>}
  <JobTracePanel token={token}/>
 </section>;
}
