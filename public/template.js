/* Etalase frame: pakai foto contoh. Klik frame -> simpan pilihan lalu langsung ke ambil foto. */
const sample=i=>{const c=document.createElement('canvas');c.width=640;c.height=480;const x=c.getContext('2d'),P=['#C9D6F2','#F2D9C9','#D3E6CB','#EBCFE0'],g=x.createLinearGradient(0,0,640,480);
  g.addColorStop(0,P[i%4]);g.addColorStop(1,'#FFFFFF');x.fillStyle=g;x.fillRect(0,0,640,480);
  x.fillStyle='rgba(30,45,90,.35)';x.beginPath();x.arc(320,205,78,0,7);x.fill();x.beginPath();x.ellipse(320,480,170,150,0,Math.PI,0);x.fill();return c};
(async()=>{await document.fonts.ready;const lay='1x4',imgs=Array.from({length:4},(_,i)=>sample(i)),adj=imgs.map(()=>adjOf());
  const gal=Gallery({lay,imgs,adj,cta:'Pakai frame ini',onPick:f=>{setState({frame:f,bg:undefined,ink:undefined});pbSkip();location.href='foto.html'}});
  gal.add(FRAMES);gal.loadTpls()})();
$('#plain').addEventListener('click',()=>setState({frame:undefined,bg:undefined,ink:undefined}));
