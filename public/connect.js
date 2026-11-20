let stream=null,room=null,info=null,started=false,page='foto';
/* objek ruang yang dipakai halaman di dalam iframe (lihat PBR di common.js) */
/* pesan besar (foto) dipecah jadi potongan kecil dan dikirim berurutan, supaya pasti sampai lewat koneksi P2P */
const MAXC=8000,bufs=new Map();let bid=0,qchain=Promise.resolve();
function sendMsg(m,raw){const s=JSON.stringify(m);/* salin lewat JSON: objek dari iframe berbeda realm, PeerJS menolaknya */if(s.length<=MAXC){raw(JSON.parse(s));return}
  const id=Math.random().toString(36).slice(2)+(++bid),n=Math.ceil(s.length/MAXC);
  qchain=qchain.then(async()=>{for(let i=0;i<n;i++){raw({k:'big',id,i,n,part:s.slice(i*MAXC,(i+1)*MAXC)});if(i%4===3)await new Promise(r=>setTimeout(r,4))}})}
window.PBC={role:null,self:null,stream:null,R:null,hook:{},send:m=>room&&sendMsg(m,x=>room.bcast(x))};
const CK='pb_conn',cread=()=>{try{return JSON.parse(sessionStorage.getItem(CK))}catch{return null}},cclear=()=>{try{sessionStorage.removeItem(CK)}catch{}},
  csave=()=>{if(info&&info.code)try{sessionStorage.setItem(CK,JSON.stringify({role:info.role,code:info.code,name:info.name,started,page}))}catch{}};
const nm=v=>(v||'').trim().slice(0,20)||'Tamu',PAGES=['foto','adjust','edit','unduh'];
/* Kamera + mikrofon (suara) dalam satu stream; kalau mikrofon ditolak, kamera tetap jalan tanpa suara */
let micOk=false,spkOn=true,blocked=false;
async function cam(){if(stream)return stream;const v={facingMode:'user',width:{ideal:640}},md=navigator.mediaDevices;
  try{stream=await md.getUserMedia({video:v,audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});micOk=stream.getAudioTracks().length>0}
  catch{try{stream=await md.getUserMedia({video:v,audio:false});micOk=false}catch{stream=null;$('#err').textContent='Kamera tidak bisa dipakai. Izinkan akses kamera di peramban.'}}
  return stream}
const lbl=(b,t)=>{b.title=t;b.setAttribute('aria-label',t)};
function micBtn(){const b=$('#mic');if(!micOk){b.disabled=true;lbl(b,'Mic tidak tersedia. Izinkan mikrofon di peramban, lalu muat ulang halaman');b.setAttribute('aria-pressed','false');return}
  const on=stream.getAudioTracks().some(t=>t.enabled);b.setAttribute('aria-pressed',on);lbl(b,on?'Mic aktif':'Mic mati')}
function spkBtn(){const b=$('#spk');b.setAttribute('aria-pressed',spkOn&&!blocked);lbl(b,blocked?'Ketuk untuk menyalakan suara':spkOn?'Suara teman nyala':'Suara teman mati')}
/* suara teman diputar dari halaman induk ini, jadi tidak putus saat pindah langkah di dalam iframe */
const auds=new Map();
function syncAudio(){const box=$('#aud'),live=new Set();let bl=false;
  if(room)room.members.forEach((m,id)=>{if(id===room.self||!m.stream||!m.stream.getAudioTracks().length)return;live.add(id);
    let a=auds.get(id);if(!a){a=document.createElement('audio');a.autoplay=true;box.append(a);auds.set(id,a)}
    if(a.srcObject!==m.stream)a.srcObject=m.stream;a.muted=!spkOn;if(a.paused)a.play().catch(()=>{bl=true})});
  auds.forEach((a,id)=>{if(!live.has(id)){a.srcObject=null;a.remove();auds.delete(id)}});
  if(bl!==blocked){blocked=bl;spkBtn()}}
$('#mic').onclick=()=>{if(!micOk)return;const on=!stream.getAudioTracks()[0].enabled;stream.getAudioTracks().forEach(t=>t.enabled=on);micBtn()};
$('#spk').onclick=()=>{if(blocked){blocked=false;syncAudio();return}spkOn=!spkOn;syncAudio();spkBtn()};
addEventListener('pointerdown',()=>{if(blocked)syncAudio()});setInterval(()=>{if(blocked)syncAudio()},1500);
const ini=n=>(n||'?').trim().charAt(0).toUpperCase();
function tile(m,me){const d=document.createElement('div');d.className='tile';const v=document.createElement('video');v.autoplay=true;v.muted=true;v.playsInline=true;if(me)v.className='me';
  if(m.stream)v.srcObject=m.stream;d.append(v);const s=document.createElement('span');s.textContent=m.name+(me?' (kamu)':'');d.append(s);return d}
function fill(el,R){el.innerHTML='';el.append(tile({name:info.name,stream},true));R.members.forEach((m,id)=>{if(id!==R.self)el.append(tile(m,false))})}
function chips(R){const hid=PFX+R.code,it=[{n:info.name,h:info.role==='host',me:true}];R.members.forEach((m,id)=>{if(id!==R.self)it.push({n:m.name,h:id===hid})});
  $('#chips').innerHTML=it.map(i=>`<li class="chip${i.h?' host':''}"><i>${esc(ini(i.n))}</i>${esc(i.n)}${i.me?' (kamu)':''}</li>`).join('')}
function draw(R){room=R;PBC.R=R;syncAudio();PBC.self=R.self;fill($('#tiles'),R);chips(R);$('#rc').textContent=R.code;if(info.role==='host')info.code=R.code;
  $('#go').hidden=false;$('#rsub').textContent='Bagikan kode di atas ke temanmu, lalu siapa pun bisa menekan mulai kalau semua sudah masuk.';
  if(started){fill($('#vc'),R);PBC.hook.members&&PBC.hook.members()}}
const showTicket=on=>{$('#heroJoin').hidden=on;$('#ticket').hidden=!on;$('#hero').classList.toggle('slim',on)};
const snap=()=>{const s=getState();return{lay:s.lay,photos:s.photos,adj:s.adj,frame:s.frame}};
function onApp(d){if(d.k==='big'){const b=bufs.get(d.id)||{n:d.n,p:[],c:0};b.p[d.i]=d.part;if(++b.c===b.n){bufs.delete(d.id);try{onApp(JSON.parse(b.p.join('')))}catch(e){console.warn('big',e)}}else bufs.set(d.id,b);return}
  const h=PBC.hook||{};
  if(d.k==='state'){setState(d.patch);h.sync&&h.sync(d.patch)}
  else if(d.k==='ev')h.ev&&h.ev(d.name,d.data);
  else if(d.k==='nav'&&info.role==='guest'&&PAGES.includes(d.page)&&d.page!==page){page=d.page;$('#app').src='/'+d.page}
  else if(d.k==='navreq'&&info.role==='host'&&started&&PAGES.includes(d.page)&&d.page!==page){page=d.page;$('#app').src='/'+d.page}
  else if(d.k==='startreq'&&info.role==='host'&&!started){room.started=true;room.start();runRoom()}}
let fitFn=null;const fitH=()=>{const f=$('#app');if(!fitFn)return;if(innerWidth<=820)f.style.height=Math.max(innerHeight-70,520)+'px';else fitFn()};addEventListener('resize',fitH);
function onLoad(){const f=$('#app'),w=f.contentWindow;let p;try{p=pageOf(new URL(w.location.href))}catch{return}
  page=p;csave();$('#vc').hidden=!['adjust','edit'].includes(p);if(!$('#vc').hidden)$('#vc').querySelectorAll('video').forEach(v=>v.play().catch(()=>{}));w.addEventListener('pagehide',()=>{PBC.hook={}});
  const d=w.document;fitFn=()=>{f.style.height=d.body.offsetHeight+'px'};fitH();new w.ResizeObserver(fitH).observe(d.body);
  if(info.role==='host')room.bcast({k:'nav',page:p})}
function runRoom(resume){if(started)return;started=true;if(resume!==true){try{sessionStorage.removeItem(KEY)}catch{}clipClear().catch(()=>{});page='foto'}csave();
  Object.assign(PBC,{role:info.role,stream,name:info.name});$('#cwrap').hidden=true;$('#vRun').hidden=false;
  fill($('#vc'),room);const f=$('#app');f.addEventListener('load',onLoad);f.src='/'+page}
async function enter(role,code,name,sv){$('#err').textContent='';if(!await cam())return;
  info={role,code,name,fresh:!sv};
  room=await openRoom({...info,started:!!(sv&&sv.started)},stream,{onChange:draw,onApp,onStart:()=>runRoom(),
    onLate:(c,send)=>{send(c,{t:'start'});sendMsg({k:'state',patch:snap()},x=>send(c,{t:'app',...x}));send(c,{t:'app',k:'nav',page})},
    onError:t=>{cclear();$('#err').textContent=t;$('#vJoin').hidden=false;$('#vRoom').hidden=true;showTicket(false)}});
  if(!room.self)return;$('#vbar').hidden=false;micBtn();spkBtn();info.code=room.code;$('#vJoin').hidden=true;$('#vRoom').hidden=false;showTicket(true);draw(room);csave();if(sv&&sv.started)runRoom(true)}
$('#mk').onclick=()=>enter('host',rand6(),nm($('#nameA').value));
$('#jn').onclick=()=>{const c=$('#code').value.trim();if(!/^\d{6}$/.test(c)){$('#err').textContent='Kode harus 6 angka.';return}enter('guest',c,nm($('#nameB').value))};
$('#code').oninput=e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,6)};
$('#go').onclick=()=>{if(info.role==='guest'){PBC.send({k:'startreq'});return}room.started=true;room.start();runRoom()};
const bye=async()=>{$('#vbar').hidden=true;pbSkip();cclear();if(room)room.leave();try{sessionStorage.removeItem(KEY)}catch{}try{await clipClear()}catch{}if(stream)stream.getTracks().forEach(t=>t.stop());location.href='/connect'};
$('#lv').onclick=()=>{if(started&&!confirm('Keluar dari ruang? Foto yang sudah diambil akan hilang.'))return;bye()};
$('#copy').onclick=async()=>{const b=$('#copy');try{await navigator.clipboard.writeText(room.code)}catch{}b.textContent='Tersalin';setTimeout(()=>{b.textContent='Salin kode'},1600)};

/* refresh tidak mengeluarkan dari ruang: sambung ulang otomatis dengan kode yang sama */
const sv=cread();if(sv&&sv.code&&sv.name){if(PAGES.includes(sv.page))page=sv.page;$('#err').textContent='Menyambungkan kembali ke ruang '+sv.code+'...';enter(sv.role,sv.code,sv.name,sv).then(()=>{if(room&&room.self)$('#err').textContent=''})}
