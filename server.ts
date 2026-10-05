import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config({path:path.resolve(process.cwd(),'.env.local'),quiet:true});
dotenv.config({quiet:true});

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const app=express();
const PORT=Number(process.env.PORT)||3000;

app.use(express.json({limit:'10mb'}));
app.use(express.urlencoded({extended:true}));

async function startServer(){
  // Load API handlers only after local environment files have populated process.env.
  // This prevents database/provider modules from initializing before DATABASE_URL
  // and other server-side configuration are available.
  const [
    {default:chatHandler},
    {default:speakHandler},
    {default:workflowHandler},
    {default:healthHandler},
    {default:coreSessionHandler},
    {default:coreMissionHandler},
    {default:coreStepHandler},
  ]=await Promise.all([
    import('./api/chat.js'),
    import('./api/agent/speak.js'),
    import('./api/workflow/run-step.js'),
    import('./api/health.js'),
    import('./api/core/session.js'),
    import('./api/core/mission.js'),
    import('./api/core/step.js'),
  ]);

  // Local development uses the exact same canonical API handlers as production.
  // This prevents provider drift between Vercel and open-source/self-hosted runs.
  app.all('/api/health',(req,res)=>healthHandler(req,res));
  app.all('/api/chat',(req,res)=>void chatHandler(req,res));
  app.all('/api/agent/chat',(req,res)=>void chatHandler(req,res));
  app.all('/api/agent/speak',(req,res)=>void speakHandler(req,res));
  app.all('/api/workflow/run-step',(req,res)=>void workflowHandler(req,res));
  app.all('/api/core/session',(req,res)=>void coreSessionHandler(req,res));
  app.all('/api/core/mission',(req,res)=>void coreMissionHandler(req,res));
  app.all('/api/core/step',(req,res)=>void coreStepHandler(req,res));

  const isDev=process.env.NODE_ENV!=='production';

  if(isDev){
    const {createServer:createViteServer}=await import('vite');
    const vite=await createViteServer({
      server:{middlewareMode:true},
      appType:'spa',
    });
    app.use(vite.middlewares);
  }else{
    app.use(express.static(path.resolve(__dirname,'dist')));
    app.get('*',(_req,res)=>{
      res.sendFile(path.resolve(__dirname,'dist','index.html'));
    });
  }

  app.listen(PORT,'0.0.0.0',()=>{
    console.log(`[Pegasus.io] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(error=>{
  console.error('[Pegasus.io] Failed to start server:',error);
  process.exit(1);
});
