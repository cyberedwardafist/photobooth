/* foto contoh bila pengunjung belum punya foto */
const sample=i=>{const c=document.createElement('canvas');c.width=640;c.height=480;const x=c.getContext('2d'),P=['#C9D6F2','#F2D9C9','#D3E6CB','#EBCFE0'],g=x.createLinearGradient(0,0,640,480);
  g.addColorStop(0,P[i%4]);g.addColorStop(1,'#FFFFFF');x.fillStyle=g;x.fillRect(0,0,640,480);
  x.fillStyle='rgba(30,45,90,.35)';x.beginPath();x.arc(320,205,78,0,7);x.fill();x.beginPath();x.ellipse(320,480,170,150,0,Math.PI,0);x.fill();return c};
(async()=>{let lay,imgs,adj,has=false;
  try{const s=await loadStrip();({lay,imgs,adj}=s);has=true}
  catch{const st=getState();lay=LAY[st.lay]?st.lay:'1x4';await document.fonts.ready;imgs=Array.from({length:LAY[lay][0]*LAY[lay][1]},(_,i)=>sample(i));adj=imgs.map(()=>adjOf())}
  $('#sampleNote').hidden=has;
  const go=$('#go'),saved=getState().frame||null,list=[...FRAMES];if(saved&&!list.some(f=>f.id===saved.id))list.unshift(saved);
  const choose=f=>{$('#picked').textContent=f.name;go.removeAttribute('aria-disabled');go.href=has?'edit.html':'foto.html';go.textContent=has?'Pakai frame ini':'Pakai & mulai memotret'};
  const cur=saved&&list.find(f=>f.id===saved.id)||null;if(cur)choose(cur);
  const gal=Gallery({lay,imgs,adj,cur,onPick:f=>{setState({frame:f,bg:undefined,ink:undefined});choose(f)}});
  gal.add(list);gal.loadTpls()})();
