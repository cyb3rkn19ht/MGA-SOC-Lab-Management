import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import {PDFDocument} from 'pdf-lib';
process.loadEnvFile('.env');
const base=process.env.MGA_PREVIEW_URL||'http://localhost:3000';
const origin=process.env.CODESPACE_NAME&&process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN?`https://${process.env.CODESPACE_NAME}-${new URL(base).port||3000}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`:process.env.APP_ORIGIN||base;
for(let n=0;n<180;n++){let ready=false;try{const r=await fetch(base+'/__preview/status');ready=(await r.json()).ready;}catch{}if(ready)break;if(n===179)throw Error('Preview did not become ready');await new Promise(r=>setTimeout(r,1000));}
const login=await fetch(base+'/api/login',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({email:'admin@demo.invalid',password:process.env.DEMO_PASSWORD})});assert.equal(login.status,200,'Login through the preview must succeed');if(process.env.CODESPACE_NAME)assert.match(login.headers.get('set-cookie')||'',/;\s*Secure/i,'Forwarded HTTPS sessions require secure cookies');const cookie=login.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie,'A session cookie is required');
const document=await(await fetch(base)).text();const asset=document.match(/src="(\/_next\/[^"]+)"/);assert.ok(asset,'The sign-in page must include Next.js scripts');const assetResponse=await fetch(base+asset[1].replaceAll('&amp;','&'),{headers:{origin,referer:origin+'/', 'sec-fetch-mode':'no-cors','sec-fetch-site':'cross-site'}});assert.equal(assetResponse.status,200,'Development assets must load from the forwarded origin');
const headers={cookie};const state=await fetch(base+'/api/state',{headers});assert.equal(state.status,200);const data=await state.json();assert.equal(data.user.role,'System Administrator');assert.ok(data.labs.length>=4);
const health=await fetch(base+'/api/health');assert.equal(health.status,200);
const invalid=await fetch(base+'/api/login',{method:'POST',headers:{origin:'https://untrusted.invalid','Content-Type':'application/json'},body:'{}'});assert.equal(invalid.status,403,'Untrusted origins must still be rejected');
const pdf=await fetch(base+'/api/report?format=pdf&start=2026-01-01&end=2026-12-31',{headers});assert.equal(pdf.status,200);assert.ok((await PDFDocument.load(await pdf.arrayBuffer())).getPageCount()>0);
const excel=await fetch(base+'/api/report?format=xlsx&start=2026-01-01&end=2026-12-31',{headers});assert.equal(excel.status,200);const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(await excel.arrayBuffer());assert.equal(workbook.worksheets.length,7);
console.log('Preview smoke check passed: readiness, forwarded-origin JavaScript assets, authentication, session, database health, origin checks and PDF/Excel exports.');
