/**
 * Staging NVIDIA NIM route. Never reads browser-supplied keys or calls production.
 * All provider failures reject; an unavailable model cannot impersonate live reasoning.
 */
export type NvidiaRequest = {
  system:string; prompt:string; maxOutputTokens?:number; temperature?:number;
};
const redact=(value:unknown)=>String(value??'unknown')
  .replace(/nvapi-[A-Za-z0-9_-]+/g,'[redacted]')
  .replace(/AIza[A-Za-z0-9_-]+/g,'[redacted]')
  .slice(0,240);
export async function generateNvidiaStageText(req:NvidiaRequest){
  const apiKey=String(process.env.NVIDIA_API_KEY||'').trim();
  if(!apiKey)throw Error('Staging NVIDIA_API_KEY is not configured');
  const model=String(process.env.PEGASUS_NVIDIA_MODEL||'nvidia/nemotron-3-super-120b-a12b').trim();
  const endpoint='https://integrate.api.nvidia.com/v1/chat/completions';
  const timeoutMs=Math.max(1000,Math.min(30000,Number(process.env.PEGASUS_NVIDIA_TIMEOUT_MS||12000)||12000));
  const started=Date.now();
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(endpoint,{
      method:'POST',signal:controller.signal,
      headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},
      body:JSON.stringify({
        model,stream:false,temperature:req.temperature??0.1,
        max_tokens:req.maxOutputTokens??700,
        messages:[{role:'system',content:req.system},{role:'user',content:req.prompt}]
      })
    });
    if(!response.ok)throw Error('NVIDIA response HTTP '+response.status);
    const payload=await response.json() as any;
    const raw=payload?.choices?.[0]?.message?.content;
    const text=typeof raw==='string'?raw.trim():Array.isArray(raw)
      ?raw.filter((part:any)=>part?.type==='text').map((part:any)=>String(part.text||'')).join(' ').trim():'';
    if(!text)throw Error('NVIDIA returned an empty answer');
    return {text,runtime:{reasoningProvider:'NVIDIA NIM',model,fallback:false,
      reasoningMs:Date.now()-started,quotaWaitMs:0}};
  }catch(error:any){
    // No dummy rationale, substitute role-brain output, or false live telemetry.
    throw Error('NVIDIA staging reasoning failed: '+redact(error?.message||error));
  }finally{clearTimeout(timer);}
}
