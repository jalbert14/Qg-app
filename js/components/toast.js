/* =========================================================
   NOTIFICACIONES Y VENTANAS FLOTANTES (SHEETS/TOAST)
   ========================================================= */
function cargando(activo, txt){
  const s = document.getElementById('splash');
  if(!s) return;
  if(txt) document.getElementById('splashTxt').textContent = txt;
  s.classList.toggle('on', !!activo);
}

function toast(msg){
  const t = $('#toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('on'), 2200);
}

function sheet(id){
  if(openSheet) openSheet.classList.remove('on');
  const el = $(id);
  if(!el) return;
  el.classList.add('on');
  openSheet = el;
  $('#scrim').classList.add('on');
}

function closeSheet(){
  if(openSheet) openSheet.classList.remove('on');
  openSheet = null;
  $('#scrim').classList.remove('on');
}
