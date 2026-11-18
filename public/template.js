async function load(){const g=$('#grid');g.innerHTML='<div class="state">Memuat template...</div>';
  try{const list=await fetchTpls();
    if(!list.length){g.innerHTML='<div class="state">Belum ada template aktif. Admin bisa menambahkannya dari halaman admin.</div>';return}
    g.innerHTML=list.map(t=>`<div class="tcard"><div class="mini" style="background:${esc(t.bg)};color:${esc(t.ink)}"><i></i><i></i><i></i><i></i><b>photobooth</b></div><h3>${esc(t.name)}</h3><button class="btn" data-t="${esc(t.id)}">Pakai template ini</button></div>`).join('');
    g.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const t=list.find(x=>x.id===b.dataset.t);setState({frame:plainFrame(t),bg:undefined,ink:undefined});location.href="edit.html"})}
  catch{g.innerHTML='<div class="state">Template gagal dimuat. <button class="btn alt" id="again">Coba lagi</button></div>';$('#again').onclick=load}}
load();
