/* Connect: ruang bersama lewat WebRTC (PeerJS). Kode ruang 6 digit = id host (pbconnect-XXXXXX); id yang sudah dipakai ditolak server, jadi kode otomatis unik. */
const PB_ROOM='pb_room',PFX='pbconnect-';
const roomGet=()=>{try{return JSON.parse(sessionStorage.getItem(PB_ROOM))}catch{return null}};
const roomSet=r=>{try{sessionStorage.setItem(PB_ROOM,JSON.stringify(r))}catch{}};
const roomClear=()=>{try{sessionStorage.removeItem(PB_ROOM)}catch{}};
const rand6=()=>String(Math.floor(Math.random()*1e6)).padStart(6,'0');
const wait2=ms=>new Promise(r=>setTimeout(r,ms));
/* o:{role:'host'|'guest',code,name}; stream = kamera lokal. Callback: onChange(), onStart(), onError(teks) */
async function openRoom(o,stream,cb={}){
  const R={code:o.code,role:o.role,members:new Map(),self:null,closed:false,started:!!o.started};/* members: id -> {name,stream} */
  const conns=new Map(),called=new Set(),ch=()=>cb.onChange&&cb.onChange(R);
  const P=window.Peer;if(!P){cb.onError&&cb.onError('Pustaka koneksi gagal dimuat. Periksa internet lalu muat ulang.');return R}
  const send=(c,m)=>{try{c.send(m)}catch{}};
  const drop=id=>{conns.delete(id);called.delete(id);if(R.members.delete(id))ch()};
  const callTo=(peer,id)=>{if(called.has(id)||id===peer.id)return;called.add(id);
    const c=peer.call(id,stream,{metadata:{name:o.name}});c.on('stream',s=>{const m=R.members.get(id)||{name:'Teman'};m.stream=s;R.members.set(id,m);ch()});c.on('close',()=>drop(id))};
  const wire=(peer,c)=>{conns.set(c.peer,c);
    c.on('data',d=>{if(!d)return;
      if(d.t==='hi'&&R.role==='host'){const old=[...R.members].filter(([k])=>k!==c.peer).map(([id,m])=>({id,name:m.name}));
        old.unshift({id:peer.id,name:o.name});send(c,{t:'roster',list:old});
        conns.forEach((x,k)=>{if(k!==c.peer)send(x,{t:'join',id:c.peer,name:d.name})});
        R.members.set(c.peer,{...(R.members.get(c.peer)||{}),name:d.name});ch();if(R.started&&cb.onLate)cb.onLate(c,send)}
      else if(d.t==='roster'){d.list.forEach(m=>{R.members.set(m.id,{...(R.members.get(m.id)||{}),name:m.name});callTo(peer,m.id)});ch()}
      else if(d.t==='join'){R.members.set(d.id,{...(R.members.get(d.id)||{}),name:d.name});ch()}
      else if(d.t==='start'&&cb.onStart)cb.onStart();else if(d.t==='app'){if(R.role==='host')conns.forEach((x,k)=>{if(k!==c.peer)send(x,d)});cb.onApp&&cb.onApp(d)}});
    c.on('close',()=>{drop(c.peer);if(R.rejoin&&c.peer===PFX+o.code)R.rejoin()})};
  const mkPeer=id=>new Promise((ok,no)=>{const p=id?new P(id):new P();p.on('open',()=>ok(p));p.on('error',e=>no(e))});
  let peer;
  if(o.role==='host'){
    for(let i=0;i<25&&!peer;i++){try{peer=await mkPeer(PFX+o.code)}catch(e){if(e.type==='unavailable-id'&&o.fresh){o.code=rand6();R.code=o.code;continue}if(e.type==='unavailable-id'){await wait2(1000);continue}cb.onError&&cb.onError('Tidak bisa membuat ruang. Coba lagi.');return R}}
    if(!peer){cb.onError&&cb.onError('Tidak bisa membuat ruang. Coba lagi.');return R}
    peer.on('connection',c=>c.on('open',()=>wire(peer,c)))}
  else{
    try{peer=await mkPeer()}catch{cb.onError&&cb.onError('Tidak bisa terhubung ke server.');return R}
    const tryJoin=async n=>{let ok=false;
      for(let i=0;i<n&&!ok&&!R.closed;i++){
        ok=await new Promise(res=>{const c=peer.connect(PFX+o.code,{reliable:true});let done=false;
          const f=v=>{if(!done){done=true;res(v)}};c.on('open',()=>{wire(peer,c);send(c,{t:'hi',name:o.name});f(true)});
          const onE=e=>{if(e.type==='peer-unavailable')f(false)};peer.on('error',onE);setTimeout(()=>f(false),4000)});
        if(!ok)await wait2(1200)}
      return ok};
    if(!await tryJoin(o.fresh?2:14)){cb.onError&&cb.onError('Ruang dengan kode itu tidak ditemukan.');return R}
    R.rejoin=async()=>{if(R.closed)return;R.members.clear();called.clear();ch();await tryJoin(40)}}
  R.self=peer.id;R.peer=peer;
  peer.on('call',c=>{c.answer(stream);const nm=(c.metadata&&c.metadata.name)||'Teman';
    c.on('stream',s=>{const m=R.members.get(c.peer)||{name:nm};m.stream=s;if(!m.name)m.name=nm;R.members.set(c.peer,m);ch()});c.on('close',()=>drop(c.peer))});
  R.bcast=m=>conns.forEach(c=>send(c,{t:'app',...m}));
  R.start=()=>conns.forEach(c=>send(c,{t:'start'}));
  R.leave=()=>{R.closed=true;try{peer.destroy()}catch{}};
  ch();return R}
