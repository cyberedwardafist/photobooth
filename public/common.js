const $=s=>document.querySelector(s);
const LAY={'1x2':[1,2],'1x3':[1,3],'1x4':[1,4],'2x2':[2,2],'2x3':[2,3],'3x3':[3,3],'1x1':[1,1]};
const FIL={none:['Tanpa','none'],sepia:['Sepia','sepia(.8)'],mono:['Hitam putih','grayscale(1)'],warm:['Hangat','saturate(1.2) sepia(.25) hue-rotate(-10deg)'],cool:['Sejuk','saturate(1.1) hue-rotate(15deg) brightness(1.05)']};
const SW=['#FFFFFF','#F5E6D5','#DBE2F8','#83C2F8','#E6A5C3','#57A9B4','#1E2D5A'];
const canFilter='filter' in CanvasRenderingContext2D.prototype;
const lum=h=>{const c=[1,3,5].map(i=>{const v=parseInt(h.slice(i,i+2),16)/255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const inkFor=h=>lum(h)>.25?'#1E2D5A':'#FFFFFF';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='pb_state';
const getState=()=>{try{return JSON.parse(sessionStorage.getItem(KEY))||{}}catch{return{}}};
const setState=p=>{try{sessionStorage.setItem(KEY,JSON.stringify({...getState(),...p}))}catch{alert('Penyimpanan peramban penuh atau dimatikan, jadi foto tidak akan terbawa ke halaman berikutnya.')}};
const dataToCanvas=u=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=640;c.height=480;c.getContext('2d').drawImage(i,0,0,640,480);ok(c)};i.onerror=no;i.src=u});
const fetchTpls=async()=>{const r=await fetch('/api/templates');if(!r.ok)throw new Error('gagal');return r.json()};
function renderStrip(cv,o){const [c,r]=LAY[o.lay],w=360,h=270,g=28,cap=110;cv.width=c*w+(c+1)*g;cv.height=r*h+(r+1)*g+cap;
  const x=cv.getContext('2d');x.fillStyle=o.bg;x.fillRect(0,0,cv.width,cv.height);
  o.photos.forEach((p,i)=>{const px=g+(i%c)*(w+g),py=g+Math.floor(i/c)*(h+g);
    if(p){x.filter=canFilter?FIL[o.filt][1]:'none';x.drawImage(p,px,py,w,h);x.filter='none'}});
  x.fillStyle=o.ink;x.textAlign='center';x.font='600 36px Fredoka,sans-serif';x.fillText('photobooth',cv.width/2,cv.height-62);
  x.font='700 22px Nunito,sans-serif';x.fillText(new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}),cv.width/2,cv.height-26)}
