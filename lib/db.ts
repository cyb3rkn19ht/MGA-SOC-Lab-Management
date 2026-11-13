import {Pool, PoolClient} from 'pg';import {databaseUrl} from './config';
export const pool = new Pool({connectionString:databaseUrl()});
export async function transaction<T>(actor:string,fn:(c:PoolClient)=>Promise<T>){const c=await pool.connect();try{await c.query('BEGIN');await c.query("SELECT set_config('app.user_id',$1,true)",[actor]);const out=await fn(c);await c.query('COMMIT');return out;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
