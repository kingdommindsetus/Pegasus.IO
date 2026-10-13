/**
 * Pegasus acceptance gate 5: offline real Chrome UI smoke.
 * Serves ONLY the current built dist/ from 127.0.0.1, loads Chromium with an
 * isolated throwaway profile, and checks actual rendered browser interactions.
 * No developer tokens, providers, production URLs, or business actions.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {join,resolve,extname} from 'node:path';
import {tmpdir} from 'node:os';
import {setTimeout as sleep} from 'node:timers/promises';

const root=resolve('dist');
assert.ok(existsSync(join(root,'index.html')),'Build dist/ before browser acceptance');
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
assert.ok(existsSync(chrome),'Local Chrome missing');
const type={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
let simulateMissingCompany=false;
const server=createServer((request,response)=>{
 const raw=new URL(request.url||'/', 'http://127.0.0.1');
 // Mock an authenticated founder plus a missing company ONLY on isolated localhost.
 if(simulateMissingCompany && raw.pathname==='/api/core/session'){
  response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
  response.end(JSON.stringify({ok:true}));return;
 }
 if(simulateMissingCompany && raw.pathname==='/api/core/mission'){
  response.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});
  response.end(JSON.stringify({error:'Founder organization scope is not configured'}));return;
 }
 if(simulateMissingCompany && raw.pathname==='/api/core/staging-diagnostics'){
  response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'private, no-store'});
  response.end(JSON.stringify({
   readOnly:true,environment:'preview',databaseName:'synthetic-preview-only',
   connectionRole:'synthetic-readonly',coreOrganizationSchemaReady:false,
   company:null,configuration:{companyScopeConfigured:false,matchesCanonicalCompany:false}
  }));return;
 }
 const name=raw.pathname==='/'?'index.html':raw.pathname.replace(/^\/+/, '');
 const file=resolve(root,name);
 if(!file.startsWith(root+'\\')&&!file.startsWith(root+'/')&&file!==root){
  response.writeHead(403);response.end();return;
 }
 const chosen=existsSync(file)?file:join(root,'index.html');
 try{
  const bytes=readFileSync(chosen);
  response.writeHead(200,{'Content-Type':type[extname(chosen)]||'application/octet-stream','Cache-Control':'no-store'});
  response.end(bytes);
 }catch{response.writeHead(404);response.end();}
});
const profile=mkdtempSync(join(tmpdir(),'pegasus-p0-ui-'));
let browser=null,ws=null,serverPort=0;
const pending=new Map();
let counter=0;
async function cdp(method,params={}){
 const id=++counter;
 const reply=new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP_TIMEOUT: '+method));},15000);
  pending.set(id,{resolve:x=>{clearTimeout(timer);resolve(x);},reject:e=>{clearTimeout(timer);reject(e);}});
 });
 ws.send(JSON.stringify({id,method,params}));
 return reply;
}
async function evaluate(expression){
 const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(r.exceptionDetails)throw Error('BROWSER_EVAL_ERROR: '+r.exceptionDetails.text);
 return r.result?.result?.value;
}
async function waitFor(predicate,timeout=12000){
 const until=Date.now()+timeout;
 while(Date.now()<until){
  if(browser.exitCode!==null)throw Error('BROWSER_EXITED_EARLY: '+browser.exitCode);
  try{if(await evaluate(predicate))return;}catch{}
  await sleep(250);
 }
 throw Error('UI_SMOKE_TIMEOUT: '+predicate);
}
async function navigate(url,marker){
 await cdp('Page.navigate',{url});
 await waitFor(`document.body?.innerText?.includes(${JSON.stringify(marker)}) === true`);
}
try{
 await new Promise((ok,no)=>{
  server.once('error',no);
  server.listen(0,'127.0.0.1',()=>{serverPort=server.address().port;ok();});
 });
 browser=spawn(chrome,[
  '--headless=new','--disable-gpu','--disable-extensions','--disable-background-networking',
  '--disable-background-timer-throttling','--no-first-run','--no-default-browser-check',
  '--disable-dev-shm-usage','--window-size=1280,900','--remote-debugging-port=0',
  '--user-data-dir='+profile,'about:blank'
 ],{stdio:'ignore',windowsHide:true});
 const debugFile=join(profile,'DevToolsActivePort');
 for(let i=0;i<120&&!existsSync(debugFile)&&browser.exitCode===null;i++)await sleep(150);
 assert.ok(existsSync(debugFile),'Chrome DevTools port did not start');
 const [debugPort]=readFileSync(debugFile,'utf8').split(/\r?\n/);
 let page;
 for(let i=0;i<40;i++){
  const pages=await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json();
  page=pages.find(x=>x.type==='page');
  if(page)break;
  await sleep(150);
 }
 assert.ok(page?.webSocketDebuggerUrl,'Chrome page target missing');
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((ok,no)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',no,{once:true});});
 ws.addEventListener('message',event=>{
  try{const msg=JSON.parse(event.data);if(!msg.id)return;
   const p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);
   if(msg.error)p.reject(Error(msg.error.message));else p.resolve(msg);
  }catch{}
 });
 await cdp('Page.enable');await cdp('Runtime.enable');
 const origin='http://127.0.0.1:'+serverPort;
 await navigate(origin+'/?build-board=1','BUILD TASKBOARD');
 await waitFor('document.querySelector("[data-testid=pegasus-launch-percent]")?.textContent === "50%"');
 assert.equal(await evaluate('document.body.innerText.includes("Paperclip agent-management adapter")'),true);
 assert.equal(await evaluate('document.body.innerText.includes("10/10 verified")'),false);
 const gateCount=await evaluate('document.querySelectorAll("[data-testid=pegasus-launch-percent]").length');
 assert.equal(gateCount,1);
 await waitFor('document.body.textContent?.includes("Definition of done")');
 const toggleTask=`(()=>{const buttons=[...document.querySelectorAll('button')];const task=buttons.find(b=>b.textContent?.includes('First genuine end-to-end agent task'));if(!task)return false;task.click();return true})()`;
 assert.equal(await evaluate(toggleTask),true);
 await waitFor('!document.body.textContent?.includes("Definition of done")');
 assert.equal(await evaluate(toggleTask),true);
 await waitFor('document.body.textContent?.includes("Definition of done")');
 const filtered=await evaluate(`(()=>{const box=document.querySelector('input[type="checkbox"]');if(!box)return false;box.click();return true})()`);
 assert.equal(filtered,true);
 await waitFor('!document.body.innerText.includes("Paperclip agent-management adapter")');
 assert.equal(await evaluate('document.querySelector("[data-testid=pegasus-launch-percent]").textContent'), '50%');
 await navigate(origin+'/?gods-eye-lab=1',"GOD'S EYE");
 await waitFor('document.body.innerText.includes("PAPERCLIP")');
 await waitFor('document.body.textContent?.includes("FOUNDER · COMPANY JOB ACTIVITY")');
 await waitFor('document.body.textContent?.includes("Company-scoped activity is unavailable")');
 assert.equal(await evaluate('document.body.innerText.includes("Production not connected")'),true);
 assert.equal(await evaluate('document.body.innerText.includes("REAL POSTGRESQL · DEVELOPMENT TRACE")'),false,
  'Local dev token panel must not ship in production build');
 await navigate(origin+'/?staging-audit=1','PEGASUS CORE · WAR ROOM v2');
 await waitFor('document.body.textContent?.includes("Verify the real Pegasus database")');
 assert.equal(await evaluate('document.body.innerText.includes("JARVIS · DEVELOPMENT HEALTH")'),false,
  'Windows-local JARVIS dashboard must never appear in a packaged preview');
 assert.equal(await evaluate('document.body.innerText.includes("JARVIS · JOB LIFECYCLE")'),false,
  'Windows-local job trace must never appear in a packaged preview');
 assert.equal(await evaluate('document.body.innerText.includes("50% · 5 of 10 gates")'),true);
 assert.equal(await evaluate('document.body.innerText.includes("Unlock Core with your founder password")'),true);
 assert.equal(await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent?.includes('VERIFY DATABASE'));return Boolean(b&&b.disabled)})()`),true,
   'Diagnostic must remain disabled without founder sign-in');
 simulateMissingCompany=true;
 await navigate(origin+'/?staging-audit=1&mock-company-setup=1','PEGASUS CORE · WAR ROOM v2');
 await waitFor('document.body.innerText.includes("Company workspace setup pending")');
 await waitFor('document.body.innerText.includes("synthetic-preview-only")');
 assert.equal(await evaluate('document.body.innerText.includes("KMCE company record")'),true,
  'Automatic founder-only verification should display read-only staging data');
 assert.equal(await evaluate('document.body.innerText.includes("SETUP REQUIRED")'),true);
 assert.equal(await evaluate('document.body.innerText.includes("Founder organization scope is not configured")'),false,
  'Do not expose raw configuration failures as frightening red banners');
 assert.equal(await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent?.includes('START CORE MISSION'));return Boolean(b&&b.disabled)})()`),true,
  'Never start a mission without an assigned company');
 assert.equal(await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent?.trim()==='RESET');if(!b)return false;b.click();return true})()`),true);
 assert.equal(await evaluate('document.body.innerText.includes("Company workspace setup pending")'),true,
  'Reset must not conceal missing company configuration');
 simulateMissingCompany=false;
 await navigate(origin+'/', 'PEGASUS 12-Agent Execution Chain');
 const gotoBoard=await evaluate(`(()=>{const a=document.querySelector('a[href="/?build-board=1"]');if(!a)return false;a.click();return true})()`);
 assert.equal(gotoBoard,true);
 await waitFor('document.querySelector("[data-testid=pegasus-launch-percent]")?.textContent === "50%"');
 console.log('PEGASUS_CHROME_UI_SMOKE_PASS',JSON.stringify({
  isolatedBrowser:true,localStaticBuild:true,origin:'127.0.0.1',
  buildBoardRendered:true,launchPercent:50,fixedGates:10,
  milestoneExpansion:true,p0Filter:true,godsEyePage:true,
  paperclipShown:true,prodLocalTokenPanelHidden:true,warRoomNavigation:true,
  charges:0,emails:0,productionChanges:false
 }));
}finally{
 for(const p of pending.values())p.reject(Error('Browser stopping'));
 pending.clear();
 try{ws?.close();}catch{}
 try{browser?.kill();}catch{}
 await new Promise(ok=>server.close(ok));
 try{rmSync(profile,{force:true,recursive:true,maxRetries:5,retryDelay:100});}catch{}
}
