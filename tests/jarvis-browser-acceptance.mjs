import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const dir=mkdtempSync(path.join(tmpdir(),'jarvis-browser-'));
const token=readFileSync('C:/Users/info/PegasusVoiceEngine/acceptance-isolated/.jarvis-local-ui-token','utf8').trim();
const proc=spawn(chrome,['--headless=new','--no-first-run','--no-default-browser-check','--disable-extensions','--disable-gpu','--remote-debugging-port=0','--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let ws;
try{
 let port;
 for(let i=0;i<50;i++){const p=path.join(dir,'DevToolsActivePort');if(existsSync(p)){port=Number(readFileSync(p,'utf8').split(/\r?\n/)[0]);break;}await sleep(200);}
 if(!port)throw Error('Chrome debugger did not launch');
 const target=(await (await fetch('http://127.0.0.1:'+port+'/json')).json()).find(x=>x.type==='page');
 if(!target)throw Error('No Chrome page target');
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 let nextId=0;const pending=new Map();
 ws.addEventListener('message',ev=>{const v=JSON.parse(ev.data);if(v.id&&pending.has(v.id)){const p=pending.get(v.id);pending.delete(v.id);v.error?p.reject(Error(v.error.message)):p.resolve(v.result);}});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++nextId;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evalJs=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error('Browser JS failed');return r.result?.value;};
 const waitStatus=async label=>{
  for(let i=0;i<45;i++){await sleep(200);const status=await evalJs("document.querySelector('[data-testid=\\\"jarvis-status\\\"]')?.textContent");if(status===label)return true;}
  return false;
 };
 const submit=async()=>evalJs(`(()=>{const f=document.querySelector('[aria-label="Jarvis development runtime health"] form');const input=f.elements.namedItem('access');input.value=${JSON.stringify(token)};f.requestSubmit();return true})()`);
 await call('Page.enable');await call('Runtime.enable');await call('Page.navigate',{url:'http://127.0.0.1:4318/'});
 let visible=false;for(let i=0;i<35;i++){await sleep(300);visible=await evalJs("Boolean(document.querySelector('[aria-label=\\\"Jarvis development runtime health\\\"]'))");if(visible)break;}
 if(!visible)throw Error('Jarvis panel absent from rendered War Room');
 if(!await waitStatus('STALE'))throw Error('Unauthenticated panel must be stale');
 await submit();
 let connected=false;for(let i=0;i<35;i++){await sleep(300);connected=await evalJs("Boolean(document.body.textContent.includes('Last observed:'))");if(connected)break;}
 if(!connected)throw Error('Authenticated local browser panel never loaded reading');
 const actual=await evalJs("document.querySelector('[data-testid=\\\"jarvis-status\\\"]')?.textContent");
 if(!['HEALTHY','STALE','OFFLINE','BLOCKED','DEGRADED'].includes(actual))throw Error('Invalid browser status '+actual);
 let fake=null;
 ws.addEventListener('message',ev=>{
  const v=JSON.parse(ev.data);
  if(v.method==='Fetch.requestPaused'&&fake){
   const body=Buffer.from(JSON.stringify(fake)).toString('base64');
   void call('Fetch.fulfillRequest',{requestId:v.params.requestId,responseCode:200,responseHeaders:[{name:'content-type',value:'application/json'}],body});
  }else if(v.method==='Fetch.requestPaused')void call('Fetch.continueRequest',{requestId:v.params.requestId});
 });
 await call('Fetch.enable',{patterns:[{urlPattern:'*api/dev/jarvis-health*',requestStage:'Request'}]});
 for(const status of ['offline','blocked','stale']){
  fake={schemaVersion:1,source:'jarvis-isolated',scope:'windows-isolated-development',status,stale:status==='stale',lastSeen:new Date().toISOString(),ageSeconds:0,signals:{database:{status:status==='offline'?'offline':'healthy',detail:'test fixture'}},alerts:status==='healthy'?[]:[{signal:'test',severity:status,detail:'UI acceptance only'}],history:[]};
  await evalJs("document.querySelector('[aria-label=\\\"Jarvis development runtime health\\\"] button[type=\\\"button\\\"]').click()");
  await sleep(200);await submit();
  if(!await waitStatus(status.toUpperCase()))throw Error('Browser failed UI state '+status);
 }
 await call('Fetch.disable');
 console.log('R06_BROWSER_UI_PASSED',JSON.stringify({panelVisible:true,unauthenticated:'STALE',authenticatedLiveStatus:actual,fixtureStates:['OFFLINE','BLOCKED','STALE'],localConnection:true}));
}finally{try{ws?.close();}catch{};try{proc.kill();}catch{};await sleep(600);try{rmSync(dir,{recursive:true,force:true,maxRetries:2});}catch{}}
