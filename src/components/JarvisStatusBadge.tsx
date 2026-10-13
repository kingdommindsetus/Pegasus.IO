export function JarvisStatusBadge({status}:{status:string}){
 const level=['healthy','stale','offline','blocked','degraded'].includes(status)?status:'stale';
 return <span data-testid="jarvis-status" aria-label={'Jarvis status: '+level} className={level==='healthy'?'text-emerald-300 font-bold':level==='stale'?'text-amber-300 font-bold':'text-red-300 font-bold'}>{level.toUpperCase()}</span>;
}
