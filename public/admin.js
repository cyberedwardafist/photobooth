/* Panel admin photobooth. Memakai $, esc, lum, inkFor, SW dari common.js dan FRAMES, sample, renderStrip, plainFrame dari frames.js */
const api=async(u,o={})=>{const r=await fetch(u,{headers:{'Content-Type':'application/json'},...o,body:o.body?JSON.stringify(o.body):undefined});const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.error||'Terjadi kesalahan'),{status:r.status});return j};
const clone=o=>JSON.parse(JSON.stringify(o)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fmt=n=>Number(n||0).toLocaleString('id-ID');
const LAYS=['1x1','1x2','1x3','1x4','2x2','2x3','3x3'];
const I=d=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ic={
  ringkasan:I('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  template:I('<rect x="6" y="2.5" width="12" height="19" rx="2"/><rect x="9" y="5.5" width="6" height="4" rx=".8"/><rect x="9" y="11" width="6" height="4" rx=".8"/>'),
  alur:I('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/>'),
  statistik:I('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  sistem:I('<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01"/>'),
  ok:I('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>'),
  warn:I('<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.6h.01"/>'),
  bad:I('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>'),
  ext:I('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
  plus:I('<path d="M12 5v14M5 12h14"/>'),dl:I('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>')
};
const layIcon=k=>{const [c,r]=LAY[k],w=18/c,h=18/r;let s='';for(let i=0;i<c*r;i++)s+=`<rect x="${2+(i%c)*w+.6}" y="${2+Math.floor(i/c)*h+.6}" width="${w-1.2}" height="${h-1.2}" rx="1.5" fill="currentColor"/>`;return `<svg viewBox="0 0 22 22" aria-hidden="true">${s}</svg>`};

const ROUTES={
  ringkasan:['Ringkasan','Ringkasan','Kondisi situs dan alur yang dilalui pengunjung.'],
  template:['Template dan frame','Frame','Atur frame yang bisa dipilih pengunjung.'],
  alur:['Alur dan pengaturan','Alur','Atur apa saja yang bisa dilakukan pengunjung.'],
  statistik:['Statistik','Statistik','Seberapa sering strip diunduh, dan frame apa yang dipakai.'],
  sistem:['Sistem','Sistem','Kesehatan server, sesi admin, dan cadangan data.']};
let D=null,draft=null,route='ringkasan',tab='warna',q='',range=30,showTbl=false,editing=null,chartDays=[];
const dirty=()=>!!D&&!same(draft,D.settings);
const view=$('#view');

/* ===== data ===== */
function apply(r){const was=D&&dirty();D=r;if(!was)draft=clone(D.settings)}
function toast(m,kind){const t=$('#toast');t.textContent=m;t.className='toast show'+(kind?' '+kind:'');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),3200)}
function fail(e){if(e.status===401){show(false);$('#err').textContent='Sesi habis. Masuk lagi untuk melanjutkan.';$('#err').hidden=false}else toast(e.message,'bad')}
function ask(title,text,ok){return new Promise(r=>{$('#cT').textContent=title;$('#cP').textContent=text;$('#cOk').textContent=ok;const d=$('#cdlg');d.returnValue='';d.addEventListener('close',()=>r(d.returnValue==='yes'),{once:true});d.showModal()})}
const setPath=(o,p,v)=>{const k=p.split('.');let t=o;while(k.length>1)t=t[k.shift()];t[k[0]]=v};

/* ===== turunan ===== */
const tplActive=()=>D.templates.filter(t=>t.active).length;
const builtinOn=s=>FRAMES.filter(f=>!s.hiddenFrames.includes(f.id)).length;
function attention(){const s=D.settings,out=[],local=D.env.runtime.startsWith('Lokal');
  if(!s.open)out.push(['warn','Situs sedang ditutup','Pengunjung melihat pesan tutup di halaman foto. <a href="#alur">Buka lagi</a>']);
  if(!D.migrated.settings||!D.migrated.log)out.push(['bad','Migrasi database belum lengkap','Jalankan <code>npm run migrate</code> agar pengaturan dan statistik bisa tersimpan. Aman diulang.']);
  if(builtinOn(s)+tplActive()===0)out.push(['bad','Tidak ada frame untuk dipilih','Aktifkan minimal satu <a href="#template">frame</a>.']);
  if(!local&&D.env.secretLen<32)out.push(['warn','SESSION_SECRET terlalu pendek','Pakai minimal 32 karakter acak. Lihat <a href="#sistem">Sistem</a>.']);
  if(s.banner.on&&s.banner.text)out.push(['ok','Pengumuman tampil di semua halaman','"'+esc(s.banner.text)+'"']);
  return out}
const issues=()=>attention().filter(a=>a[0]!=='ok').length;

/* ===== bingkai: menu, status, bilah simpan ===== */
function chrome(){
  const cur=route,n=issues();
  $('#nav').innerHTML=Object.entries(ROUTES).map(([k,v])=>`<a href="#${k}" ${k===cur?'aria-current="page"':''}>${ic[k]}<span>${v[0]}</span>${k==='sistem'&&n?`<span class="n" aria-label="${n} perlu perhatian">${n}</span>`:''}</a>`).join('');
  $('#tabbar').innerHTML=Object.entries(ROUTES).map(([k,v])=>`<a href="#${k}" ${k===cur?'aria-current="page"':''}>${ic[k]}<span>${v[1]}</span></a>`).join('');
  const open=D.settings.open;for(const id of['#pill','#pill2']){const p=$(id);p.className='pill'+(open?'':' off');p.innerHTML=`<i></i>${open?'Situs buka':'Situs tutup'}`}
  $('#savebar').hidden=!dirty();
  document.title=ROUTES[cur][0]+' | Admin photobooth'}
function render(keep){
  let key=null;const a=document.activeElement;
  if(keep&&a&&view.contains(a)){key=a.dataset.set?`[data-set="${a.dataset.set}"]`:a.dataset.fr?`[data-fr="${a.dataset.fr}"]`:a.dataset.act?`[data-act="${a.dataset.act}"]${a.dataset.k?`[data-k="${a.dataset.k}"]`:''}`:null}
  chrome();view.innerHTML=({ringkasan:vRingkasan,template:vTemplate,alur:vAlur,statistik:vStatistik,sistem:vSistem}[route])();
  bindChart();paint();
  if(key){const el=view.querySelector(key);if(el)el.focus({preventScroll:true})}}

/* ===== gambar frame (canvas) ===== */
let SAMP=null;
async function paint(root=view){try{await document.fonts.ready}catch{}
  SAMP=SAMP||[0,1].map(sample);
  const map=new Map(FRAMES.map(f=>[f.id,f]));D&&D.templates.forEach(t=>map.set('tpl-'+t.id,plainFrame(t)));
  root.querySelectorAll('canvas[data-f]').forEach(cv=>{const f=map.get(cv.dataset.f);if(f)renderStrip(cv,{lay:'1x2',photos:SAMP,adj:[adjOf(),adjOf()],frame:f,s:.4})})}

/* ===== grafik batang ===== */
function chart(days,h=200){chartDays=days;
  const W=innerWidth<600?320:640,L=34,R=6,T=14,B=26,iw=W-L-R,ih=h-T-B,mx=Math.max(1,...days.map(d=>d.n)),top=Math.max(4,Math.ceil(mx/4)*4),bw=iw/days.length,gap=Math.min(6,Math.max(2,bw*.22)),step=Math.ceil(days.length/7);
  const y=v=>T+ih-v/top*ih,dl=d=>new Date(d+'T00:00:00Z').toLocaleDateString('id-ID',{day:'numeric',month:'short',timeZone:'UTC'});
  const bp=(x,yy,w,hh,r)=>{r=Math.min(r,hh,w/2);return `M${x},${yy+hh}V${yy+r}Q${x},${yy} ${x+r},${yy}H${x+w-r}Q${x+w},${yy} ${x+w},${yy+r}V${yy+hh}Z`};
  let g='',b='',x='';
  [0,top/2,top].forEach(v=>{g+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end">${v}</text>`});
  days.forEach((d,i)=>{const bx=L+i*bw+gap/2,w=bw-gap;
    b+=d.n?`<path class="bar" data-i="${i}" d="${bp(bx,y(d.n),w,T+ih-y(d.n),4)}"/>`:`<rect class="zero" data-i="${i}" x="${bx}" y="${T+ih-2}" width="${w}" height="2"/>`;
    if((days.length-1-i)%step===0)x+=`<text x="${bx+w/2}" y="${h-6}" text-anchor="middle">${dl(d.d)}</text>`});
  const last=days[days.length-1];if(last.n)x+=`<text x="${L+(days.length-1)*bw+bw/2}" y="${y(last.n)-6}" text-anchor="middle" style="fill:var(--ink);font-weight:700">${last.n}</text>`;
  const sum=days.reduce((a,d)=>a+d.n,0);
  return `<div class="chartbox"><svg viewBox="0 0 ${W} ${h}" role="img" aria-label="Unduhan per hari selama ${days.length} hari terakhir, total ${sum}"><g class="grid">${g}</g>${b}${x}</svg><div class="tip" hidden></div></div>`}
function bindChart(){const box=view.querySelector('.chartbox');if(!box)return;const svg=box.querySelector('svg'),tip=box.querySelector('.tip'),vb=svg.viewBox.baseVal;
  const hide=()=>{tip.hidden=true;svg.querySelectorAll('.hov').forEach(e=>e.classList.remove('hov'))};
  svg.addEventListener('pointermove',e=>{const r=svg.getBoundingClientRect(),sc=r.width/vb.width,L=34,R=6,bw=(vb.width-L-R)/chartDays.length,i=Math.floor(((e.clientX-r.left)/sc-L)/bw);
    if(i<0||i>=chartDays.length)return hide();const d=chartDays[i];hide();const el=svg.querySelector(`[data-i="${i}"]`);if(el)el.classList.add('hov');
    tip.innerHTML=`<b>${new Date(d.d+'T00:00:00Z').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',timeZone:'UTC'})}</b>${fmt(d.n)} unduhan, ${fmt(d.files)} file`;tip.hidden=false;
    const bb=el?el.getBBox():{x:L+i*bw,y:150,width:bw};tip.style.left=Math.min(Math.max((bb.x+bb.width/2)*sc,80),r.width-80)+'px';tip.style.top=Math.max((bb.y*sc)-8,40)+'px'});
  svg.addEventListener('pointerleave',hide)}
const dayTable=days=>`<div class="tscroll max"><table><thead><tr><th>Tanggal</th><th class="num">Unduhan</th><th class="num">File</th></tr></thead><tbody>${[...days].reverse().map(d=>`<tr><td>${new Date(d.d+'T00:00:00Z').toLocaleDateString('id-ID',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'})}</td><td class="num">${d.n}</td><td class="num">${d.files}</td></tr>`).join('')}</tbody></table></div>`;

/* ===== komponen kecil ===== */
const head=(t,p,acts='')=>`<div class="phead"><div><h1>${t}</h1><p>${p}</p></div>${acts?`<div class="acts">${acts}</div>`:''}</div>`;
const sw=(label,small,path,on,dis)=>`<label class="sw"><span>${label}<small>${small}</small></span><input type="checkbox" role="switch" data-set="${path}" ${on?'checked':''} ${dis?'disabled':''}><span class="knob" aria-hidden="true"></span></label>`;
const tiles=()=>{const st=D.stats,v=x=>st?fmt(x):'–';return `<div class="tiles"><div class="tile"><span>Hari ini</span><b>${v(st&&st.today)}</b></div><div class="tile"><span>7 hari terakhir</span><b>${v(st&&st.week)}</b></div><div class="tile"><span>30 hari terakhir</span><b>${v(st&&st.month)}</b></div><div class="tile"><span>Total sejak awal</span><b>${fmt(D.downloads)}</b><small>strip diunduh</small></div></div>`};
const noLog=()=>`<div class="empty"><h3>Statistik belum aktif</h3><p>Tabel log unduhan belum ada di database. Jalankan <code>npm run migrate</code>, atau tempel isi <code>supabase/schema.sql</code> di SQL Editor Supabase. Aman diulang, data lama tidak berubah.</p></div>`;

/* ===== halaman: ringkasan ===== */
function vRingkasan(){const s=D.settings,st=D.stats,on=s.open,att=attention();
  const li=(t,ok=true)=>`<li class="${ok?'':'off'}">${t}</li>`;
  const cells=[
    ['Foto','#alur',[li(`${s.layouts.length} dari ${LAYS.length} tata letak`),li(`Hitung mundur ${s.countdown} detik${s.instant?', atau langsung':''}`),li('Unggah foto',s.upload),li('Live foto (klip 2 detik)',s.live)]],
    ['Atur foto',null,[li('Filter, kecerahan, kontras, saturasi'),li('Berlaku per foto, selalu aktif')]],
    ['Frame','#template',[li(`${builtinOn(s)} dari ${FRAMES.length} frame bawaan`),li(`${tplActive()} template warna aktif`)]],
    ['Unduh',  '#alur',[li('Frame diam dan foto satuan (PNG)'),li('Frame video, animasi, live foto',s.video)]]];
  const strip=cells.map(([t,h,l],i)=>{const inner=`<h3><b>${i+1}</b>${t}</h3><ul>${l.join('')}</ul>`;return h?`<a class="cell" href="${h}" aria-label="${t}: ubah pengaturan">${inner}</a>`:`<div class="cell">${inner}</div>`}).join('');
  return head('Ringkasan',ROUTES.ringkasan[2])+
  `<section class="ticket ${on?'':'off'}" aria-label="Status situs"><div><h2><i class="lamp" aria-hidden="true"></i>${on?'Situs buka':'Situs tutup'}</h2><p>${on?'Pengunjung bisa memotret, memilih frame, dan mengunduh hasil.':'Halaman foto, atur foto, frame, unduh, dan Connect menampilkan pesan: '+esc(s.closedMessage)}</p></div><button class="btn ${on?'alt':''}" data-act="toggle-open" type="button">${on?'Tutup situs':'Buka situs'}</button></section>`+
  `<div class="strip" role="list" aria-label="Alur pengunjung">${strip}</div><p class="strip-cap">Empat langkah yang dilalui pengunjung. Pilih langkah untuk mengubah pengaturannya.</p>`+
  tiles()+
  `<div class="cols"><section class="card"><div class="ch"><div><h2>Unduhan 14 hari terakhir</h2><p>Satu unduhan berarti satu kali pengunjung menekan Unduh.</p></div><a class="btn alt sm" href="#statistik">Detail</a></div>${st?chart(st.days.slice(-14),180):noLog()}</section>`+
  `<section class="card"><div class="ch"><h2>Perlu perhatian</h2></div>${att.length?`<ul class="todo">${att.map(([k,t,x])=>`<li class="${k}">${ic[k]}<div><b>${t}</b><span>${x}</span></div></li>`).join('')}</ul>`:`<ul class="todo"><li class="ok">${ic.ok}<div><b>Semua beres</b><span>Tidak ada yang perlu dikerjakan.</span></div></li></ul>`}</section></div>`}

/* ===== halaman: template dan frame ===== */
function tplCard(t){const f=plainFrame(t),r=ratio(t.bg,t.ink);
  return `<article class="fc ${t.active?'':'off'}"><div class="pv"><canvas data-f="tpl-${t.id}" aria-label="Pratinjau ${esc(t.name)}"></canvas></div><h3>${esc(t.name)}</h3>
  <div class="meta"><span class="dot" style="background:${t.bg}" title="Latar ${t.bg}"></span><span class="dot" style="background:${t.ink}" title="Teks ${t.ink}"></span><span>${t.bg.toUpperCase()}</span>${r<3?'<span class="tag" style="background:#FBE3EE">Teks sulit dibaca</span>':''}</div>
  <label class="sw"><span>${t.active?'Tampil':'Disembunyikan'}</span><input type="checkbox" role="switch" data-t="${t.id}" ${t.active?'checked':''}><span class="knob" aria-hidden="true"></span></label>
  <div class="row"><button class="btn alt sm" data-act="t-edit" data-k="${t.id}" type="button">Ubah</button><button class="btn alt sm" data-act="t-del" data-k="${t.id}" type="button">Hapus</button></div></article>`}
function frCard(f){const off=draft.hiddenFrames.includes(f.id);
  return `<article class="fc ${off?'off':''}"><div class="pv"><canvas data-f="${f.id}" aria-label="Pratinjau ${esc(f.name)}"></canvas></div><h3>${esc(f.name)}</h3><div class="meta"><span class="tag">${esc(f.cat||'Lainnya')}</span></div>
  <label class="sw"><span>${off?'Disembunyikan':'Tampil'}</span><input type="checkbox" role="switch" data-fr="${f.id}" ${off?'':'checked'}><span class="knob" aria-hidden="true"></span></label></article>`}
function gridHtml(){const m=n=>!q||n.toLowerCase().includes(q);
  if(tab==='warna'){const l=D.templates.filter(t=>m(t.name));
    return l.length?`<div class="fgrid">${l.map(tplCard).join('')}</div>`:`<div class="empty"><h3>${D.templates.length?'Tidak ada yang cocok':'Belum ada template warna'}</h3><p>${D.templates.length?'Coba kata kunci lain.':'Template warna adalah frame polos satu warna. Tambahkan yang pertama.'}</p>${D.templates.length?'':`<button class="btn" data-act="t-add" type="button">${ic.plus}Tambah template</button>`}</div>`}
  const l=FRAMES.filter(f=>m(f.name)||m(f.cat||''));
  return l.length?`<div class="fgrid">${l.map(frCard).join('')}</div>`:`<div class="empty"><h3>Tidak ada yang cocok</h3><p>Coba kata kunci lain.</p></div>`}
function vTemplate(){const hid=draft.hiddenFrames.length;
  return head('Template dan frame',ROUTES.template[2])+
  `<div class="seg" role="group" aria-label="Jenis frame"><button type="button" data-act="tab" data-k="warna" aria-pressed="${tab==='warna'}">Template warna (${D.templates.length})</button><button type="button" data-act="tab" data-k="bawaan" aria-pressed="${tab==='bawaan'}">Frame bawaan (${FRAMES.length-hid}/${FRAMES.length})</button></div>
  <div class="toolbar"><input type="search" id="q" data-q placeholder="${tab==='warna'?'Cari template':'Cari frame'}" value="${esc(q)}" aria-label="Cari" autocomplete="off">
  ${tab==='warna'?`<button class="btn" data-act="t-add" type="button">${ic.plus}Tambah template</button>`:`<span class="muted">Frame bawaan tidak bisa diubah. Sembunyikan yang tidak ingin ditawarkan, lalu simpan.</span>${hid?'<button class="btn alt sm" data-act="fr-all" type="button">Tampilkan semua</button>':''}`}</div>
  <div id="grid">${gridHtml()}</div>`}

/* ===== halaman: alur dan pengaturan ===== */
function vAlur(){const d=draft,cd=d.countdown;
  return head('Alur dan pengaturan',ROUTES.alur[2])+`<div class="cols2"><div class="stack">
  <section class="card"><div class="ch"><div><h2>Status situs</h2><p>Berlaku untuk halaman foto, atur foto, frame, unduh, dan Connect.</p></div></div>
    ${sw('Situs buka','Matikan untuk menutup sementara, misalnya saat perawatan.','open',d.open)}
    <div class="field"><label for="cm" style="margin:0"><b>Pesan saat situs tutup</b></label><p class="muted">Maksimal 200 huruf.</p><textarea id="cm" data-set="closedMessage" maxlength="200">${esc(d.closedMessage)}</textarea></div></section>
  <section class="card"><div class="ch"><div><h2>Pengumuman</h2><p>Bilah di atas semua halaman pengunjung.</p></div></div>
    ${sw('Tampilkan pengumuman','Cocok untuk info acara atau jam buka.','banner.on',d.banner.on)}
    <div class="field"><label for="bt" style="margin:0"><b>Isi pengumuman</b></label><input type="text" id="bt" data-set="banner.text" maxlength="160" value="${esc(d.banner.text)}" placeholder="Contoh: Hari ini photobooth buka sampai pukul 21.00">
      <div class="tone" role="group" aria-label="Warna pengumuman"><button class="chip" type="button" data-act="tone" data-k="info" aria-pressed="${d.banner.tone==='info'}">Biasa</button><button class="chip" type="button" data-act="tone" data-k="warn" aria-pressed="${d.banner.tone==='warn'}">Penting</button></div>
      <div class="bprev" aria-label="Pratinjau"><div class="pbanner ${d.banner.tone}" id="bprev">${esc(d.banner.text)||'Pratinjau pengumuman'}</div></div></div></section></div>
  <div class="stack"><section class="card"><div class="ch"><div><h2>Pengambilan foto</h2><p>Pilihan di langkah 1.</p></div></div>
    <div class="field" style="border:0;padding-top:0"><b>Tata letak yang tersedia</b><p class="muted">Minimal satu. Angka pertama adalah kolom.</p><div class="chips" role="group" aria-label="Tata letak">${LAYS.map(k=>`<button class="chip" type="button" data-act="lay" data-k="${k}" aria-pressed="${d.layouts.includes(k)}">${layIcon(k)}${k.replace('x',' × ')}</button>`).join('')}</div></div>
    <div class="field"><b>Hitung mundur</b><p class="muted">Jeda sebelum foto diambil pada tombol berwaktu.</p><div class="step"><button type="button" data-act="cd-" aria-label="Kurangi" ${cd<=1?'disabled':''}>−</button><output aria-live="polite">${cd} detik</output><button type="button" data-act="cd+" aria-label="Tambah" ${cd>=10?'disabled':''}>+</button></div></div>
    ${sw('Tombol "Langsung"','Ambil foto tanpa hitung mundur.','instant',d.instant)}
    ${sw('Unggah foto dari galeri','Pengunjung bisa memakai foto yang sudah ada.','upload',d.upload)}
    ${sw('Live foto','Rekam klip sekitar 2 detik tiap foto kamera. Memakai memori peramban pengunjung.','live',d.live)}</section>
  <section class="card"><div class="ch"><div><h2>Hasil unduhan</h2><p>Langkah 4.</p></div></div>
    ${sw('Unduhan video','Frame video, animasi foto, dan live foto. PNG tetap tersedia.','video',d.video)}</section>
  <section class="card"><div class="ch"><div><h2>Connect</h2><p>Foto bareng dari beda tempat.</p></div></div>
    ${sw('Fitur Connect aktif','Kalau mati, menu Connect hilang dan halamannya menampilkan pesan.','connect',d.connect)}</section></div></div>`}

/* ===== halaman: statistik ===== */
function vStatistik(){const st=D.stats;
  if(!st)return head('Statistik',ROUTES.statistik[2])+noLog();
  const days=st.days.slice(-range),sum=days.reduce((a,d)=>a+d.n,0),rank=(l,empty)=>l.length?`<ol class="rank">${l.map(r=>`<li><span>${esc(r.name.replace(/^(\d)x(\d)$/,'$1 × $2'))}</span><span>${fmt(r.n)}</span><span class="tr"><i style="width:${Math.round(r.n/l[0].n*100)}%"></i></span></li>`).join('')}</ol>`:`<p class="muted">${empty}</p>`;
  const rec=st.recent,tm=t=>new Date(t).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
  return head('Statistik',ROUTES.statistik[2],`<div class="seg" role="group" aria-label="Rentang waktu">${[7,14,30].map(n=>`<button type="button" data-act="range" data-k="${n}" aria-pressed="${range===n}">${n} hari</button>`).join('')}</div>`)+tiles()+
  `<section class="card" style="margin-bottom:20px"><div class="ch"><div><h2>${fmt(sum)} unduhan dalam ${range} hari terakhir</h2><p>Tanggal mengikuti waktu Jakarta (WIB).</p></div><button class="btn alt sm" type="button" data-act="tbl">${showTbl?'Lihat grafik':'Lihat tabel'}</button></div>${showTbl?dayTable(days):chart(days,220)}</section>
  <div class="cols2" style="margin-bottom:20px"><section class="card"><div class="ch"><div><h2>Frame terpopuler</h2><p>30 hari terakhir</p></div></div>${rank(st.frames,'Belum ada unduhan tercatat.')}</section><section class="card"><div class="ch"><div><h2>Tata letak terpopuler</h2><p>30 hari terakhir</p></div></div>${rank(st.layouts,'Belum ada unduhan tercatat.')}</section></div>
  <section class="card"><div class="ch"><h2>Unduhan terbaru</h2></div>${rec.length?`<div class="tscroll"><table><thead><tr><th>Waktu (WIB)</th><th>Frame</th><th>Tata letak</th><th class="num">File</th></tr></thead><tbody>${rec.map(r=>`<tr><td>${tm(r.at)}</td><td>${esc(r.frame||'-')}</td><td>${r.layout?esc(r.layout.replace('x',' × ')):'-'}</td><td class="num">${r.files}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Belum ada unduhan tercatat.</p>'}</section>
  <p class="muted" style="margin-top:14px">Total sejak awal (${fmt(D.downloads)}) bisa lebih besar dari 30 hari terakhir karena mencakup unduhan lama.</p>`}

/* ===== halaman: sistem ===== */
function leftText(){const ms=D.session.expires-Date.now();if(ms<=0)return 'sudah berakhir';const m=Math.floor(ms/60000);return m>=60?`${Math.floor(m/60)} jam ${m%60} menit lagi`:`${m} menit lagi`}
function vSistem(){const e=D.env,local=e.runtime.startsWith('Lokal'),sl=e.secretLen;
  const c=(k,t,x)=>`<li class="${k}">${ic[k]}<div><b>${t}</b><span>${x}</span></div></li>`;
  const sec=local?c('ok','SESSION_SECRET','Tidak dipakai di server lokal.'):sl>=32?c('ok','SESSION_SECRET','Panjangnya '+sl+' karakter.'):sl>=16?c('warn','SESSION_SECRET kurang panjang','Panjangnya '+sl+' karakter. Disarankan minimal 32.'):c('bad','SESSION_SECRET belum diatur','Login admin tidak akan berfungsi tanpa ini.');
  const pages=[['Beranda','index.html'],['Library template','template.html'],['Ambil foto','foto.html'],['Atur foto','adjust.html'],['Pilih frame','edit.html'],['Unduh hasil','unduh.html'],['Connect','connect.html']];
  return head('Sistem',ROUTES.sistem[2],`<button class="btn" type="button" data-act="backup">${ic.dl}Unduh cadangan</button>`)+`<div class="cols2"><div class="stack">
  <section class="card"><div class="ch"><div><h2>Pemeriksaan</h2><p>Dijalankan di ${esc(e.runtime)}.</p></div></div><ul class="checks">
    ${c('ok','Database terhubung','Data dasbor ini dibaca langsung dari database.')}
    ${D.migrated.settings?c('ok','Tabel pengaturan','Pengaturan situs bisa disimpan.'):c('bad','Tabel pengaturan belum ada','Jalankan <code>npm run migrate</code>.')}
    ${D.migrated.log?c('ok','Tabel log unduhan','Statistik harian aktif.'):c('bad','Tabel log unduhan belum ada','Jalankan <code>npm run migrate</code>.')}
    ${e.adminPass?c('ok','ADMIN_PASS','Kata sandi admin sudah diatur.'):c('bad','ADMIN_PASS belum diatur','Isi di Environment Variables.')}${sec}</ul></section>
  <section class="card"><div class="ch"><div><h2>Sesi admin</h2><p>Masuk berlaku 8 jam, lalu perlu masuk lagi.</p></div></div><p>Sesi berakhir <b id="sess">${leftText()}</b>.</p>${D.session.expires?`<p class="muted">Pukul ${new Date(D.session.expires).toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit'})} WIB</p>`:''}<p class="muted" style="margin-top:10px">Nama pengguna dan kata sandi diubah lewat Environment Variables, lalu deploy ulang.</p></section></div>
  <div class="stack"><section class="card"><div class="ch"><div><h2>Pintasan halaman</h2><p>Dibuka di tab baru.</p></div></div><div class="links">${pages.map(([t,h])=>`<a href="${h}" target="_blank" rel="noopener">${t}${ic.ext}</a>`).join('')}</div></section>
  <section class="card"><div class="ch"><div><h2>Cadangan data</h2><p>Berkas JSON berisi template, pengaturan, dan statistik harian.</p></div></div><p class="muted">Foto pengunjung tidak pernah dikirim ke server, jadi tidak ada di cadangan.</p></section></div></div>`}

/* ===== aksi ===== */
async function quickSave(patch){try{const was=dirty(),r=await api('/api/admin/settings',{method:'PUT',body:{...D.settings,...patch}});D=r;if(!was)draft=clone(D.settings);else Object.assign(draft,patch);render();toast(patch.open===false?'Situs ditutup':patch.open===true?'Situs dibuka':'Disimpan')}catch(e){fail(e)}}
async function tplCall(url,opt,msg){try{apply(await api(url,opt));render(true);if(msg)toast(msg)}catch(e){fail(e)}}
const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
view.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,k=b.dataset.k;
  if(a==='toggle-open'){const open=!D.settings.open;if(!open&&!await ask('Tutup situs?','Pengunjung yang membuka halaman foto, atur foto, frame, unduh, atau Connect akan melihat pesan tutup. Yang sedang memotret terkena saat pindah halaman.','Tutup situs'))return;quickSave({open})}
  else if(a==='lay'){const i=draft.layouts.indexOf(k);if(i>=0){if(draft.layouts.length===1)return toast('Minimal satu tata letak harus aktif','bad');draft.layouts.splice(i,1)}else draft.layouts=LAYS.filter(x=>x===k||draft.layouts.includes(x));render(true)}
  else if(a==='cd-'||a==='cd+'){draft.countdown=Math.min(10,Math.max(1,draft.countdown+(a==='cd+'?1:-1)));render(true)}
  else if(a==='tone'){draft.banner.tone=k;render(true)}
  else if(a==='tab'){tab=k;q='';render()}
  else if(a==='range'){range=+k;render(true)}
  else if(a==='tbl'){showTbl=!showTbl;render(true)}
  else if(a==='fr-all'){draft.hiddenFrames=[];render(true)}
  else if(a==='t-add')openT(null);
  else if(a==='t-edit')openT(D.templates.find(t=>t.id===k));
  else if(a==='t-del'){const t=D.templates.find(x=>x.id===k);if(await ask('Hapus template?',`"${t.name}" dihapus permanen. Untuk sekadar menyembunyikan, matikan saklar Tampil.`,'Hapus'))tplCall('/api/admin/templates/'+k,{method:'DELETE'},'Template dihapus')}
  else if(a==='backup'){const j={dibuat:new Date().toISOString(),totalUnduhan:D.downloads,pengaturan:D.settings,template:D.templates,unduhanHarian:D.stats&&D.stats.days};
    const u=URL.createObjectURL(new Blob([JSON.stringify(j,null,2)],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download='photobooth-cadangan-'+j.dibuat.slice(0,10)+'.json';document.body.append(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);toast('Cadangan diunduh')}});
view.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.t!==undefined)tplCall('/api/admin/templates/'+t.dataset.t,{method:'PATCH',body:{active:t.checked}},t.checked?'Template ditampilkan':'Template disembunyikan');
  else if(t.dataset.fr!==undefined){const h=draft.hiddenFrames,i=h.indexOf(t.dataset.fr);t.checked?(i>=0&&h.splice(i,1)):(i<0&&h.push(t.dataset.fr));render(true)}
  else if(t.dataset.set&&t.type==='checkbox'){setPath(draft,t.dataset.set,t.checked);render(true)}});
view.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.q!==undefined){q=t.value.trim().toLowerCase();$('#grid').innerHTML=gridHtml();paint($('#grid'))}
  else if(t.dataset.set&&t.type!=='checkbox'){setPath(draft,t.dataset.set,t.value);$('#savebar').hidden=!dirty();if(t.dataset.set==='banner.text'){const p=$('#bprev');if(p)p.textContent=t.value||'Pratinjau pengumuman'}}});
$('#save').onclick=async()=>{const b=$('#save');b.disabled=true;try{apply(await api('/api/admin/settings',{method:'PUT',body:draft}));draft=clone(D.settings);render(true);toast('Pengaturan disimpan')}catch(e){fail(e)}b.disabled=false};
$('#undo').onclick=()=>{draft=clone(D.settings);render(true)};
addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue=''}});

/* ===== dialog template ===== */
const hexOk=v=>/^#[0-9a-f]{6}$/i.test(v);
function tCols(b,i){$('#tb').value=b;$('#tbh').value=b.toUpperCase();$('#ti').value=i;$('#tih').value=i.toUpperCase();tPrev()}
async function tPrev(){const b=$('#tb').value,i=$('#ti').value,r=ratio(b,i),k=r>=4.5?'ok':r>=3?'warn':'bad';
  const el=$('#tcon');el.className='contrast '+k;el.textContent=`Kontras ${r.toFixed(1).replace('.',',')} : 1. ${k==='ok'?'Teks mudah dibaca.':k==='warn'?'Cukup untuk teks besar saja.':'Teks sulit dibaca, ubah warna teks.'}`;
  $('#tsw').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.c.toLowerCase()===b.toLowerCase()));
  try{await document.fonts.ready}catch{}SAMP=SAMP||[0,1].map(sample);
  renderStrip($('#tcv'),{lay:'1x2',photos:SAMP,adj:[adjOf(),adjOf()],frame:plainFrame({id:'x',name:$('#tn').value,bg:b,ink:i}),s:.4})}
function openT(t){editing=t;$('#tdT').textContent=t?'Ubah template':'Tambah template';$('#tsave').textContent=t?'Simpan perubahan':'Simpan template';$('#terr').hidden=true;$('#tn').value=t?t.name:'';
  $('#tsw').innerHTML=SW.map(c=>`<button type="button" data-c="${c}" style="background:${c}" aria-label="Latar ${c}" aria-pressed="false"></button>`).join('');
  tCols(t?t.bg:'#DBE2F8',t?t.ink:'#1E2D5A');$('#tdlg').showModal();$('#tn').focus()}
$('#tsw').onclick=e=>{const b=e.target.closest('button');if(b)tCols(b.dataset.c,inkFor(b.dataset.c))};
for(const [c,h] of [['#tb','#tbh'],['#ti','#tih']]){$(c).oninput=()=>{$(h).value=$(c).value.toUpperCase();tPrev()};$(h).oninput=()=>{let v=$(h).value.trim();if(v&&v[0]!=='#')v='#'+v;if(hexOk(v)){$(c).value=v;tPrev()}}}
$('#tn').oninput=()=>tPrev();
$('#tcancel').onclick=()=>$('#tdlg').close();
$('#tform').onsubmit=async e=>{e.preventDefault();const body={name:$('#tn').value.trim(),bg:$('#tb').value,ink:$('#ti').value},er=$('#terr');er.hidden=true;
  if(!body.name){er.textContent='Nama template wajib diisi.';er.hidden=false;return}
  $('#tsave').disabled=true;
  try{apply(await api(editing?'/api/admin/templates/'+editing.id:'/api/admin/templates',{method:editing?'PATCH':'POST',body}));$('#tdlg').close();tab='warna';q='';render();toast(editing?'Template diperbarui':'Template ditambahkan')}
  catch(x){if(x.status===401){$('#tdlg').close();fail(x)}else{er.textContent=x.message;er.hidden=false}}
  $('#tsave').disabled=false};

/* ===== masuk, keluar, rute ===== */
const show=on=>{$('#login').hidden=!!on;$('#app').hidden=!on;if(!on){D=null;draft=null}};
async function refresh(){if(!D||!['ringkasan','statistik'].includes(route))return;try{apply(await api('/api/admin/data'));render(true)}catch(e){if(e.status===401)fail(e)}}
function go(){const r=location.hash.slice(1);route=ROUTES[r]?r:'ringkasan';if(D){q='';render();view.focus({preventScroll:true});scrollTo(0,0);refresh()}}
setInterval(refresh,60000);
addEventListener('hashchange',go);
async function boot(){try{apply(await api('/api/admin/data'));show(true);route=ROUTES[location.hash.slice(1)]?location.hash.slice(1):'ringkasan';render()}
  catch(e){show(false);if(e.status&&e.status!==401){$('#err').textContent=e.message;$('#err').hidden=false}}}
setInterval(()=>{if(!D)return;if(D.session.expires&&D.session.expires<=Date.now()){show(false);$('#err').textContent='Sesi habis. Masuk lagi untuk melanjutkan.';$('#err').hidden=false;return}const s=$('#sess');if(s)s.textContent=leftText()},30000);
$('#form').onsubmit=async e=>{e.preventDefault();$('#err').hidden=true;$('#go').disabled=true;
  try{await api('/api/admin/login',{method:'POST',body:{user:$('#u').value,pass:$('#p').value}});$('#p').value='';await boot()}
  catch(x){$('#err').textContent=x.message;$('#err').hidden=false}$('#go').disabled=false};
const out=async()=>{if(dirty()&&!await ask('Keluar tanpa menyimpan?','Ada perubahan pengaturan yang belum disimpan. Kalau keluar, perubahan itu hilang.','Keluar'))return;draft=D&&clone(D.settings);await api('/api/admin/logout',{method:'POST'}).catch(()=>{});show(false)};
$('#out').onclick=out;$('#out2').onclick=out;
$('#eye').onclick=()=>{const p=$('#p'),on=p.type==='password';p.type=on?'text':'password';$('#eye').setAttribute('aria-pressed',on);$('#eye').setAttribute('aria-label',on?'Sembunyikan kata sandi':'Tampilkan kata sandi')};
boot();
