import {randomBytes} from 'node:crypto';
import {existsSync,writeFileSync} from 'node:fs';
if(existsSync('.env')){console.log('Existing .env preserved.');process.exit(0);}
const secret=()=>randomBytes(24).toString('hex');const dbPassword=secret(),appPassword=secret(),demoPassword=secret();
writeFileSync('.env',`DATABASE_URL=postgres://mga_app:${appPassword}@localhost:5432/mga_lab\nMIGRATION_DATABASE_URL=postgres://postgres:${dbPassword}@localhost:5432/mga_lab\nPOSTGRES_PASSWORD=${dbPassword}\nAPP_ORIGIN=http://localhost:3000\nDEMO_PASSWORD=${demoPassword}\nCOOKIE_SECURE=false\n`,{mode:0o600});
console.log('Generated unique local credentials in ignored .env. Read DEMO_PASSWORD there to sign in. Never commit .env.');
