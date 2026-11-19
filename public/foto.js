const st0=getState();
let lay=LAY[st0.lay]?st0.lay:'1x4',photos=[],adj=[],cur=0,sel=-1,stream=null,delay=3,busy=false;
const count=()=>LAY[lay][0]*LAY[lay][1];
const persist=()=>{const p={lay,adj,photos:photos.map(p=>p?p.toDataURL('image/jpeg',.85):null)};setState(p);if(PBR&&!G)pbSync(p)};
/* HP: kotak kamera "melayang" di atas slot yang sedang diisi, jadi pratinjau langsung ada di tata letak */
const mq=matchMedia('(max-width:600px)');
function placeStage(){const st=document.querySelector('.stage'),wrap=$('#slotwrap');
  if(!mq.matches){st.classList.remove('floating');st.removeAttribute('style');st.hidden=false;return}
  const sw=document.querySelectorAll('#slots .sw')[cur];
  if(stream&&sw&&!photos[cur]){const a=sw.getBoundingClientRect(),b=wrap.getBoundingClientRect();
    Object.assign(st.style,{left:a.left-b.left+'px',top:a.top-b.top+'px',width:a.width+'px',height:a.height+'px'});st.classList.add('floating');st.hidden=false}
  else if(stream){st.classList.remove('floating');st.hidden=true}
  else{st.classList.remove('floating');st.removeAttribute('style');st.hidden=false}}
function focusSlot(){if(!mq.matches)return;requestAnimationFrame(()=>{const sw=document.querySelectorAll('#slots .sw')[cur];if(sw)sw.scrollIntoView({block:'center',behavior:'smooth'})})}
function moveStage(){const st=document.querySelector('.stage'),to=mq.matches?$('#slotwrap'):document.querySelector('.booth');
  if(st.parentNode!==to){to.prepend(st);const v=$('#cam');if(v.srcObject)v.play().catch(()=>{})}placeStage()}
mq.addEventListener('change',moveStage);
new ResizeObserver(()=>placeStage()).observe($('#slotwrap'));
function layoutIcon(k){const [c,r]=LAY[k],w=18/c,h=18/r;let s='';for(let i=0;i<c*r;i++)s+=`<rect x="${2+(i%c)*w+.6}" y="${2+Math.floor(i/c)*h+.6}" width="${w-1.2}" height="${h-1.2}" rx="1.5" fill="currentColor"/>`;return `<svg viewBox="0 0 22 22" aria-hidden="true">${s}</svg>`}
function drawLayouts(){$('#layouts').innerHTML=Object.keys(LAY).map(k=>`<button class="chip" data-k="${k}" aria-pressed="${k===lay}">${layoutIcon(k)}${k.replace('x',' × ')}</button>`).join('');
  document.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{lay=b.dataset.k;sel=-1;photos=Array.from({length:count()},(_,i)=>photos[i]||null);adj=Array.from({length:count()},(_,i)=>adj[i]||null);for(let k=count();k<9;k++)bump(k);cur=Math.max(0,photos.indexOf(null));persist();drawLayouts();drawSlots()})}
function drawSlots(){
  {const [c,r]=LAY[lay],el=$('#slots');el.style.setProperty('--c',c);el.style.setProperty('--r',r)}
  $('#slots').innerHTML=photos.map((p,i)=>`<div class="sw${p&&i===sel?' on':''}"><button class="slot" data-i="${i}" aria-label="Slot ${i+1}${p?', terisi':', kosong'}" ${i===(sel>=0?sel:cur)?'aria-current="true"':''}>${p?`<img alt="" src="${p.toDataURL('image/jpeg',.5)}">`:'Kosong'}</button>${p?`<button class="retake" data-r="${i}" aria-label="Ulangi foto ${i+1}"><span><svg viewBox="0 0 16 16" fill="none" stroke="#1E2D5A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 1 1-1.8-4.1"/><path d="M13 1.5v3.4H9.6"/></svg></span></button>`:''}</div>`).join('');
  const back=i=>{const el=document.querySelector(`.slot[data-i="${i}"]`);if(el)el.focus()};
  document.querySelectorAll('.slot').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(photos[i]){sel=sel===i?-1:i}else{cur=i;sel=-1}drawSlots();back(i)});
  document.querySelectorAll('.retake').forEach(b=>b.onclick=()=>{const i=+b.dataset.r;photos[i]=null;adj[i]=null;bump(i);cur=i;sel=-1;persist();drawSlots();back(i)});
  const n=photos.filter(Boolean).length,full=n===photos.length;$('#prog').textContent=`${cur+1} / ${photos.length}`;
  $('#ctrls').hidden=full;$('#nextsec').hidden=!full;$('#shoot').disabled=!stream||busy;
  $('#shootT').textContent=`Ambil foto ${cur+1} / ${photos.length}`;
  $('#left').textContent=`Sisa ${photos.length-n} dari ${photos.length} slot kosong`;placeStage()}
function toCanvas(src,sw,sh,mirror,W=640,H=480){const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),r=4/3;let w=sw,h=sh;
  if(sw/sh>r)w=sh*r;else h=sw/r;if(mirror){x.translate(W,0);x.scale(-1,1)}x.drawImage(src,(sw-w)/2,(sh-h)/2,w,h,0,0,W,H);return c}
const gen=[];let ring=[],liveBusy=0;
const bump=i=>{gen[i]=(gen[i]||0)+1;clipDel(i).catch(()=>{})};
function put(c){const i=cur;bump(i);photos[i]=c;adj[i]=null;sel=-1;const nx=photos.indexOf(null);cur=nx>=0?nx:cur;persist();drawSlots();focusSlot();return i}
/* klip live: simpan ±1 detik sebelum dan sesudah jepretan, hanya untuk foto dari kamera */
const grab=(W,H)=>{const v=$('#cam');return mixOn?toCanvas($('#mix'),640,480,false,W,H):toCanvas(v,v.videoWidth,v.videoHeight,true,W,H)};
const snap=()=>{const v=$('#cam');return stream&&v.videoWidth?grab(LIVE.W,LIVE.H):null};
setInterval(()=>{const c=snap();if(c){ring.push(c);if(ring.length>LIVE.PRE)ring.shift()}else ring=[]},1000/LIVE.FPS);
function syncNext(){const a=$('#nextlink');a.setAttribute('aria-disabled',liveBusy>0);a.textContent=liveBusy?'Menyimpan live foto...':'Lanjutkan: atur foto'}
$('#nextlink').onclick=e=>{if(liveBusy)e.preventDefault()};
async function recordLive(i,g){const frames=[...ring],key=Math.max(0,frames.length-1);liveBusy++;syncNext();
  try{for(let k=0;k<LIVE.POST;k++){await wait(1000/LIVE.FPS);const c=snap();if(c)frames.push(c)}
    if(gen[i]!==g||frames.length<4)return;
    const blobs=await Promise.all(frames.map(c=>new Promise(r=>c.toBlob(r,'image/jpeg',.8))));
    if(gen[i]!==g)return;await clipPut(i,{blobs,key})}
  catch{}finally{liveBusy--;syncNext()}}
async function startCam(){if(PBR&&PBR.stream){stream=PBR.stream;$('#cam').srcObject=stream;$('#msg').hidden=true;drawSlots();initRoom();return}
  $('#msg').hidden=false;$('#msgText').textContent='Menyalakan kamera...';$('#retry').hidden=true;
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280}},audio:false});$('#cam').srcObject=stream;$('#msg').hidden=true}
  catch(e){stream=null;$('#msgText').textContent='Kamera tidak bisa dipakai. Izinkan akses kamera di peramban, atau unggah foto dari galeri.';$('#retry').hidden=false}
  drawSlots();if(stream&&!room)initRoom()}
$('#retry').onclick=startCam;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
$('#shoot').onclick=async()=>{if(!stream||busy)return;busy=true;$('#shoot').disabled=true;
  pbEv('shoot',delay);await cd(delay);
  busy=false;const i=put(grab(640,480));recordLive(i,gen[i])};
$('#t0').onclick=()=>{delay=0;pbEv('delay',0);$('#t0').setAttribute('aria-pressed','true');$('#t3').setAttribute('aria-pressed','false')};
$('#t3').onclick=()=>{delay=3;pbEv('delay',3);$('#t3').setAttribute('aria-pressed','true');$('#t0').setAttribute('aria-pressed','false')};
$('#file').onchange=async e=>{for(const f of e.target.files){try{const b=await createImageBitmap(f);put(toCanvas(b,b.width,b.height,false))}catch{alert('Berkas bukan gambar yang bisa dibaca: '+f.name)}}e.target.value=''};
const doReset=()=>{sel=-1;photos=photos.map(()=>null);adj=photos.map(()=>null);photos.forEach((_,i)=>gen[i]=(gen[i]||0)+1);clipClear().catch(()=>{});cur=0;persist();drawSlots()};
$('#reset').onclick=doReset;$('#reset2').onclick=doReset;
document.addEventListener('click',e=>{if(sel>=0&&!e.target.closest('.sw')){sel=-1;drawSlots()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sel>=0){sel=-1;drawSlots()}});
moveStage();
(async()=>{photos=Array.from({length:count()},()=>null);adj=Array.from({length:count()},(_,i)=>(st0.adj||[])[i]||null);
  const saved=st0.photos||[];for(let i=0;i<photos.length;i++)if(saved[i]){try{photos[i]=await dataToCanvas(saved[i])}catch{adj[i]=null}}
  for(let i=0;i<photos.length;i++)if(!photos[i])clipDel(i).catch(()=>{});
  cur=Math.max(0,photos.indexOf(null));drawLayouts();drawSlots();setTimeout(startCam,0)})();

function rrect(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
/* Connect: gabungkan kamera semua orang di ruang dalam satu frame (latar dari kamera yang dipilih, kamera lain jadi kotak di depannya) */
let room=null,mixOn=false,bgId='me',autoMix=false;const vids=new Map();
const mixC=$('#mix'),mx=mixC.getContext('2d');mixC.width=640;mixC.height=480;
function vidFor(id){if(id==='me')return $('#cam');const m=room&&room.members.get(id);if(!m||!m.stream)return null;let v=vids.get(id);
  if(!v||v.srcObject!==m.stream){v=document.createElement('video');v.muted=true;v.playsInline=true;v.srcObject=m.stream;v.play().catch(()=>{});vids.set(id,v)}return v}
function coverOn(x,src,vw,vh,px,py,w,h,mirror){if(!vw)return;let sw=vw,sh=vh;if(vw/vh>w/h)sw=vh*w/h;else sh=vw*h/w;
  x.save();x.beginPath();x.rect(px,py,w,h);x.clip();if(mirror){x.translate(px+w,py);x.scale(-1,1)}else x.translate(px,py);x.drawImage(src,(vw-sw)/2,(vh-sh)/2,sw,sh,0,0,w,h);x.restore()}
const cover=(v,x,y,w,h,m)=>coverOn(mx,v,v.videoWidth,v.videoHeight,x,y,w,h,m);
/* pemisah orang dari latar (MediaPipe selfie segmenter, dimuat dari CDN saat Gabung kamera dinyalakan) */
let seg=null,segState=0,personHi=null,vscore=0,votes=0;const cuts=new Map(),mc=document.createElement('canvas'),mcx=mc.getContext('2d');
async function loadSeg(){if(segState)return;segState=1;fillSel();
  try{const V='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14',M=await import(V+'/vision_bundle.mjs'),fs=await M.FilesetResolver.forVisionTasks(V+'/wasm');
    const mk=d=>M.ImageSegmenter.createFromOptions(fs,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',delegate:d},runningMode:'IMAGE',outputCategoryMask:false,outputConfidenceMasks:true});
    try{seg=await mk('GPU')}catch{seg=await mk('CPU')}segState=2}catch{segState=3}fillSel()}
function cutout(id,v,mirror){let c=cuts.get(id);if(!c){c={cv:document.createElement('canvas'),t:0};c.cv.width=640;c.cv.height=480;cuts.set(id,c)}
  const now=performance.now();if(now-c.t<70||!v.videoWidth)return c;c.t=now;
  try{seg.segment(v,r=>{const ms=r.confidenceMasks;if(!ms||!ms.length)return;const w=ms[0].width,h=ms[0].height,arrs=ms.map(m=>m.getAsFloat32Array());
    /* skor: rata-rata di tengah-bawah dikurangi sudut atas; mask orang = skor tertinggi */
    const score=a=>{let cen=0,cn=0,cor=0,kn=0;for(let y=0;y<h;y+=8)for(let x=0;x<w;x+=8){const p=a[y*w+x],fx=x/w,fy=y/h;
      if(fx>.35&&fx<.65&&fy>.5&&fy<.95){cen+=p;cn++}else if(fy<.25&&(fx<.15||fx>.85)){cor+=p;kn++}}return(cn?cen/cn:0)-(kn?cor/kn:0)};
    let best=0,bs=-9;arrs.forEach((a,i)=>{const s=score(a);if(s>bs){bs=s;best=i}});const a=arrs[best];
    let inv=false;if(arrs.length===1){if(personHi===null){vscore+=bs;if(++votes>=8)personHi=vscore>0}inv=!(personHi===null?bs>0:personHi)}
    let on=0,tot=0;for(let q=0;q<w*h;q+=37){tot++;if((inv?1-a[q]:a[q])>.5)on++}
    if(on/tot<.02||on/tot>.98)return;/* mask tidak valid: jangan tampilkan seluruh frame */
    if(mc.width!==w||mc.height!==h){mc.width=w;mc.height=h}
    const im=mcx.createImageData(w,h),d=im.data;for(let q=0;q<w*h;q++){const p=inv?1-a[q]:a[q];d[q*4+3]=Math.max(0,Math.min(255,(p-.3)/.4*255))}mcx.putImageData(im,0,0);
    const x=c.cv.getContext('2d');x.clearRect(0,0,640,480);x.globalCompositeOperation='source-over';coverOn(x,v,v.videoWidth,v.videoHeight,0,0,640,480,mirror);
    x.globalCompositeOperation='destination-in';coverOn(x,mc,w,h,0,0,640,480,mirror);x.globalCompositeOperation='source-over'})}catch{}
  return c}
function mixLoop(){if(!mixOn)return;const ids=['me',...[...room.members].filter(([k,m])=>k!==room.self&&m.stream).map(([k])=>k)];
  if(!ids.includes(bgId))bgId='me';mx.fillStyle='#1E2D5A';mx.fillRect(0,0,640,480);
  const bg=vidFor(bgId);if(bg)cover(bg,0,0,640,480,bgId==='me');
  const rest=ids.filter(k=>k!==bgId);
  if(seg){rest.forEach((k,i)=>{const v=vidFor(k);if(!v)return;const c=cutout(k,v,k==='me');mx.drawImage(c.cv,0,0)})}
  else{const w=Math.min(200,(640-20)/Math.max(1,rest.length)-10),h=w*.75,tot=rest.length*(w+10)-10;
    rest.forEach((k,i)=>{const v=vidFor(k);if(!v)return;const x=(640-tot)/2+i*(w+10),y=480-h-16;mx.save();rrect(mx,x,y,w,h,14);mx.clip();cover(v,x,y,w,h,k==='me');mx.restore();
      mx.strokeStyle='#fff';mx.lineWidth=4;rrect(mx,x,y,w,h,14);mx.stroke()})}
  requestAnimationFrame(mixLoop)}
let pickKey='';
function fillSel(){if(!room)return;const ids=['me',...[...room.members].filter(([k,m])=>k!==room.self&&m.stream).map(([k])=>k)],n=ids.length-1;
  $('#cinfo').textContent=(n?`${n} teman terhubung, kamera otomatis digabung`:'Menunggu teman terhubung...')+(n&&segState===1?' • memuat pemisah latar...':n&&segState===3?' • pemisah latar gagal dimuat, kamera lain tampil sebagai kotak':'');
  if(!ids.includes(bgId))bgId='me';
  const nm=k=>k==='me'?'Kameraku':(room.members.get(k)||{}).name||'Teman',key=ids.map(k=>k+':'+nm(k)).join('|');
  if(key!==pickKey){pickKey=key;const row=$('#bgrow');row.innerHTML='';
    ids.forEach(k=>{const b=document.createElement('button');b.type='button';b.className='bgopt';b.dataset.id=k;b.setAttribute('role','radio');
      const v=document.createElement('video');v.autoplay=true;v.muted=true;v.playsInline=true;if(k==='me')v.className='me';v.srcObject=k==='me'?stream:room.members.get(k).stream;v.play().catch(()=>{});
      const s=document.createElement('span');s.textContent=nm(k);const c=document.createElement('i');c.setAttribute('aria-hidden','true');c.innerHTML='<svg viewBox="0 0 16 16" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>';
      b.append(v,c,s);b.onclick=()=>{bgId=k;paintPick();pbEv('bg',gid(k))};row.append(b)})}
  paintPick();$('#bgpick').hidden=!n;setMix(n>0)}
function paintPick(){document.querySelectorAll('.bgopt').forEach(b=>{const on=b.dataset.id===bgId;b.setAttribute('aria-checked',on);b.classList.toggle('on',on)})}
function setMix(on){if(on===mixOn)return;mixOn=on;$('#mix').hidden=!on;if(on){loadSeg();mixLoop()}}
const G=!!PBR&&PBR.role==='guest',gid=k=>k==='me'?room.self:k;
async function cd(n){for(let i=n;i>0;i--){$('#count').textContent=i;await wait(1000)}$('#count').textContent=''}
function initRoom(){if(!PBR||room)return;room=PBR.R;$('#cbar').hidden=false;$('#ccode').textContent=room.code;
  if(G){$('#gnote').hidden=false;['#layouts','#slotwrap','#ctrls','#reset2','#bgrow','#nextsec'].forEach(s=>{const x=$(s);if(x)x.inert=true})}
  PBR.hook={members:fillSel,sync:p=>{if(G)applyRemote(p)},ev:(n,d)=>{
    if(n==='hello'&&!G){pbEv('bg',gid(bgId));pbEv('delay',delay);persist()}
    else if(G){if(n==='shoot')cd(d);else if(n==='delay'){delay=d;$('#t0').setAttribute('aria-pressed',d===0);$('#t3').setAttribute('aria-pressed',d!==0)}
      else if(n==='bg'){bgId=d===room.self?'me':d;paintPick()}}}};
  fillSel();if(G)pbEv('hello')}
async function applyRemote(p){if(p.lay===undefined&&p.photos===undefined)return;if(LAY[p.lay])lay=p.lay;const n=count(),src=p.photos||[];
  photos=await Promise.all(Array.from({length:n},(_,i)=>src[i]?dataToCanvas(src[i]).catch(()=>null):null));
  adj=Array.from({length:n},(_,i)=>(p.adj||[])[i]||null);cur=Math.max(0,photos.indexOf(null));sel=-1;drawLayouts();drawSlots()}
