let S,sel=0;
const SL=[['b','Kecerahan',50,150],['c','Kontras',50,150],['s','Saturasi',0,200]];
const keep=()=>{setState({adj:S.adj});pbSync({adj:S.adj})};let lt=0,lp=null,ls=0;const liveOne=(i,k,v)=>{lp={i,k,v};const n=performance.now();if(n-ls>=16){ls=n;clearTimeout(lt);lt=0;pbEv('adj',lp)}else if(!lt)lt=setTimeout(()=>{lt=0;ls=performance.now();pbEv('adj',lp)},16)};let tm=0;const live=()=>{if(tm)return;tm=setTimeout(()=>{tm=0;pbSync({adj:S.adj})},60)};
const paintBig=()=>{const x=$('#big').getContext('2d');x.clearRect(0,0,640,480);drawPhoto(x,S.imgs[sel],S.adj[sel],0,0,640,480)};
const paintThumb=i=>{const c=document.querySelectorAll('#thumbs canvas')[i],x=c.getContext('2d');drawPhoto(x,S.imgs[i],S.adj[i],0,0,c.width,c.height)};
function drawThumbs(){$('#thumbs').innerHTML=S.imgs.map((_,i)=>`<button class="thumb" data-i="${i}" aria-label="Foto ${i+1}" aria-pressed="${i===sel}"><canvas width="160" height="120"></canvas></button>`).join('');
  S.imgs.forEach((_,i)=>paintThumb(i));
  document.querySelectorAll('.thumb').forEach(b=>b.onclick=()=>{sel=+b.dataset.i;document.querySelectorAll('.thumb').forEach(t=>t.setAttribute('aria-pressed',t===b));pbEv('sel',sel);sync()})}
function drawControls(){
  $('#fil').innerHTML=Object.entries(FIL).map(([k,v])=>`<button class="chip" data-f="${k}" aria-pressed="false" ${canFilter||k==='none'?'':'disabled'}>${v[0]}</button>`).join('');
  $('#sl').innerHTML=SL.map(([k,n,lo,hi])=>`<label class="sl"><span>${n}</span><output id="o${k}"></output><input type="range" data-k="${k}" min="${lo}" max="${hi}" step="1" ${canFilter?'':'disabled'}></label>`).join('');
  $('#filNote').hidden=canFilter;$('#all').disabled=$('#reset').disabled=!canFilter;
  document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{S.adj[sel].f=b.dataset.f;keep();sync()});
  document.querySelectorAll('[data-k]').forEach(r=>{
    r.oninput=()=>{S.adj[sel][r.dataset.k]=+r.value;$('#o'+r.dataset.k).textContent=r.value+'%';paintBig();paintThumb(sel);liveOne(sel,r.dataset.k,+r.value)};
    r.onchange=keep});
  $('#reset').onclick=()=>{S.adj[sel]=adjOf();keep();sync()};
  $('#all').onclick=()=>{S.adj=S.adj.map(()=>({...S.adj[sel]}));keep();S.imgs.forEach((_,i)=>paintThumb(i));$('#all').textContent='Sudah diterapkan ke semua';setTimeout(()=>$('#all').textContent='Terapkan ke semua foto',1800)}}
function sync(){const a=S.adj[sel];$('#who').textContent=`(foto ${sel+1} dari ${S.imgs.length})`;
  document.querySelectorAll('[data-f]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.f===a.f));
  document.querySelectorAll('[data-k]').forEach(r=>{r.value=a[r.dataset.k];$('#o'+r.dataset.k).textContent=a[r.dataset.k]+'%'});
  paintBig();paintThumb(sel)}
loadStrip().then(s=>{S=s;$('#msg').hidden=true;$('#ui').hidden=false;drawThumbs();drawControls();sync()}).catch(stripError);

if(PBR)PBR.hook={sync:p=>{if(p.adj&&S){S.adj=p.adj.map(adjOf);S.imgs.forEach((_,i)=>paintThumb(i));sync()}},
  ev:(n,d)=>{if(n==='adj'&&S&&S.adj[d.i]){S.adj[d.i][d.k]=d.v;if(d.i!==sel){sel=d.i;document.querySelectorAll('.thumb').forEach((t,x)=>t.setAttribute('aria-pressed',x===sel))}sync()}
    else if(n==='sel'&&S&&S.imgs[d]){sel=d;document.querySelectorAll('.thumb').forEach((t,i)=>t.setAttribute('aria-pressed',i===sel));sync()}}};
