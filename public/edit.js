loadStrip().then(s=>{const saved=s.st.frame||(s.st.bg?frameOf(s.st):null);
  const list=[...FRAMES];if(saved&&!list.some(f=>f.id===saved.id))list.unshift(saved);
  let cur=list.find(f=>f.id===(saved&&saved.id))||FRAMES[0];
  const show=f=>{$('#picked').textContent=f.name};
  const gal=Gallery({lay:s.lay,imgs:s.imgs,adj:s.adj,cur,onPick:f=>{cur=f;setState({frame:f,bg:undefined,ink:undefined});show(f)}});
  show(cur);$('#msg').hidden=true;$('#ui').hidden=false;gal.add(list);gal.loadTpls()}).catch(stripError);
