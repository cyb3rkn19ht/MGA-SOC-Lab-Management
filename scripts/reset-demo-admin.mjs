import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {createHash} from 'node:crypto';
import {Pool} from 'pg';
import {hash} from 'bcryptjs';

const env=parseEnv(readFileSync('.env','utf8'));
const password=env.DEMO_PASSWORD;
if(!password||password.length<16||password.startsWith('REPLACE_'))throw Error('Generate local credentials first: node scripts/configure-local.mjs');
const url=new URL(process.env.MIGRATION_DATABASE_URL||env.MIGRATION_DATABASE_URL||'');
if(process.env.MGA_DB_HOST)url.hostname=process.env.MGA_DB_HOST;
if(!['localhost','127.0.0.1','db'].includes(url.hostname))throw Error('This command resets the local fictional demo account only.');
const pool=new Pool({connectionString:url.toString(),connectionTimeoutMillis:5000});
const c=await pool.connect();
try{
 await c.query('BEGIN');
 const u=(await c.query("SELECT id,role,name FROM users WHERE email='admin@demo.invalid' FOR UPDATE")).rows[0];
 if(!u||u.role!=='System Administrator'||!u.name.startsWith('Demo '))throw Error('Fictional demo administrator not found. Run npm run db:setup first.');
 await c.query("SELECT set_config('app.user_id',$1,true)",[u.id]);
 await c.query('UPDATE users SET password=$2,active=true WHERE id=$1',[u.id,await hash(password,12)]);
 await c.query('DELETE FROM sessions WHERE user_id=$1',[u.id]);
 await c.query('DELETE FROM login_attempts WHERE key=$1',[createHash('sha256').update('admin@demo.invalid').digest('hex')]);
 await c.query("INSERT INTO audit(actor,action,record_id,detail) VALUES($1,'demo_admin_password_reset',$2,$3)",[u.id,u.id,{email:'admin@demo.invalid',sessionsRevoked:true}]);
 await c.query('COMMIT');
 console.log('\nDemo administrator password reset.\nEmail: admin@demo.invalid\nPassword: '+password+'\n\nUse this password on the demo sign-in page. Keep it out of GitHub and chat.');
}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();await pool.end();}
