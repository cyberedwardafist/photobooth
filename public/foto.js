const st0=getState();
let lay=LAY[st0.lay]?st0.lay:'1x4',photos=[],adj=[],cur=0,sel=-1,stream=null,delay=3,busy=false;
const count=()=>LAY[lay][0]*LAY[lay][1];
const persist=()=>setState({lay,adj,photos:photos.map(p=>p?p.toDataURL('image/jpeg',.85):null)});
/* HP: kotak kamera "melayang" di atas slot yang sedang diisi, jadi pratinjau langsung ada di tata letak */
const mq=matchMedia('(max-width:600px)');
function placeStage(){const st=document.querySelector('.stage'),wrap=$('#slotwrap');
  if(!mq.matches){st.classList.remove('floating');st.removeAttribute('style');st.hidden=false;return}
  const sw=document.querySelectorAll('#slots .sw')[cur];
  if(stream&&sw&&!photos[cur]){const a=sw.getBoundingClientRect(),b=wrap.getBoundingClientRect();
    Object.assign(st.style,{left:a.left-b.left+'px',top:a.top-b.top+'px',width:a.width+'px',height:a.height+'px'});st.classList.add('floating');st.hidden=false}
  else if(stream){st.classList.remove('floating');st.hidden=true}
  else{st.classList.remove('floating');st.removeAttribute('style');st.hidden=false}}
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
function put(c){const i=cur;bump(i);photos[i]=c;adj[i]=null;sel=-1;const nx=photos.indexOf(null);cur=nx>=0?nx:cur;persist();drawSlots();return i}
/* klip live: simpan ±1 detik sebelum dan sesudah jepretan, hanya untuk foto dari kamera */
const snap=()=>{const v=$('#cam');return stream&&v.videoWidth?toCanvas(v,v.videoWidth,v.videoHeight,true,LIVE.W,LIVE.H):null};
setInterval(()=>{const c=snap();if(c){ring.push(c);if(ring.length>LIVE.PRE)ring.shift()}else ring=[]},1000/LIVE.FPS);
function syncNext(){const a=$('#nextlink');a.setAttribute('aria-disabled',liveBusy>0);a.textContent=liveBusy?'Menyimpan live foto...':'Lanjutkan: atur foto'}
$('#nextlink').onclick=e=>{if(liveBusy)e.preventDefault()};
async function recordLive(i,g){const frames=[...ring],key=Math.max(0,frames.length-1);liveBusy++;syncNext();
  try{for(let k=0;k<LIVE.POST;k++){await wait(1000/LIVE.FPS);const c=snap();if(c)frames.push(c)}
    if(gen[i]!==g||frames.length<4)return;
    const blobs=await Promise.all(frames.map(c=>new Promise(r=>c.toBlob(r,'image/jpeg',.8))));
    if(gen[i]!==g)return;await clipPut(i,{blobs,key})}
  catch{}finally{liveBusy--;syncNext()}}
async function startCam(){$('#msg').hidden=false;$('#msgText').textContent='Menyalakan kamera...';$('#retry').hidden=true;
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280}},audio:false});$('#cam').srcObject=stream;$('#msg').hidden=true}
  catch(e){stream=null;$('#msgText').textContent='Kamera tidak bisa dipakai. Izinkan akses kamera di peramban, atau unggah foto dari galeri.';$('#retry').hidden=false}
  drawSlots()}
$('#retry').onclick=startCam;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
$('#shoot').onclick=async()=>{if(!stream||busy)return;busy=true;$('#shoot').disabled=true;
  for(let i=delay;i>0;i--){$('#count').textContent=i;await wait(1000)}$('#count').textContent='';
  const v=$('#cam');busy=false;const i=put(toCanvas(v,v.videoWidth,v.videoHeight,true));recordLive(i,gen[i])};
$('#t0').onclick=()=>{delay=0;$('#t0').setAttribute('aria-pressed','true');$('#t3').setAttribute('aria-pressed','false')};
$('#t3').onclick=()=>{delay=3;$('#t3').setAttribute('aria-pressed','true');$('#t0').setAttribute('aria-pressed','false')};
$('#file').onchange=async e=>{for(const f of e.target.files){try{const b=await createImageBitmap(f);put(toCanvas(b,b.width,b.height,false))}catch{alert('Berkas bukan gambar yang bisa dibaca: '+f.name)}}e.target.value=''};
const doReset=()=>{sel=-1;photos=photos.map(()=>null);adj=photos.map(()=>null);photos.forEach((_,i)=>gen[i]=(gen[i]||0)+1);clipClear().catch(()=>{});cur=0;persist();drawSlots()};
$('#reset').onclick=doReset;$('#reset2').onclick=doReset;
document.addEventListener('click',e=>{if(sel>=0&&!e.target.closest('.sw')){sel=-1;drawSlots()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sel>=0){sel=-1;drawSlots()}});
moveStage();
(async()=>{photos=Array.from({length:count()},()=>null);adj=Array.from({length:count()},(_,i)=>(st0.adj||[])[i]||null);
  const saved=st0.photos||[];for(let i=0;i<photos.length;i++)if(saved[i]){try{photos[i]=await dataToCanvas(saved[i])}catch{adj[i]=null}}
  for(let i=0;i<photos.length;i++)if(!photos[i])clipDel(i).catch(()=>{});
  cur=Math.max(0,photos.indexOf(null));drawLayouts();drawSlots();startCam()})();
