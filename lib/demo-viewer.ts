import type {User} from './service';
export function demoViewerEnabled(env:Record<string,string|undefined>=process.env){
 if(env.NODE_ENV!=='development'||env.DEMO_VIEWER==='false')return false;
 try{const u=new URL(env.DATABASE_URL||'');const host=env.MGA_DB_HOST||u.hostname;return ['localhost','127.0.0.1','db'].includes(host);}catch{return false;}
}
export async function demoViewer():Promise<(User&{demoViewer:true})|null>{
 const {pool}=await import('./db');
 const u=(await pool.query("SELECT id,email,name,role,labs FROM users WHERE email='faculty@demo.invalid' AND role='Faculty/Staff' AND name LIKE 'Demo %' AND active")).rows[0];
 return u?{...u,name:'Demo viewer',demoViewer:true}:null;
}
