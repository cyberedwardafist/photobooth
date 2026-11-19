let S,list=[],cur,cat='Semua',q='';
const cards=new Map(),catOf=f=>f.cat||'Lainnya';
const sizeMin=a=>a<.6?190:a<1.1?250:340;
/* kartu digambar saat mendekati layar, supaya ratusan frame tetap ringan */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;const c=cards.get(e.target.dataset.id);if(c&&!c.done)render(c)}),{rootMargin:'700px 0px'});
function render(c){const {W}=stripSize(S.lay,c.f);renderStrip(c.el.querySelector('canvas'),{lay:S.lay,photos:S.imgs,adj:S.adj,frame:c.f,s:Math.min(1,440/W)});c.done=true}
function card(f){const {W,H}=stripSize(S.lay,f),s=Math.min(1,440/W),el=document.createElement('button');el.className='fcard';el.dataset.id=f.id;
  el.innerHTML=`<span class="fprev"><canvas aria-hidden="true"></canvas></span><span class="fname">${esc(f.name)}</span>`;
  const cv=el.querySelector('canvas');cv.width=Math.round(W*s/2)*2;cv.height=Math.round(H*s/2)*2;
  el.onclick=()=>pick(f);cards.set(f.id,{f,el,done:false});io.observe(el);return el}
function mark(){cards.forEach(({el,f})=>el.setAttribute('aria-pressed',f.id===cur.id));$('#picked').textContent=cur.name}
function pick(f){cur=f;setState({frame:f,bg:undefined,ink:undefined});mark()}
function apply(){let n=0;cards.forEach(({f,el})=>{const ok=(cat==='Semua'||catOf(f)===cat)&&(!q||f.name.toLowerCase().includes(q));el.hidden=!ok;if(ok)n++});
  $('#fcount').textContent=`${n} frame`;$('#fempty').hidden=n>0}
function drawCats(){const m=new Map();cards.forEach(({f})=>m.set(catOf(f),(m.get(catOf(f))||0)+1));
  if(cat!=='Semua'&&!m.has(cat))cat='Semua';
  $('#cats').innerHTML=[['Semua',cards.size],...m].map(([k,n])=>`<button class="chip" data-c="${esc(k)}" aria-pressed="${k===cat}">${esc(k)} <span class="cnt">${n}</span></button>`).join('');
  document.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{cat=b.dataset.c;document.querySelectorAll('[data-c]').forEach(x=>x.setAttribute('aria-pressed',x===b));apply()})}
$('#q').oninput=e=>{q=e.target.value.trim().toLowerCase();apply()};
function add(frames){const g=$('#fgrid');frames.forEach(f=>{if(!cards.has(f.id))g.append(card(f))});mark();drawCats();apply()}
async function loadTpls(){$('#tplNote').hidden=true;
  try{const l=await fetchTpls(),names=new Set(FRAMES.map(f=>f.name.toLowerCase()));add(l.filter(t=>!names.has(String(t.name).toLowerCase())).map(plainFrame))}catch{$('#tplNote').hidden=false}}
$('#again').onclick=loadTpls;
loadStrip().then(s=>{S=s;const saved=s.st.frame||(s.st.bg?frameOf(s.st):null);
  const g=$('#fgrid'),a=stripSize(s.lay,FRAMES[0]);g.style.setProperty('--min',sizeMin(a.W/a.H)+'px');
  list=[...FRAMES];if(saved&&!list.some(f=>f.id===saved.id))list.unshift(saved);
  cur=list.find(f=>f.id===(saved&&saved.id))||FRAMES[0];
  $('#msg').hidden=true;$('#ui').hidden=false;add(list);loadTpls()}).catch(stripError);
$('#cats').addEventListener('wheel',e=>{const r=e.currentTarget;if(r.scrollWidth>r.clientWidth&&Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();r.scrollLeft+=e.deltaY}},{passive:false});
