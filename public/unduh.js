loadStrip().then(({st,lay,imgs,adj})=>{const frame=frameOf(st);
  renderStrip($('#out'),{lay,photos:imgs,adj,frame});$('#fname').textContent='Frame: '+frame.name;$('#msg').hidden=true;$('#ui').hidden=false;
  $('#dl').onclick=()=>{$('#out').toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='photobooth-strip.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);$('#done').hidden=false;fetch('/api/download',{method:'POST'}).catch(()=>{})},'image/png')};
  $('#fresh').onclick=()=>{try{sessionStorage.removeItem(KEY)}catch{}location.href='foto.html'}}).catch(stripError);
