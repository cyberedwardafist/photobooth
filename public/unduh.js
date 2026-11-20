let S,frame,clips=[],items=[],cur=null,dlgLoop=0;
const sel=new Set(),cache=new Map(),cards=[];
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const VID=(()=>{if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)return null;
  for(const m of['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'])if(MediaRecorder.isTypeSupported(m))return{type:m,mime:m.split(';')[0],ext:m.startsWith('video/mp4')?'mp4':'webm'};return null})();
const FMS=1000/LIVE.FPS,HOLD=500,SLIDE=900;
const clipCyc=c=>c.frames.length*FMS+HOLD;
const frameAt=(c,t)=>c.frames[Math.min(c.frames.length-1,Math.floor((t%clipCyc(c))/FMS))];
let rmU=false,lbxRem=false;const U=(n,d)=>{if(PBR&&!rmU)pbEv(n,d)};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const photoCv=(cv,s)=>{cv.width=Math.round(640*s/2)*2;cv.height=Math.round(480*s/2)*2;return cv.getContext('2d')};

function build(){const {imgs,adj,lay}=S,n=imgs.length,anyClip=clips.some(Boolean),vid=!!VID&&CFG.video,noVid=CFG.video?'Peramban ini belum bisa merekam video.':'Unduhan video sedang dimatikan oleh admin.';
  const mk=o=>items.push({ext:'png',tag:'PNG',anim:false,cyc:1,vs:1,ok:true,...o});
  const sz=stripSize(lay,frame),stripS=Math.min(1,300/sz.W),vs=Math.min(1,1100/Math.max(sz.W,sz.H));
  mk({id:'strip',grp:'Frame',label:'Frame diam',file:'frame',sub:'Strip lengkap dengan frame',ps:stripS,w:sz.W,h:sz.H,
    paint:(cv,t,s)=>renderStrip(cv,{lay,photos:imgs,adj,frame,s})});
  const cyS=Math.max(0,...clips.map(c=>c?clipCyc(c):0));
  mk({id:'stripv',grp:'Frame',label:'Frame video',file:'frame-video',sub:'Strip dengan foto live yang bergerak berulang',ext:VID?VID.ext:'mp4',tag:'VIDEO',anim:true,vid:true,cyc:cyS||1,vs,ps:stripS,w:sz.W,h:sz.H,
    ok:vid&&anyClip,why:!vid?noVid:'Perlu foto dari kamera (foto unggahan tidak punya gerakan).',
    paint:(cv,t,s)=>renderStrip(cv,{lay,photos:imgs.map((im,k)=>clips[k]?frameAt(clips[k],t):im),adj,frame,s})});
  imgs.forEach((_,i)=>mk({id:'p'+i,grp:'Foto satuan',label:'Foto '+(i+1),file:'foto-'+(i+1),sub:'Foto dengan filter yang kamu atur',ps:.5,w:640,h:480,
    paint:(cv,t,s)=>{const x=photoCv(cv,s);drawPhoto(x,imgs[i],adj[i],0,0,cv.width,cv.height)}}));
  const cyA=n*SLIDE;
  mk({id:'anim',grp:'Animasi',label:'Animasi foto',file:'animasi',sub:'Semua fotomu tampil bergantian, berulang',ext:VID?VID.ext:'mp4',tag:'VIDEO',anim:true,vid:true,cyc:cyA,ps:.5,w:640,h:480,
    ok:vid&&n>1,why:!vid?noVid:'Perlu minimal 2 foto.',
    paint:(cv,t,s)=>{const T=t%cyA,i=Math.floor(T/SLIDE),l=T%SLIDE,x=photoCv(cv,s),w=cv.width,h=cv.height;
      if(n>1&&l<180){const p=(i+n-1)%n;drawPhoto(x,imgs[p],adj[p],0,0,w,h);x.globalAlpha=l/180}
      drawPhoto(x,imgs[i],adj[i],0,0,w,h);x.globalAlpha=1}});
  imgs.forEach((_,i)=>mk({id:'l'+i,grp:'Live foto',label:'Live foto '+(i+1),file:'live-'+(i+1),sub:'Gerakan sekitar 2 detik saat foto diambil',ext:VID?VID.ext:'mp4',tag:'LIVE',anim:true,vid:true,
    cyc:clips[i]?clipCyc(clips[i]):1,ps:.5,w:640,h:480,ok:vid&&!!clips[i],why:!vid?noVid:'Hanya untuk foto yang diambil dari kamera.',
    paint:(cv,t,s)=>{const x=photoCv(cv,s);if(clips[i])drawPhoto(x,frameAt(clips[i],t),adj[i],0,0,cv.width,cv.height);else drawPhoto(x,imgs[i],adj[i],0,0,cv.width,cv.height)}}))}

/* galeri */
function cardEl(it){const b=document.createElement('button');b.className='rcard'+(it.ok?'':' off');b.dataset.id=it.id;
  b.innerHTML=`<span class="rprev">${it.ok?'<canvas aria-hidden="true"></canvas>':`<span class="why">${esc(it.why)}</span>`}${it.ok?`<i class="badge">${it.tag}</i>`:''}</span><span class="rname">${esc(it.label)}</span><span class="rsub">${esc(it.sub)}</span>`;
  if(it.ok){b.onclick=()=>openView(it);const cv=b.querySelector('canvas');it.paint(cv,0,it.ps);if(it.anim&&!reduce)cards.push({it,cv,vis:true})}
  else b.disabled=true;return b}
function drawRes(){const box=$('#res');box.innerHTML='';const groups=[...new Set(items.map(i=>i.grp))];
  groups.forEach(g=>{const list=items.filter(i=>i.grp===g),sec=document.createElement('section');sec.className='rsec';
    sec.innerHTML=`<h3>${g}</h3><div class="rgrid${g==='Frame'?' tall':''}"></div>`;const grid=sec.lastChild;
    if(g==='Live foto'&&!list.some(i=>i.ok)){grid.innerHTML=`<p class="state">${esc(list[0].why)} Ambil foto lewat kamera untuk mendapat live foto dan frame video.</p>`}
    else list.forEach(it=>grid.append(cardEl(it)));box.append(sec)})}
const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{const c=cards.find(x=>x.cv===e.target);if(c)c.vis=e.isIntersecting})):null;
let lastT=0;
function tick(ts){if(ts-lastT>=1000/12){lastT=ts;if(!$('#dlg').open&&!$('#lbx').open)cards.forEach(c=>c.vis&&c.it.paint(c.cv,ts,c.it.ps))}requestAnimationFrame(tick)}

/* penampil besar: klik kartu, geser atau panah untuk pindah */
let vi=0,vloop=0,vdir=0;const vlist=()=>items.filter(i=>i.ok);
function showV(k,dir){const L=vlist();vi=(k+L.length)%L.length;const it=L[vi],cv=$('#lcv'),s=Math.min(1,1000/Math.max(it.w,it.h));
  U('vshow',it.id);cancelAnimationFrame(vloop);$('#lT').textContent=it.label;$('#lS').textContent=it.sub;$('#lN').textContent=`${vi+1} / ${L.length}`;
  $('#lPrev').hidden=$('#lNext').hidden=L.length<2;
  if(dir&&!reduce){cv.classList.remove('inL','inR');void cv.offsetWidth;cv.classList.add(dir>0?'inR':'inL')}
  const t0=performance.now(),run=()=>{it.paint(cv,performance.now()-t0,s);if(it.anim)vloop=requestAnimationFrame(run)};run()}
function openView(it){showV(vlist().indexOf(it),0);if(!$('#lbx').open)$('#lbx').showModal()}
$('#lPrev').onclick=()=>showV(vi-1,-1);$('#lNext').onclick=()=>showV(vi+1,1);$('#lX').onclick=()=>$('#lbx').close();
$('#lbx').addEventListener('close',()=>{cancelAnimationFrame(vloop);if(lbxRem){lbxRem=false;return}U('vclose')});
$('#lbx').addEventListener('click',e=>{if(e.target===$('#lbx'))$('#lbx').close()});
$('#lbx').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();showV(vi-1,-1)}else if(e.key==='ArrowRight'){e.preventDefault();showV(vi+1,1)}});
{let sx=null;const st=$('#lStage');st.addEventListener('pointerdown',e=>{if(!e.target.closest('.lnav'))sx=e.clientX});
  st.addEventListener('pointerup',e=>{if(sx==null)return;const d=e.clientX-sx;sx=null;if(Math.abs(d)>50)showV(vi+(d<0?1:-1),d<0?1:-1)});
  st.addEventListener('pointercancel',()=>sx=null)}

/* dialog pilih unduhan */
function dlgPrev(){cancelAnimationFrame(dlgLoop);if(!cur)return;const it=cur,cv=$('#dcv'),s=Math.min(1,520/it.w);
  $('#dcap').textContent=`${it.label}: ${it.sub}. Format ${it.ext.toUpperCase()}.`;
  const t0=performance.now(),run=()=>{it.paint(cv,performance.now()-t0,s);if(it.anim)dlgLoop=requestAnimationFrame(run)};run()}
function drawOpts(){const box=$('#dopts');box.innerHTML='';const groups=[...new Set(items.map(i=>i.grp))];
  groups.forEach(g=>{let list=items.filter(i=>i.grp===g);if(g==='Live foto'&&!list.some(i=>i.ok))list=[list[0]];
    const f=document.createElement('fieldset');f.innerHTML=`<legend>${g}</legend>`;
    list.forEach(it=>{const l=document.createElement('label');l.className='opt'+(it.ok?'':' off');
      l.innerHTML=`<input type="checkbox" data-id="${it.id}" ${it.ok?'':'disabled'} ${sel.has(it.id)?'checked':''}><span>${esc(g==='Live foto'&&!it.ok?'Live foto':it.label)}${it.ok?'':`<small>${esc(it.why)}</small>`}</span><em>${it.ext.toUpperCase()}</em>`;f.append(l)});box.append(f)});
  box.querySelectorAll('input').forEach(c=>c.onchange=()=>{const it=items.find(x=>x.id===c.dataset.id);c.checked?sel.add(it.id):sel.delete(it.id);cur=it;dlgPrev();count()})}
function count(){const n=sel.size;$('#go').disabled=!n||busy;$('#go').textContent=n?`Unduh ${n} file terpilih`:'Pilih dulu yang mau diunduh'}
function openDlg(it){sel.clear();items.filter(i=>i.ok).forEach(i=>sel.add(i.id));cur=it||items.find(i=>i.ok);drawOpts();count();$('#prog').textContent='';if(!$('#dlg').open)$('#dlg').showModal();dlgPrev()}
$('#open').onclick=()=>openDlg(null);
$('#dlg').addEventListener('close',()=>cancelAnimationFrame(dlgLoop));
$('#dlg').addEventListener('click',e=>{if(e.target===$('#dlg'))$('#dlg').close()});
$('#selAll').onclick=()=>{items.filter(i=>i.ok).forEach(i=>sel.add(i.id));drawOpts();count()};
$('#selNone').onclick=()=>{sel.clear();drawOpts();count()};

/* pembuatan file */
function record(it,onp){return new Promise((ok,no)=>{const cv=document.createElement('canvas'),loops=Math.max(1,Math.ceil(4000/it.cyc)),total=it.cyc*loops;
  it.paint(cv,0,it.vs);let rec;
  try{rec=new MediaRecorder(cv.captureStream(30),{mimeType:VID.type,videoBitsPerSecond:4e6})}catch(e){return no(e)}
  const ch=[];rec.ondataavailable=e=>e.data.size&&ch.push(e.data);rec.onerror=e=>no(e.error||e);rec.onstop=()=>ok(new Blob(ch,{type:VID.mime}));
  const t0=performance.now();rec.start();
  const step=()=>{const t=performance.now()-t0;if(t>=total){setTimeout(()=>rec.stop(),150);return}it.paint(cv,t,it.vs);onp(t/total);requestAnimationFrame(step)};step()})}
async function blobOf(it,onp){if(cache.has(it.id))return cache.get(it.id);let b;
  if(it.vid)b=await record(it,onp);else{const cv=document.createElement('canvas');it.paint(cv,0,1);b=await new Promise(r=>cv.toBlob(r,'image/png'))}
  cache.set(it.id,b);return b}
function save(b,name){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),15000)}
let busy=false;
$('#go').onclick=async()=>{const list=items.filter(i=>sel.has(i.id)&&i.ok),ord=[...list.filter(i=>!i.vid),...list.filter(i=>i.vid)];if(!ord.length)return;
  busy=true;count();document.querySelectorAll('#dlg input,#selAll,#selNone').forEach(e=>e.disabled=true);let done=0,fail=[];
  for(const it of ord){const lbl=`${done+1} dari ${ord.length}: ${it.label}`;$('#prog').textContent='Menyiapkan '+lbl;
    try{const b=await blobOf(it,p=>$('#prog').textContent=`Merekam ${lbl} (${Math.round(p*100)}%)`);save(b,`photobooth-${it.file}.${it.ext}`);done++;await wait(500)}catch{fail.push(it.label)}}
  busy=false;document.querySelectorAll('#dlg input:not([data-off]),#selAll,#selNone').forEach(e=>{e.disabled=false});drawOpts();count();
  $('#prog').textContent=fail.length?`${done} file terunduh. Gagal: ${fail.join(', ')}.`:`Selesai, ${done} file terunduh. Cek folder unduhan.`;
  if(done)fetch('/api/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({frame:frame.name,layout:S.lay,files:done})}).catch(()=>{})};

Promise.all([loadStrip(),SETP]).then(async([s])=>{S=s;frame=frameOf(s.st);
  clips=await Promise.all(s.imgs.map(async(_,i)=>{try{const c=await clipGet(i);if(!c||!c.blobs||c.blobs.length<4)return null;
    return{frames:await Promise.all(c.blobs.map(b=>createImageBitmap(b))),key:c.key}}catch{return null}}));
  $('#fname').textContent=frame.name;build();{const ORD=['Frame','Animasi','Foto satuan','Live foto'];items.sort((a,b)=>ORD.indexOf(a.grp)-ORD.indexOf(b.grp))}$('#msg').hidden=true;$('#ui').hidden=false;drawRes();
  cards.forEach(c=>io&&io.observe(c.cv));requestAnimationFrame(tick);
  if(PBR)PBR.hook={ev:(n,d)=>{rmU=true;try{
    if(n==='vshow'){const it=items.find(x=>x.id===d);if(it&&it.ok){if(!$('#lbx').open)$('#lbx').showModal();showV(vlist().indexOf(it),0)}}
    else if(n==='vclose'){if($('#lbx').open){lbxRem=true;$('#lbx').close()}}
  }finally{rmU=false}}}}).catch(stripError);
