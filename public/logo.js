// Klik logo: di beranda menggulung ke atas dengan kilatan blitz kamera; di halaman lain pindah ke beranda.
(()=>{
  const a=document.querySelector('a.logo');if(!a)return;
  const home=/(^|\/)(index\.html)?$/.test(location.pathname);
  a.addEventListener('click',e=>{
    if(!home)return;
    e.preventDefault();
    window.scrollTo({top:0,behavior:'smooth'});
    const f=document.createElement('div');f.className='pb-flash';document.body.appendChild(f);
    setTimeout(()=>f.remove(),700);
    if(location.hash)history.replaceState(null,'',location.pathname);
  });
})();
