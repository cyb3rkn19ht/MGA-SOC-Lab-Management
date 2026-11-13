type Environment=Record<string,string|undefined>;
function origin(value:string|undefined){if(!value)return null;try{const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)return null;return u.origin;}catch{return null;}}
export function configuredOrigins(env:Environment=process.env){const result=new Set<string>();const configured=origin(env.APP_ORIGIN);if(configured)result.add(configured);
 const name=env.CODESPACE_NAME,domain=env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN||'app.github.dev',port=env.MGA_PUBLIC_PORT||env.PORT||'3001';
 if(name&&/^[a-z0-9-]+$/i.test(name)&&/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(domain)&&/^\d{1,5}$/.test(port)&&Number(port)>0&&Number(port)<65536)result.add(`https://${name}-${port}.${domain}`);
 if(result.size===0&&!env.APP_ORIGIN&&!name)result.add('http://localhost:3001');return [...result];}
type ForwardedAddress={host?:string|null;forwardedHost?:string|null;fetchSite?:string|null};
export function requestOriginAllowed(value:string|null,env:Environment=process.env,address:ForwardedAddress={}){
 const normalized=origin(value||undefined);if(!normalized)return false;
 if(configuredOrigins(env).includes(normalized))return true;
 // Codespaces terminates HTTPS before forwarding to the development server.
 // Require the exact forwarded Codespaces host or browser-controlled same-origin metadata.
 if(env.NODE_ENV!=='development')return false;
 const u=new URL(normalized);if(u.protocol!=='https:'||u.port||!/^[-a-z0-9]+-[0-9]{1,5}\.app\.github\.dev$/i.test(u.hostname))return false;
 const host=address.forwardedHost||address.host;
 return (typeof host==='string'&&host.toLowerCase()===u.host.toLowerCase())||address.fetchSite==='same-origin';
}
export function secureSession(value:string|null,env:Environment=process.env,address:ForwardedAddress={}){return env.COOKIE_SECURE==='true'||(requestOriginAllowed(value,env,address)&&value?.startsWith('https://')===true);}
