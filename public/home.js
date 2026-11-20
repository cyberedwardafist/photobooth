/* Mulai dari Home = tanpa frame pilihan */
document.querySelectorAll('a[href="foto.html"]').forEach(a=>a.addEventListener('click',()=>setState({frame:undefined,bg:undefined,ink:undefined})));
SETP.then(()=>{$('#nFrames').textContent=visibleFrames().length});
/* muncul perlahan saat di-scroll (dimatikan bila pengguna memilih kurangi gerakan) */
{const rv=document.querySelectorAll('.rv'),reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
 if(reduce||!('IntersectionObserver'in window))rv.forEach(e=>e.classList.add('in'));
 else{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});rv.forEach(e=>io.observe(e))}}
/* deretan frame berjalan, digambar dari desain frame yang sama dengan aplikasi */
(async()=>{try{await document.fonts.ready}catch{}await SETP;
  const lay='1x3',imgs=Array.from({length:3},(_,i)=>sample(i)),adj=imgs.map(()=>adjOf()),track=$('#mtrack'),cv=document.createElement('canvas');
  const items=visibleFrames().map((f,i)=>{renderStrip(cv,{lay,photos:imgs,adj,frame:f,s:.5});
    const fig=document.createElement('figure');fig.className='mitem';fig.style.setProperty('--r',(i%2?1.8:-1.8)+'deg');
    const im=new Image();im.src=cv.toDataURL('image/png');im.alt='Frame '+f.name;im.width=cv.width;im.height=cv.height;
    const cap=document.createElement('figcaption');cap.textContent=f.name;fig.append(im,cap);return fig});
  items.forEach(n=>track.append(n));
  items.forEach(n=>{const c=n.cloneNode(true);c.setAttribute('aria-hidden','true');c.querySelector('img').alt='';track.append(c)})})();
document.getElementById("yr").textContent=new Date().getFullYear();
