/* =========================================================
   ALMACENAMIENTO  (window.storage → localStorage → memoria)
   ========================================================= */
const Mem = {};
function ofuscar(txt){
  try {
    return 'qg1:' + btoa(encodeURIComponent(txt));
  } catch(e) {
    return txt;
  }
}

function desofuscar(str){
  if(!str) return str;
  if(typeof str === 'string' && str.indexOf('qg1:') === 0){
    try {
      return decodeURIComponent(atob(str.slice(4)));
    } catch(e) {
      return str;
    }
  }
  return str;
}

const Store = (() => {
  const hasWS = typeof window !== 'undefined' && window.storage && typeof window.storage.get === 'function';
  let hasLS = false;
  try { localStorage.setItem('__t','1'); localStorage.removeItem('__t'); hasLS = true; } catch(e){ hasLS = false; }
  return {
    mode: hasWS ? 'ws' : (hasLS ? 'ls' : 'mem'),
    async get(k, def){
      try{
        if(hasWS){ const r = await window.storage.get(k); return r && r.value ? JSON.parse(desofuscar(r.value)) : def; }
        if(hasLS){ const r = localStorage.getItem(k); return r ? JSON.parse(desofuscar(r)) : def; }
      }catch(e){}
      return (k in Mem) ? Mem[k] : def;
    },
    async set(k, v){
      Mem[k] = v;
      try{
        if(hasWS){ await window.storage.set(k, ofuscar(JSON.stringify(v))); return; }
        if(hasLS){ localStorage.setItem(k, ofuscar(JSON.stringify(v))); }
      }catch(e){ avisarAlmacen(); return false; }
      return false;
    }
  };
})();

let avisoAlmacenDado = false;
function avisarAlmacen(){
  if(avisoAlmacenDado) return;
  avisoAlmacenDado = true;
  const w = document.getElementById('storeWarn');
  if(w){
    w.classList.remove('hidden');
    w.innerHTML = 'El navegador se quedó sin espacio para guardar. La app sigue funcionando en esta sesión, pero <b>descarga un respaldo desde Ajustes antes de cerrarla</b> y reduce el tamaño de la base o trabaja conectado a la hoja de Google.';
  }
}
