export function databaseUrl(key='DATABASE_URL'){const url=new URL(process.env[key]||'');if(process.env.MGA_DB_HOST)url.hostname=process.env.MGA_DB_HOST;return url.toString();}
