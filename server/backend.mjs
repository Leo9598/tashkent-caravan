// Server-only Supabase access. Never expose the service key to browser code.
export class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
export function configured() { return Boolean(process.env.ORDER_DASHBOARD_ENABLED === 'true' && process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY); }
export async function request(path, {method='GET', body, token, auth=false, headers={}}={}) {
  if (!configured()) throw new HttpError(503, 'SETUP_REQUIRED');
  const key = auth ? process.env.SUPABASE_ANON_KEY : process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/,'')}/${auth?'auth/v1':'rest/v1'}/${path}`, {
    method, signal: AbortSignal.timeout(12000), headers: {apikey:key, Authorization:`Bearer ${token || key}`, 'Content-Type':'application/json', ...headers},
    ...(body === undefined ? {} : {body:JSON.stringify(body)})
  });
  const data = await response.json().catch(()=>null);
  if (!response.ok) {
    const known = ['request_conflict','version_conflict','invalid_transition','not_found','cancellation_note_required'];
    const reason = known.find(code=>data?.message?.includes(code));
    throw new HttpError(reason === 'not_found' ? 404 : reason ? 409 : auth ? 401 : 503, reason?.toUpperCase() || (auth?'SIGN_IN_FAILED':'SERVICE_UNAVAILABLE'));
  }
  return data;
}
export function secureResponse(res) { res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('X-Robots-Tag','noindex, nofollow'); }
export function sameOrigin(req) {
  const allowed = process.env.STAFF_APP_ORIGIN || 'https://tashkent-caravan.vercel.app';
  if (req.headers.origin !== allowed || !String(req.headers['content-type']||'').startsWith('application/json')) throw new HttpError(403,'FORBIDDEN');
}
export function fail(res,error) { return res.status(error instanceof HttpError ? error.status : 503).json({status:'error',code:error instanceof HttpError ? error.code : 'SERVICE_UNAVAILABLE'}); }
const cookieOptions='Path=/api/staff; HttpOnly; Secure; SameSite=Strict';
export function clearSession(res) { res.setHeader('Set-Cookie',[`tk_access=; ${cookieOptions}; Max-Age=0`,`tk_refresh=; ${cookieOptions}; Max-Age=0`]); }
export function setSession(res,session) {
  if (!session?.access_token || !session?.refresh_token) throw new HttpError(401,'SIGN_IN_FAILED');
  res.setHeader('Set-Cookie',[
    `tk_access=${encodeURIComponent(session.access_token)}; ${cookieOptions}; Max-Age=${Math.min(Number(session.expires_in)||3600,3600)}`,
    `tk_refresh=${encodeURIComponent(session.refresh_token)}; ${cookieOptions}; Max-Age=28800`
  ]);
}
export async function approvedUser(token) {
  const user = await request('user',{auth:true,token});
  if (!user?.id || !user.email_confirmed_at || !user.email) throw new HttpError(403,'STAFF_ONLY');
  const rows=await request(`staff_members?user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&select=user_id,email,display_name,role`);
  const staff=rows?.[0];
  if (!staff || staff.email !== user.email.toLowerCase()) throw new HttpError(403,'STAFF_ONLY');
  return staff;
}
export async function requireStaff(req,res) {
  const cookies=Object.fromEntries(String(req.headers.cookie||'').split(';').filter(x=>x.includes('=')).map(x=>{const at=x.indexOf('=');return [x.slice(0,at).trim(),x.slice(at+1)];}));
  let access; try {access=decodeURIComponent(cookies.tk_access||'');}catch{throw new HttpError(401,'SIGN_IN_REQUIRED');}
  if (access) {
    try {return await approvedUser(access);} catch(e) { if (e.status !== 401) throw e; }
  }
  if (!cookies.tk_refresh) throw new HttpError(401,'SIGN_IN_REQUIRED');
  let refresh; try {refresh=decodeURIComponent(cookies.tk_refresh);}catch{throw new HttpError(401,'SIGN_IN_REQUIRED');}
  const session=await request('token?grant_type=refresh_token',{auth:true,method:'POST',body:{refresh_token:refresh}});
  const staff=await approvedUser(session.access_token); setSession(res,session); return staff;
}
