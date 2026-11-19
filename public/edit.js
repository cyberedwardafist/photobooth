loadStrip().then(s=>{const saved=s.st.frame||(s.st.bg?frameOf(s.st):null);
  const list=[...FRAMES];if(saved&&!list.some(f=>f.id===saved.id))list.unshift(saved);
  let cur=list.find(f=>f.id===(saved&&saved.id))||FRAMES[0];
  const show=f=>{$('#picked').textContent=f.name};
  const gal=Gallery({lay:s.lay,imgs:s.imgs,adj:s.adj,cur,onPick:f=>{cur=f;setState({frame:f,bg:undefined,ink:undefined});pbSync({frame:f});show(f)}});
  show(cur);$('#msg').hidden=true;$('#ui').hidden=false;gal.add(list);gal.loadTpls();if(PBR)PBR.hook={sync:p=>{if(p.frame){cur=p.frame;gal.select(cur);show(cur)}},ev:remoteEv}}).catch(stripError);

/* Connect: kategori, pencarian, dan posisi gulir ikut tersinkron (gulir: host menggerakkan, tamu mengikuti) */
let rm=false;
function remoteEv(n,d){rm=true;try{
  if(n==='cat'){const b=document.querySelector('[data-c="'+d+'"]');if(b)b.click()}
  else if(n==='q'){const q=$('#q');q.value=d;q.dispatchEvent(new Event('input'))}
  else if(n==='scroll'&&PBR.role==='guest'){const w=window.parent,h=w.document.documentElement;w.scrollTo(0,d*Math.max(0,h.scrollHeight-w.innerHeight))}}finally{rm=false}}
if(PBR){$('#cats').addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(b&&!rm)pbEv('cat',b.dataset.c)});
  $('#q').addEventListener('input',e=>{if(!rm)pbEv('q',e.target.value)});
  if(PBR.role==='host'){const w=window.parent;let t=0;const f=()=>{if(t)return;t=setTimeout(()=>{t=0;const h=w.document.documentElement;pbEv('scroll',w.scrollY/Math.max(1,h.scrollHeight-w.innerHeight))},120)};
    w.addEventListener('scroll',f,{passive:true});window.addEventListener('pagehide',()=>w.removeEventListener('scroll',f))}}
