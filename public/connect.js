let stream=null,room=null,info=null;
const nm=v=>(v||'').trim().slice(0,20)||'Tamu';
async function cam(){if(stream)return stream;try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640}},audio:false})}catch{stream=null;$('#err').textContent='Kamera tidak bisa dipakai. Izinkan akses kamera di peramban.'}return stream}
function tile(id,m,me){const d=document.createElement('div');d.className='tile';const v=document.createElement('video');v.autoplay=true;v.muted=true;v.playsInline=true;if(me)v.className='me';
  if(m.stream)v.srcObject=m.stream;d.append(v);const s=document.createElement('span');s.textContent=m.name+(me?' (kamu)':'');d.append(s);return d}
function draw(R){const t=$('#tiles');t.innerHTML='';
  t.append(tile('me',{name:info.name,stream},true));R.members.forEach((m,id)=>{if(id!==R.self)t.append(tile(id,m,false))});
  $('#rc').textContent=R.code;if(info.role==='host'&&info.code!==R.code){info.code=R.code;roomSet(info)}
  $('#go').hidden=info.role!=='host';$('#wt').hidden=info.role==='host'}
async function enter(role,code,name){$('#err').textContent='';if(!await cam())return;
  info={role,code,name,fresh:true};
  room=await openRoom({...info},stream,{onChange:draw,onStart:()=>{roomSet({...info,fresh:false});pbSkip();location.href='foto.html'},onError:t=>{$('#err').textContent=t;$('#vJoin').hidden=false;$('#vRoom').hidden=true}});
  if(!room.self)return;info.code=room.code;roomSet(info);$('#vJoin').hidden=true;$('#vRoom').hidden=false;draw(room)}
$('#mk').onclick=()=>enter('host',rand6(),nm($('#nameA').value));
$('#jn').onclick=()=>{const c=$('#code').value.trim();if(!/^\d{6}$/.test(c)){$('#err').textContent='Kode harus 6 angka.';return}enter('guest',c,nm($('#nameB').value))};
$('#code').oninput=e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,6)};
$('#go').onclick=()=>{roomSet({...info,fresh:false});room.start();pbSkip();location.href='foto.html'};
$('#lv').onclick=()=>{if(room)room.leave();roomClear();if(stream)stream.getTracks().forEach(t=>t.stop());location.reload()};
