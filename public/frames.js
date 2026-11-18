/* Pustaka frame. g=jarak/tepi, r=sudut foto, bw/bc=bingkai foto, sh=bayangan, pat=pola latar, pc=warna pola, ob=garis tepi strip */
const FRAMES=[
 {id:'krem',name:'Krem Stasiun',bg:'#F5E6D5',ink:'#1E2D5A'},
 {id:'langit',name:'Langit Pagi',bg:'#DBE2F8',ink:'#1E2D5A',pat:'dots',pc:'rgba(255,255,255,.85)',g:36,r:10},
 {id:'sakura',name:'Sakura',bg:'#E6A5C3',ink:'#3B1630',pat:'hearts',pc:'rgba(255,255,255,.55)',g:36,r:14,bw:4,bc:'#FFFFFF'},
 {id:'laut',name:'Laut Biru',bg:'#83C2F8',ink:'#10285A',pat:'stripes',pc:'rgba(255,255,255,.35)',g:34,r:4},
 {id:'teal',name:'Gerbong Teal',bg:'#57A9B4',ink:'#0B2F35',pat:'checker',pc:'rgba(255,255,255,.2)',g:34,r:4},
 {id:'film',name:'Roll Film',bg:'#17181C',ink:'#F5E6D5',pat:'film',pc:'#F5E6D5',g:46,r:3},
 {id:'polaroid',name:'Polaroid',bg:'#FFFFFF',ink:'#1E2D5A',g:42,r:2,sh:1,ob:{w:3,c:'#DFE3EE'}},
 {id:'bintang',name:'Langit Malam',bg:['#1E2D5A','#5B3A8C'],ink:'#FFFFFF',pat:'stars',pc:'rgba(255,255,255,.8)',g:34,r:10},
 {id:'senja',name:'Senja',bg:['#FFD9B5','#F4A3C0'],ink:'#5A1F3D',g:34,r:22,bw:4,bc:'#FFFFFF',sh:1},
 {id:'matcha',name:'Matcha',bg:'#CFE3B4',ink:'#2D4A1E',pat:'dots',pc:'#A9CF7C',g:36,r:26},
 {id:'retro',name:'Kotak Retro',bg:'#FBEBD3',ink:'#6B2D12',pat:'checker',pc:'rgba(240,160,100,.35)',g:36,bw:5,bc:'#6B2D12'},
 {id:'mono',name:'Monokrom',bg:'#FFFFFF',ink:'#000000',g:30,bw:6,bc:'#000000'}
];
const FR0={g:28,r:0,pat:'none',bw:0,sh:0,ink:'#1E2D5A',bg:'#F5E6D5'};
const frameFull=f=>({...FR0,...f});
const plainFrame=t=>({id:'tpl-'+t.id,name:t.name,bg:t.bg,ink:t.ink});
const frameOf=st=>frameFull(st.frame||(st.bg?{id:'old',name:'Warna',bg:st.bg,ink:st.ink||inkFor(st.bg)}:FRAMES[0]));
const stripSize=(lay,f)=>{const [c,r]=LAY[lay],g=frameFull(f).g;return{W:c*360+(c+1)*g,H:r*270+(r+1)*g+110}};
function rr(x,a,b,w,h,r){r=Math.min(r,w/2,h/2);x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function heart(x,cx,cy,s){x.beginPath();x.moveTo(cx,cy+s*.9);x.bezierCurveTo(cx-s*1.6,cy-s*.1,cx-s*.7,cy-s*1.1,cx,cy-s*.4);x.bezierCurveTo(cx+s*.7,cy-s*1.1,cx+s*1.6,cy-s*.1,cx,cy+s*.9);x.fill()}
function sparkle(x,cx,cy,s){x.beginPath();x.moveTo(cx,cy-s);x.quadraticCurveTo(cx,cy,cx+s,cy);x.quadraticCurveTo(cx,cy,cx,cy+s);x.quadraticCurveTo(cx,cy,cx-s,cy);x.quadraticCurveTo(cx,cy,cx,cy-s);x.fill()}
function pattern(x,f,W,H){if(f.pat==='none')return;x.save();x.fillStyle=f.pc;x.strokeStyle=f.pc;
  let seed=7;const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
  if(f.pat==='dots'){for(let j=0;j*26<H+26;j++)for(let i=0;i*26<W+26;i++){x.beginPath();x.arc(i*26+(j%2?13:0),j*26,4,0,7);x.fill()}}
  else if(f.pat==='stripes'){x.lineWidth=14;for(let k=-H;k<W+H;k+=34){x.beginPath();x.moveTo(k,0);x.lineTo(k+H,H);x.stroke()}}
  else if(f.pat==='checker'){for(let j=0;j*32<H;j++)for(let i=0;i*32<W;i++)if((i+j)%2)x.fillRect(i*32,j*32,32,32)}
  else if(f.pat==='film'){for(let y=18;y<H-10;y+=36){for(const cx of[f.g/2,W-f.g/2]){rr(x,cx-7,y,14,20,4);x.fill()}}}
  else if(f.pat==='hearts'||f.pat==='stars'){const n=Math.round(W*H/4200);for(let k=0;k<n;k++){const px=rnd()*W,py=rnd()*H,sz=8+rnd()*12;f.pat==='hearts'?heart(x,px,py,sz*.8):sparkle(x,px,py,sz)}}
  x.restore()}
function renderStrip(cv,o){const f=frameFull(o.frame),[c]=LAY[o.lay],w=360,h=270,g=f.g,{W,H}=stripSize(o.lay,f),s=o.s||1;
  cv.width=Math.round(W*s);cv.height=Math.round(H*s);const x=cv.getContext('2d');x.scale(cv.width/W,cv.height/H);
  if(Array.isArray(f.bg)){const gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,f.bg[0]);gr.addColorStop(1,f.bg[1]);x.fillStyle=gr}else x.fillStyle=f.bg;
  x.fillRect(0,0,W,H);pattern(x,f,W,H);
  if(f.ob){x.strokeStyle=f.ob.c;x.lineWidth=f.ob.w;x.strokeRect(f.ob.w/2,f.ob.w/2,W-f.ob.w,H-f.ob.w)}
  o.photos.forEach((p,i)=>{if(!p)return;const px=g+(i%c)*(w+g),py=g+Math.floor(i/c)*(h+g);
    if(f.sh){x.save();x.shadowColor='rgba(30,45,90,.35)';x.shadowBlur=16;x.shadowOffsetY=5;x.fillStyle='#000';rr(x,px,py,w,h,f.r);x.fill();x.restore()}
    x.save();rr(x,px,py,w,h,f.r);x.clip();drawPhoto(x,p,o.adj&&o.adj[i],px,py,w,h);x.restore();
    if(f.bw){x.strokeStyle=f.bc||f.ink;x.lineWidth=f.bw;rr(x,px+f.bw/2,py+f.bw/2,w-f.bw,h-f.bw,Math.max(0,f.r-f.bw/2));x.stroke()}});
  x.fillStyle=f.ink;x.textAlign='center';x.font='600 36px Fredoka,sans-serif';x.fillText('photobooth',W/2,H-62);
  x.font='700 22px Nunito,sans-serif';x.fillText(new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}),W/2,H-26)}
