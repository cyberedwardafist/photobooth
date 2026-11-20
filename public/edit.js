Promise.all([loadStrip(),SETP]).then(([s])=>{const saved=s.st.frame||(s.st.bg?frameOf(s.st):null);
  const list=[...visibleFrames()];if(saved&&!list.some(f=>f.id===saved.id))list.unshift(saved);
  let cur=list.find(f=>f.id===(saved&&saved.id))||FRAMES[0];
  const show=f=>{$('#picked').textContent=f.name};
  const gal=Gallery({lay:s.lay,imgs:s.imgs,adj:s.adj,cur,onPick:f=>{cur=f;setState({frame:f,bg:undefined,ink:undefined});pbSync({frame:f});show(f)}});
  show(cur);$('#msg').hidden=true;$('#ui').hidden=false;gal.add(list);gal.loadTpls();if(PBR)PBR.hook={sync:p=>{if(p.frame){cur=p.frame;gal.select(cur);show(cur)}},ev:remoteEv}}).catch(stripError);

/* Connect: kategori dan pencarian ikut tersinkron dua arah (gulir diurus halaman induk, connect.js) */
let rm=false;
function remoteEv(n,d){rm=true;try{
  if(n==='cat'){const b=document.querySelector('[data-c="'+d+'"]');if(b)b.click()}
  else if(n==='q'){const q=$('#q');q.value=d;q.dispatchEvent(new Event('input'))}}finally{rm=false}}
if(PBR){$('#cats').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(b&&!rm)pbEv('cat',b.dataset.c)});
  $('#q').addEventListener('input',e=>{if(!rm)pbEv('q',e.target.value)});}
