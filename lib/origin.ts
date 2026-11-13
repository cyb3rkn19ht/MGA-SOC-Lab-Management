type Environment=Record<string,string|undefined>;
function origin(value:string|undefined){if(!value)return null;try{const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)return null;return u.origin;}catch{return null;}}
export function configuredOrigins(env:Environment=process.env){const result=new Set<string>();const configured=origin(env.APP_ORIGIN);if(configured)result.add(configured);
 const name=env.CODESPACE_NAME,domain=env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN||'app.github.dev',port=env.MGA_PUBLIC_PORT||'3000';
 if(name&&/^[a-z0-9-]+$/i.test(name)&&/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(domain)&&/^\d{1,5}$/.test(port)&&Number(port)>0&&Number(port)<65536)result.add(`https://${name}-${port}.${domain}`);
 if(result.size===0&&!env.APP_ORIGIN&&!name)result.add('http://localhost:3000');return [...result];}
export function requestOriginAllowed(value:string|null,env:Environment=process.env){const normalized=origin(value||undefined);return normalized!==null&&configuredOrigins(env).includes(normalized);}
export function secureSession(value:string|null,env:Environment=process.env){return env.COOKIE_SECURE==='true'||(requestOriginAllowed(value,env)&&value?.startsWith('https://')===true);}
