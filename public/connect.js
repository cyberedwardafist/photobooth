let stream=null,room=null,info=null,started=false,page='foto';
/* objek ruang yang dipakai halaman di dalam iframe (lihat PBR di common.js) */
window.PBC={role:null,self:null,stream:null,R:null,hook:{},send:m=>room&&room.bcast(m)};
const nm=v=>(v||'').trim().slice(0,20)||'Tamu',PAGES=['foto','adjust','edit','unduh'];
async function cam(){if(stream)return stream;try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640}},audio:false})}catch{stream=null;$('#err').textContent='Kamera tidak bisa dipakai. Izinkan akses kamera di peramban.'}return stream}
function tile(id,m,me){const d=document.createElement('div');d.className='tile';const v=document.createElement('video');v.autoplay=true;v.muted=true;v.playsInline=true;if(me)v.className='me';
  if(m.stream)v.srcObject=m.stream;d.append(v);const s=document.createElement('span');s.textContent=m.name+(me?' (kamu)':'');d.append(s);return d}
function fill(el,R){el.innerHTML='';el.append(tile('me',{name:info.name,stream},true));R.members.forEach((m,id)=>{if(id!==R.self)el.append(tile(id,m,false))})}
function draw(R){room=R;PBC.R=R;PBC.self=R.self;fill($('#tiles'),R);$('#rc').textContent=R.code;if(info.role==='host')info.code=R.code;
  $('#go').hidden=info.role!=='host';$('#wt').hidden=info.role==='host';
  if(started){fill($('#vc'),R);$('#rn').textContent=(R.members.size+1)+' orang';PBC.hook.members&&PBC.hook.members()}}
const snap=()=>{const s=getState();return{lay:s.lay,photos:s.photos,adj:s.adj,frame:s.frame}};
function onApp(d){const h=PBC.hook||{};
  if(d.k==='state'){setState(d.patch);h.sync&&h.sync(d.patch)}
  else if(d.k==='ev')h.ev&&h.ev(d.name,d.data);
  else if(d.k==='nav'&&info.role==='guest'&&PAGES.includes(d.page)&&d.page!==page){page=d.page;$('#app').src=d.page+'.html'}}
function onLoad(){const f=$('#app'),w=f.contentWindow;let p;try{p=pageOf(new URL(w.location.href))}catch{return}
  page=p;$('#vc').hidden=!['adjust','edit'].includes(p);w.addEventListener('pagehide',()=>{PBC.hook={}});
  const d=w.document,fit=()=>{f.style.height=d.body.offsetHeight+'px'};fit();new w.ResizeObserver(fit).observe(d.body);
  if(info.role==='host')room.bcast({k:'nav',page:p})}
function runRoom(){if(started)return;started=true;try{sessionStorage.removeItem(KEY)}catch{}clipClear().catch(()=>{});
  Object.assign(PBC,{role:info.role,stream});$('.cwrap').hidden=true;$('#vRun').hidden=false;$('#rb').textContent=room.code;
  fill($('#vc'),room);$('#rn').textContent=(room.members.size+1)+' orang';const f=$('#app');f.addEventListener('load',onLoad);f.src='foto.html'}
async function enter(role,code,name){$('#err').textContent='';if(!await cam())return;
  info={role,code,name,fresh:true};
  room=await openRoom({...info},stream,{onChange:draw,onApp,onStart:runRoom,
    onLate:(c,send)=>{send(c,{t:'start'});send(c,{t:'app',k:'state',patch:snap()});send(c,{t:'app',k:'nav',page})},
    onError:t=>{$('#err').textContent=t;$('#vJoin').hidden=false;$('#vRoom').hidden=true}});
  if(!room.self)return;info.code=room.code;$('#vJoin').hidden=true;$('#vRoom').hidden=false;draw(room)}
$('#mk').onclick=()=>enter('host',rand6(),nm($('#nameA').value));
$('#jn').onclick=()=>{const c=$('#code').value.trim();if(!/^\d{6}$/.test(c)){$('#err').textContent='Kode harus 6 angka.';return}enter('guest',c,nm($('#nameB').value))};
$('#code').oninput=e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,6)};
$('#go').onclick=()=>{room.started=true;room.start();runRoom()};
const bye=async()=>{pbSkip();if(room)room.leave();try{sessionStorage.removeItem(KEY)}catch{}try{await clipClear()}catch{}if(stream)stream.getTracks().forEach(t=>t.stop());location.href='connect.html'};
$('#lv').onclick=bye;$('#lv2').onclick=()=>{if(confirm('Keluar dari ruang? Foto yang sudah diambil akan hilang.'))bye()};
