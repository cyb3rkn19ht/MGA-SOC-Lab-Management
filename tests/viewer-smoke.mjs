import assert from 'node:assert/strict';
const base=process.env.MGA_PREVIEW_URL||'http://localhost:3001';
const response=await fetch(base+'/api/state');assert.equal(response.status,200,'Demo dashboard must load without signing in');
const s=await response.json();assert.equal(s.user.demoViewer,true);assert.equal(s.user.role,'Faculty/Staff');assert.equal(s.user.name,'Demo viewer');assert.ok(s.labs.length>=4);assert.ok(s.items.length>=4);assert.equal(s.audit.length,0);
for(const path of ['login','command','createUser','logout']){const r=await fetch(base+'/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'lab',data:{name:'Unauthorized anonymous change',profile:{}}})});assert.equal(r.status,403,'Viewer cannot sign in, log out, provision users or mutate data');}
for(const format of ['pdf','xlsx']){const r=await fetch(base+`/api/report?format=${format}&start=2026-01-01&end=2026-12-31`);assert.equal(r.status,200);}
console.log('No-login demo passed: dashboard, lab/inventory data and reports available; all mutation and authentication endpoints blocked; no audit/admin data exposed.');
