const st=getState(),lay=LAY[st.lay]?st.lay:'1x4';
let imgs=[],bg=st.bg||'#F5E6D5',ink=st.ink||inkFor(bg),filt=FIL[st.filt]?st.filt:'none';
const draw=()=>renderStrip($('#out'),{lay,photos:imgs,bg,ink,filt});
const keep=()=>setState({bg,ink,filt});
function drawSw(){$('#sw').innerHTML=SW.map(s=>`<button class="chip" data-s="${s}" aria-label="Warna ${s}" aria-pressed="${s.toLowerCase()===bg.toLowerCase()}"><span class="dot" style="background:${s}"></span></button>`).join('');
  document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{bg=b.dataset.s;ink=inkFor(bg);keep();drawSw();draw()})}
function drawFil(){$('#fil').innerHTML=Object.entries(FIL).map(([k,v])=>`<button class="chip" data-f="${k}" aria-pressed="${k===filt}" ${canFilter||k==='none'?'':'disabled'}>${v[0]}</button>`).join('');
  $('#filNote').hidden=canFilter;document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{filt=b.dataset.f;keep();drawFil();draw()})}
async function loadTpls(){const box=$('#tpls');box.innerHTML='<div class="state">Memuat template...</div>';
  try{const list=await fetchTpls();
    if(!list.length){box.innerHTML='<div class="state">Belum ada template aktif. Pakai warna latar di bawah.</div>';return}
    box.innerHTML=list.map(t=>`<button class="chip" data-t="${esc(t.id)}"><span class="dot" style="background:${esc(t.bg)}"></span>${esc(t.name)}</button>`).join('');
    box.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const t=list.find(x=>x.id===b.dataset.t);bg=t.bg;ink=t.ink;keep();drawSw();draw()})}
  catch{box.innerHTML='<div class="state">Template gagal dimuat. <button class="btn alt" id="again">Coba lagi</button></div>';$('#again').onclick=loadTpls}}
$('#dl').onclick=()=>{$('#out').toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='photobooth-strip.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);fetch('/api/download',{method:'POST'}).catch(()=>{})},'image/png')};
(async()=>{const n=LAY[lay][0]*LAY[lay][1],raw=(st.photos||[]).slice(0,n);
  if(raw.length<n||raw.some(x=>!x)){$('#msgT').textContent='Strip belum lengkap. Isi semua slot foto dulu, lalu kembali ke sini.';$('#msgA').hidden=false;return}
  try{imgs=await Promise.all(raw.map(dataToCanvas));await document.fonts.ready}
  catch{$('#msgT').textContent='Foto gagal dibaca dari penyimpanan peramban. Ambil fotonya lagi.';$('#msgA').hidden=false;return}
  $('#msg').hidden=true;$('#ui').hidden=false;drawSw();drawFil();draw();loadTpls()})();
