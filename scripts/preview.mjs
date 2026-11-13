import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const port=Number(process.env.PORT||3000),internalPort=Number(process.env.MGA_INTERNAL_PORT||3001);
if(port===internalPort)throw Error('The preview and internal application ports must differ.');
let stage='Starting laboratory workspace',detail='Preparing the development environment.',ready=false,stopping=false,child;
const children=new Set();
function status(next,note){stage=next;detail=note;console.log(`[MGA preview] ${stage}: ${detail}`);}
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function starting(res){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','Refresh':'5','X-Content-Type-Options':'nosniff'});res.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MGA Laboratory Workspace — Starting</title><style>body{margin:0;font:16px Segoe UI,Arial,sans-serif;color:#1d1830;background:#f5f4f9}header{background:#381466;color:white;padding:24px}small{color:#d9c8ed}h1{font-size:21px}main{max-width:680px;margin:48px auto;padding:24px}section{background:white;border:1px solid #e5e0ed;border-radius:12px;padding:28px}h2{font-size:22px;color:#482078}p{line-height:1.6}a{color:#5a238d}</style><header><small>MIDDLE GEORGIA STATE UNIVERSITY · SCHOOL OF COMPUTING</small><h1>Laboratory Inventory &amp; Resource Management</h1></header><main><section><h2>${escape(stage)}</h2><p role="status">${escape(detail)}</p><p>This page checks again automatically. Initial setup can take several minutes.</p><p>Local development · fictional demonstration data · keep the forwarded port private.</p></section></main></html>`);}
const server=http.createServer((req,res)=>{
 if(req.url==='/__preview/status'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({application:'mga-lab',ready,stage,detail}));return;}
 if(!ready){starting(res);return;}
 const upstream=http.request({hostname:'127.0.0.1',port:internalPort,path:req.url,method:req.method,headers:req.headers},r=>{res.writeHead(r.statusCode||502,r.headers);r.pipe(res)});
 upstream.on('error',()=>{ready=false;status('Reconnecting to the application','The application is restarting.');if(!res.headersSent)starting(res);else res.end();});req.pipe(upstream);
});
server.on('upgrade',(req,socket,head)=>{
 if(!ready){socket.destroy();return;}
 const upstream=net.connect(internalPort,'127.0.0.1',()=>{upstream.write(`${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${Object.entries(req.headers).map(([k,v])=>`${k}: ${Array.isArray(v)?v.join(', '):v}`).join('\r\n')}\r\n\r\n`);if(head.length)upstream.write(head);socket.pipe(upstream).pipe(socket);});upstream.on('error',()=>socket.destroy());socket.on('error',()=>upstream.destroy());socket.on('close',()=>upstream.destroy());
});
server.on('error',async e=>{if(e.code==='EADDRINUSE'){try{const r=await fetch(`http://127.0.0.1:${port}/__preview/status`,{signal:AbortSignal.timeout(2000)});const s=await r.json();if(s.application==='mga-lab'){console.log(`MGA preview is already running on port ${port}. ${s.stage}.`);process.exit(0);}}catch{}console.error(`Port ${port} is in use by another process. Stop that process or set PORT to a free port.`);}else console.error('Unable to start preview:',e.code);process.exit(1);});
function run(command,args){return new Promise((resolve,reject)=>{const p=spawn(command,args,{stdio:'inherit',env:process.env});children.add(p);p.on('error',reject);p.on('exit',code=>{children.delete(p);code===0?resolve():reject(Error(`${command} failed with exit code ${code}`))});});}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function database(){const {Pool}=await import('pg');const url=new URL(process.env.MIGRATION_DATABASE_URL||'');if(process.env.MGA_DB_HOST)url.hostname=process.env.MGA_DB_HOST;
 if(!['localhost','127.0.0.1','db'].includes(url.hostname))throw Error('Preview setup only initializes a local development database.');
 for(let attempt=0;attempt<30;attempt++){const p=new Pool({connectionString:url.toString(),connectionTimeoutMillis:2000});try{await p.query('SELECT 1');return;}catch(e){if(['28P01','28000'].includes(e.code))throw Error('Database credentials do not match the existing development database. Existing data was preserved.');}finally{await p.end();}await delay(2000);}throw Error('PostgreSQL is unavailable. Rebuild the dev container to start its database service.');}
async function start(){await run('node',['scripts/configure-local.mjs']);process.loadEnvFile('.env');
 if(process.env.CODESPACE_NAME&&process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN){process.env.APP_ORIGIN=`https://${process.env.CODESPACE_NAME}-${port}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`;process.env.COOKIE_SECURE='true';}
 const signature=createHash('sha256').update(fs.readFileSync('package-lock.json')).digest('hex');const marker='node_modules/.mga-lock-signature';
 if(!fs.existsSync('node_modules/next/package.json')||!fs.existsSync(marker)||fs.readFileSync(marker,'utf8')!==signature){status('Installing application dependencies','Downloading the required packages. This may take a few minutes.');await run('npm',['ci','--no-audit','--no-fund']);fs.writeFileSync(marker,signature);}
 status('Connecting to PostgreSQL','Waiting for the development database.');await database();
 status('Preparing laboratory records','Applying migrations and creating fictional data only if the database is empty.');await run('npm',['run','db:setup']);
 status('Starting the application','Preparing the sign-in page.');
 await new Promise((resolve,reject)=>{child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port',String(internalPort)],{stdio:'inherit',env:process.env});children.add(child);child.once('error',reject);child.once('exit',()=>{children.delete(child);if(!stopping){ready=false;status('Application stopped','Restart the workspace container to restart the application.');}reject(Error('Next.js exited before startup completed.'));});(async()=>{for(let n=0;n<180;n++){if(child.exitCode!==null)return;try{const r=await fetch(`http://127.0.0.1:${internalPort}/api/health`,{signal:AbortSignal.timeout(5000)});if(r.ok){ready=true;status('Ready',`Open the private forwarded address for port ${port}.`);resolve();return;}}catch{}await delay(1000);}reject(Error('Application startup timed out. Check the terminal log.'));})();});
}
server.listen(port,'0.0.0.0',()=>{console.log(`MGA preview: http://localhost:${port}`);start().catch(e=>{console.error('[MGA preview]',e.message);status('Startup needs attention',e.message.includes('credentials')?e.message:e.message.includes('PostgreSQL')?e.message:'Setup could not complete. See the container or terminal startup log, then restart the workspace.');});});
function stop(){if(stopping)return;stopping=true;for(const p of children)p.kill('SIGTERM');server.close();setTimeout(()=>process.exit(0),1000).unref();}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
