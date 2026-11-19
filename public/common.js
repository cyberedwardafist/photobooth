const $=s=>document.querySelector(s);
const LAY={'1x2':[1,2],'1x3':[1,3],'1x4':[1,4],'2x2':[2,2],'2x3':[2,3],'3x3':[3,3],'1x1':[1,1]};
const FIL={none:['Tanpa','none'],sepia:['Sepia','sepia(.8)'],mono:['Hitam putih','grayscale(1)'],warm:['Hangat','saturate(1.2) sepia(.25) hue-rotate(-10deg)'],cool:['Sejuk','saturate(1.1) hue-rotate(15deg) brightness(1.05)']};
const ADJ0={f:'none',b:100,c:100,s:100};
const adjOf=a=>({...ADJ0,...(a||{})});
const adjCss=a=>{a=adjOf(a);return `brightness(${a.b}%) contrast(${a.c}%) saturate(${a.s}%)`+(a.f!=='none'&&FIL[a.f]?' '+FIL[a.f][1]:'')};
const drawPhoto=(x,p,a,px,py,w,h)=>{x.filter=canFilter?adjCss(a):'none';x.drawImage(p,px,py,w,h);x.filter='none'};
const SW=['#FFFFFF','#F5E6D5','#DBE2F8','#83C2F8','#E6A5C3','#57A9B4','#1E2D5A'];
const canFilter='filter' in CanvasRenderingContext2D.prototype;
const lum=h=>{const c=[1,3,5].map(i=>{const v=parseInt(h.slice(i,i+2),16)/255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const inkFor=h=>lum(h)>.25?'#1E2D5A':'#FFFFFF';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='pb_state';
const getState=()=>{try{return JSON.parse(sessionStorage.getItem(KEY))||{}}catch{return{}}};
const setState=p=>{try{sessionStorage.setItem(KEY,JSON.stringify({...getState(),...p}))}catch{alert('Penyimpanan peramban penuh atau dimatikan, jadi foto tidak akan terbawa ke halaman berikutnya.')}};
const dataToCanvas=u=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=640;c.height=480;c.getContext('2d').drawImage(i,0,0,640,480);ok(c)};i.onerror=no;i.src=u});
const fetchTpls=async()=>{const r=await fetch('/api/templates');if(!r.ok)throw new Error('gagal');return r.json()};

async function loadStrip(){const st=getState(),lay=LAY[st.lay]?st.lay:'1x4',n=LAY[lay][0]*LAY[lay][1],raw=(st.photos||[]).slice(0,n);
  if(raw.length<n||raw.some(x=>!x))throw new Error('incomplete');
  const imgs=await Promise.all(raw.map(dataToCanvas));await document.fonts.ready;
  return{st,lay,imgs,adj:Array.from({length:n},(_,i)=>adjOf((st.adj||[])[i]))}}
function stripError(e){$('#msgT').textContent=e&&e.message==='incomplete'?'Strip belum lengkap. Isi semua slot foto dulu, lalu kembali ke sini.':'Foto gagal dibaca dari penyimpanan peramban. Ambil fotonya lagi.';$('#msgA').hidden=false}

const LIVE={W:320,H:240,FPS:12,PRE:15,POST:9};
const idbOpen=()=>new Promise((ok,no)=>{const r=indexedDB.open('pb',1);r.onupgradeneeded=()=>r.result.createObjectStore('clips');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const idbDo=(mode,fn)=>idbOpen().then(db=>new Promise((ok,no)=>{const t=db.transaction('clips',mode),q=fn(t.objectStore('clips'));t.oncomplete=()=>{db.close();ok(q&&q.result)};t.onerror=()=>{db.close();no(t.error)}}));
const clipPut=(i,v)=>idbDo('readwrite',s=>s.put(v,i));
const clipGet=i=>idbDo('readonly',s=>s.get(i));
const clipDel=i=>idbDo('readwrite',s=>s.delete(i));
const clipClear=()=>idbDo('readwrite',s=>s.clear());

/* Penjaga keluar: kalau sudah ada foto, keluar dari alur harus dikonfirmasi karena semuanya mulai dari awal */
const FLOWP=['foto','adjust','edit','unduh'];
const hasPhotos=()=>(getState().photos||[]).some(Boolean);
let leaveSkip=false;const pbSkip=()=>{leaveSkip=true};
const pageOf=u=>u.pathname.split('/').pop().replace(/\.html$/,'')||'index';
function askLeave(dest){let d=document.getElementById('leave');
  if(!d){d=document.createElement('dialog');d.id='leave';d.className='leave';d.setAttribute('aria-labelledby','leaveT');
    d.innerHTML='<h3 id="leaveT">Yakin mau keluar?</h3><p>Foto yang sudah kamu ambil akan hilang. Kalau keluar, kamu harus mengulang dari awal.</p><div class="row"><button class="btn" id="leaveStay" autofocus>Tetap di sini</button><button class="btn alt" id="leaveGo">Ya, keluar</button></div>';
    document.body.append(d);d.querySelector('#leaveStay').onclick=()=>d.close()}
  d.querySelector('#leaveGo').onclick=async()=>{try{sessionStorage.removeItem(KEY)}catch{}leaveSkip=true;try{await clipClear()}catch{}location.href=dest};
  if(!d.open)d.showModal()}
document.addEventListener('click',e=>{if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const a=e.target.closest&&e.target.closest('a[href]');if(!a||(a.target&&a.target!=='_self')||a.hasAttribute('download')||a.getAttribute('aria-disabled')==='true')return;
  const u=new URL(a.href,location.href);if(u.origin!==location.origin||(u.pathname===location.pathname&&u.hash))return;
  if(FLOWP.includes(pageOf(u))){leaveSkip=true;return}
  if(hasPhotos()){e.preventDefault();askLeave(a.href)}});
window.addEventListener('beforeunload',e=>{if(leaveSkip||!hasPhotos())return;e.preventDefault();e.returnValue=''});
window.addEventListener('pageshow',()=>{leaveSkip=false});
