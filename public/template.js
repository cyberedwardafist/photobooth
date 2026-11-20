/* Etalase frame: pakai foto contoh. Klik frame -> simpan pilihan lalu langsung ke ambil foto. */
(async()=>{await document.fonts.ready;await SETP;const lay='1x4',imgs=Array.from({length:4},(_,i)=>sample(i)),adj=imgs.map(()=>adjOf());
  const gal=Gallery({lay,imgs,adj,cta:'Pakai frame ini',onPick:f=>{setState({frame:f,bg:undefined,ink:undefined});pbSkip();location.href='/foto'}});
  gal.add(visibleFrames());gal.loadTpls()})();
$('#plain').addEventListener('click',()=>setState({frame:undefined,bg:undefined,ink:undefined}));
