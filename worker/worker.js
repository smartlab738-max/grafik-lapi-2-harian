/**
 * Grafik Lapi 2 — backend tulis GitHub tanpa mengekspos PAT kepada browser.
 * Secret wajib via Cloudflare Workers > Settings > Variables and Secrets:
 * GITHUB_TOKEN, EDITOR_PASSWORD, SESSION_SECRET.
 * Jangan menaruh nilai secret dalam file ini atau di repository publik.
 */
const REPO='smartlab738-max/grafik-lapi-2-harian';
const DATA_PATH='rekap-data/rekap-listrik.json';
const BRANCH='main';
const ALLOWED_ORIGIN='https://smartlab738-max.github.io';
const encoder=new TextEncoder();
const decoder=new TextDecoder();
const MAX_BODY=9_000_000;
const SESSION_SECONDS=30*24*3600;

function json(obj,status=200,origin=''){
 const headers={
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff',
  'Vary':'Origin',
  'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type, Authorization',
 };
 if(origin===ALLOWED_ORIGIN)headers['Access-Control-Allow-Origin']=origin;
 return new Response(JSON.stringify(obj),{status,headers});
}
function apiError(message,status=400,origin=''){return json({error:message},status,origin);}
function base64url(bytes){
 let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function unbase64url(str){const b=str.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(b+'='.repeat((4-b.length%4)%4)),x=>x.charCodeAt(0));}
function utf8base64(value){
 const bytes=encoder.encode(value);let s='';
 for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(s);
}
async function hmacKey(secret){return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function newSession(secret){
 const expiry=Math.floor(Date.now()/1000)+SESSION_SECONDS;
 const payload=base64url(encoder.encode(JSON.stringify({v:1,aud:'lapi2-editor',exp:expiry})));
 const signature=base64url(new Uint8Array(await crypto.subtle.sign('HMAC',await hmacKey(secret),encoder.encode(payload))));
 return {token:payload+'.'+signature,expiresAt:new Date(expiry*1000).toISOString()};
}
async function validateSession(secret,header){
 if(!secret||!header?.startsWith('Bearer '))return false;
 try{
  const [payload,signature,...extra]=header.slice(7).split('.');
  if(!payload||!signature||extra.length)return false;
  const verified=await crypto.subtle.verify('HMAC',await hmacKey(secret),unbase64url(signature),encoder.encode(payload));
  if(!verified)return false;
  const data=JSON.parse(decoder.decode(unbase64url(payload)));
  return data.v===1&&data.aud==='lapi2-editor'&&Number.isInteger(data.exp)&&data.exp>Math.floor(Date.now()/1000);
 }catch{return false;}
}
async function equalPasswords(a,b){
 const [x,y]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(a)),crypto.subtle.digest('SHA-256',encoder.encode(b))]);
 const aa=new Uint8Array(x),bb=new Uint8Array(y);let mismatch=0;
 for(let i=0;i<aa.length;i++)mismatch|=aa[i]^bb[i];
 return mismatch===0;
}
function ghHeaders(token){return {
 'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,
 'X-GitHub-Api-Version':'2022-11-28','User-Agent':'grafik-lapi-2-save-worker'
};}
async function ghGet(token,path){
 const response=await fetch('https://api.github.com/repos/'+REPO+'/'+path, {headers:ghHeaders(token),cache:'no-store'});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error('GitHub HTTP '+response.status+': '+(data.message||'Periksa akses token/repository.'));
 return data;
}
async function remoteMetadata(token){
 return ghGet(token,'contents/'+DATA_PATH+'?ref='+BRANCH);
}
async function readRemote(token){
 const meta=await remoteMetadata(token);
 if(!/^[a-f0-9]{40}$/i.test(meta.sha||''))throw new Error('SHA database tidak ditemukan.');
 let encoded=meta.encoding==='base64'&&meta.content?meta.content:null;
 if(!encoded){
  // GitHub Contents API dapat menghilangkan content ketika file > 1MB.
  const blob=await ghGet(token,'git/blobs/'+encodeURIComponent(meta.sha));
  if(blob.encoding!=='base64'||!blob.content)throw new Error('Gagal membaca database GitHub melalui Blobs API.');
  encoded=blob.content;
 }
 const binary=atob(encoded.replace(/\s/g,''));
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 const parsed=JSON.parse(decoder.decode(bytes));
 if(!Array.isArray(parsed.panels)||!parsed.readings||typeof parsed.readings!=='object')throw new Error('Struktur JSON database tidak dikenali.');
 return {sha:meta.sha,db:parsed};
}
async function storeRemote(token,sha,db){
 const body={
  message:'Update rekap meter listrik dari editor aman',
  content:utf8base64(JSON.stringify(db)),
  sha,branch:BRANCH
 };
 const response=await fetch('https://api.github.com/repos/'+REPO+'/contents/'+DATA_PATH,{
  method:'PUT',headers:{...ghHeaders(token),'Content-Type':'application/json'},body:JSON.stringify(body)
 });
 const data=await response.json().catch(()=>({}));
 if(!response.ok){
  if(response.status===409||response.status===422)throw Object.assign(new Error('Konflik versi data di GitHub. Muat ulang dan gabungkan draf, jangan timpa perubahan pengguna lain.'),{status:409});
  throw Object.assign(new Error('GitHub gagal menyimpan (HTTP '+response.status+'): '+(data.message||'Periksa izin Contents read/write.')),{status:502});
 }
 if(!data.content?.sha)throw new Error('Github tidak mengembalikan SHA hasil simpan.');
 return data.content.sha;
}
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'';
  const url=new URL(request.url);
  const configured=Boolean(env.GITHUB_TOKEN&&env.EDITOR_PASSWORD&&env.SESSION_SECRET);
  if(request.method==='OPTIONS'){
   if(origin!==ALLOWED_ORIGIN)return apiError('Origin tidak diizinkan.',403);
   return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Max-Age':'3600','Vary':'Origin'}});
  }
  if(origin&&origin!==ALLOWED_ORIGIN)return apiError('Origin tidak diizinkan.',403);
  try{
   if(url.pathname==='/api/health'&&request.method==='GET'){
    return json({ok:true,repo:REPO,path:DATA_PATH,configured},200,origin);
   }
   if(!configured)return apiError('Secret belum lengkap pada Cloudflare Worker.',503,origin);
   if(url.pathname==='/api/db'&&request.method==='GET'){
    return json(await readRemote(env.GITHUB_TOKEN),200,origin);
   }
   if(url.pathname==='/api/login'&&request.method==='POST'){
    const input=await request.json().catch(()=>({}));
    const pass=input.password;
    if(typeof pass!=='string'||pass.length>256||pass.length===0)return apiError('Kata sandi tidak valid.',400,origin);
    if(!(await equalPasswords(pass,env.EDITOR_PASSWORD)))return apiError('Kata sandi editor salah.',401,origin);
    const session=await newSession(env.SESSION_SECRET);
    return json({session:session.token,expiresAt:session.expiresAt},200,origin);
   }
   if(url.pathname==='/api/save'&&request.method==='POST'){
    if(!(await validateSession(env.SESSION_SECRET,request.headers.get('Authorization'))))return apiError('Sesi editor tidak valid atau kedaluwarsa. Login ulang.',401,origin);
    if(Number(request.headers.get('Content-Length')||0)>MAX_BODY)return apiError('Ukuran data melebihi batas.',413,origin);
    const raw=await request.text();
    if(raw.length>MAX_BODY)return apiError('Ukuran data melebihi batas.',413,origin);
    const data=JSON.parse(raw);
    const expectedSha=data.expectedSha,db=data.db;
    if(!/^[a-f0-9]{40}$/i.test(expectedSha||''))return apiError('Versi SHA awal tidak valid.',400,origin);
    if(!db||!Array.isArray(db.panels)||!db.readings||typeof db.readings!=='object'||!db.snapshots||typeof db.snapshots!=='object')return apiError('Struktur database JSON tidak valid.',400,origin);
    const meta=await remoteMetadata(env.GITHUB_TOKEN);
    if(meta.sha!==expectedSha)return apiError('Data di GitHub sudah berubah sejak website dibuka. Simpan backup JSON, muat ulang, dan periksa draf sebelum menyimpan.',409,origin);
    const sha=await storeRemote(env.GITHUB_TOKEN,meta.sha,db);
    return json({ok:true,sha},200,origin);
   }
   return apiError('Endpoint tidak ditemukan.',404,origin);
  }catch(err){
   // Jangan pernah menampilkan nilai secret dalam response kesalahan.
   const status=err?.status||500;
   return apiError(err?.message||'Kesalahan internal server.',status,origin);
  }
 }
};
