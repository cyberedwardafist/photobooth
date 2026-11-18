let S,list=[],cur;
const cards=new Map();
const sizeMin=a=>a<.6?190:a<1.1?250:340;
function card(f){const {W,H}=stripSize(S.lay,f),el=document.createElement('button');el.className='fcard';el.dataset.id=f.id;
  el.innerHTML=`<span class="fprev"><canvas aria-hidden="true"></canvas></span><span class="fname">${esc(f.name)}</span>`;
  el.onclick=()=>pick(f);cards.set(f.id,{f,el,done:false});return el}
function mark(){cards.forEach(({el,f})=>el.setAttribute('aria-pressed',f.id===cur.id));$('#picked').textContent=cur.name}
function pick(f){cur=f;setState({frame:f,bg:undefined,ink:undefined});mark()}
async function paint(){for(const c of cards.values()){if(c.done)continue;const cv=c.el.querySelector('canvas'),{W}=stripSize(S.lay,c.f);
  renderStrip(cv,{lay:S.lay,photos:S.imgs,adj:S.adj,frame:c.f,s:Math.min(1,440/W)});c.done=true;await new Promise(r=>setTimeout(r))}}
function add(frames){const g=$('#fgrid');frames.forEach(f=>{if(!cards.has(f.id))g.append(card(f))});mark();return paint()}
async function loadTpls(){$('#tplNote').hidden=true;
  try{const l=await fetchTpls();const names=new Set(FRAMES.map(f=>f.name.toLowerCase()));await add(l.filter(t=>!names.has(String(t.name).toLowerCase())).map(plainFrame))}catch{$('#tplNote').hidden=false}}
$('#again').onclick=loadTpls;
loadStrip().then(s=>{S=s;const saved=s.st.frame||(s.st.bg?frameOf(s.st):null);
  const g=$('#fgrid'),a=stripSize(s.lay,FRAMES[0]);g.style.setProperty('--min',sizeMin(a.W/a.H)+'px');
  list=[...FRAMES];if(saved&&!list.some(f=>f.id===saved.id))list.unshift(saved);
  cur=list.find(f=>f.id===(saved&&saved.id))||FRAMES[0];
  $('#msg').hidden=true;$('#ui').hidden=false;add(list).then(loadTpls)}).catch(stripError);
