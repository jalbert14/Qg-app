/* =========================================================
   INTEGRACIÓN Y SINCRONIZACIÓN CON GOOGLE APPS SCRIPT
   ========================================================= */
const URL_PREDETERMINADA = 'https://script.google.com/macros/s/AKfycbyDfk83SpHyQZgpzDbn_nTCox_chMzQplEDF3k-j6Y_W87OQfkv-DkpVX9Ln1U3Plz_/exec';

function rolActual(){ return conn.activa ? (conn.rol || 'consulta') : 'admin'; }

function marcarEstado(estado, msg){
  const d = $('#connDot'); if(d) d.className = 'dot ' + (estado === 'live' ? 'live' : estado === 'err' ? 'err' : '');
  const t = $('#connEstado'); if(t) t.textContent = msg || '';
  const c = $('#connRolChip');
  if(c){
    c.textContent = conn.activa ? (conn.rol || '—') : 'Sin conexión';
    c.className = 'rolchip' + (estado === 'live' ? ' live' : '');
  }
}

function aplicarRol(){
  const rol = rolActual();
  document.body.dataset.rol = rol;
  const marca = rol !== 'consulta';
  const tabA = document.querySelector('.tabbar button[data-v="asistencia"]');
  if(tabA) tabA.classList.toggle('hidden', !marca);
  if(!marca && $('#v-asistencia').classList.contains('on')) irA('consulta');
}

async function guardarConn(){
  const copia = Object.assign({}, conn); delete copia.clave;
  await Store.set('asis_conn', copia);
}

async function hashClave(usuarioLogin, clave){
  const t = 'qg:' + String(usuarioLogin || '').trim().toLowerCase() + ':' + String(clave || '').trim().toUpperCase();
  try{
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
    return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
  }catch(e){
    let x = 5381;
    for(let i = 0; i < t.length; i++) x = ((x * 33) ^ t.charCodeAt(i)) >>> 0;
    return 'f' + x.toString(16);
  }
}

async function api(accion, datos){
  if(!conn.url) return { ok:false, error:'Falta la dirección del script' };
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 20000);
  let resp;
  try{
    resp = await fetch(conn.url, {
      method:'POST', redirect:'follow', signal: ctrl.signal,
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ accion, usuario: conn.usuarioLogin, clave: conn.clave }, datos || {}))
    });
  }catch(e){
    clearTimeout(to);
    const sinInternet = typeof navigator !== 'undefined' && navigator.onLine === false;
    return { ok:false, red:true, error: sinInternet
      ? 'Sin conexión a internet. Lo pendiente se sube al reconectar.'
      : 'No se pudo contactar la hoja. Revisa la dirección del script y que su acceso esté en "Cualquier persona".' };
  }
  clearTimeout(to);
  try{
    return await resp.json();
  }catch(e){
    return { ok:false, red:true, error:'La hoja respondió pero no en el formato esperado. Verifica que la URL termine en /exec y que el acceso del script sea "Cualquier persona".' };
  }
}

function push(accion, datos){
  if(!conn.activa) return;
  outbox.push({ accion, datos });
  Store.set('asis_outbox', outbox);
  clearTimeout(push._t);
  push._t = setTimeout(sincronizar, 500);
}

async function flush(){
  while(outbox.length){
    const op = outbox[0];
    const r = await api(op.accion, op.datos);
    if(!r.ok && r.red){ marcarEstado('err', 'Sin señal · ' + outbox.length + ' por subir'); return false; }
    outbox.shift(); await Store.set('asis_outbox', outbox);
    if(!r.ok) toast(r.error || 'La hoja rechazó un cambio');
  }
  return true;
}

async function sincronizar(){
  if(!conn.activa) return;
  if(sincronizando){ resyncPendiente = true; return; }
  sincronizando = true;
  try{
    if(!(await flush())) return;
    const revPresentesAlEnviar = revisionLocal;
    const revLSAlEnviar = revisionLocalLS;
    const r = await api('sync', { vp: conn.vp || '', vh: conn.vh || '', vpend: conn.vpend || '', vls: conn.vls || '', vpro: conn.vpro || '' });
    if(!r.ok){ marcarEstado('err', r.error || 'No se pudo sincronizar'); return; }
    conn.rol = r.rol; conn.usuario = r.usuario;
    if(Array.isArray(r.personas)){
      personas = r.personas; idxBusq.clear();
      if(Array.isArray(r.campos)) ajustes.campos = r.campos;
      await Store.set('asis_personas', personas);
      await Store.set('asis_ajustes', ajustes);
    }
    if(Array.isArray(r.historial)){
      sesiones = r.historial.map(x => ({ id:x.id, titulo:x.titulo, fecha:x.fecha, presentes:(x.presentes || []).slice().reverse() }))
        .sort((a,b) => b.fecha.localeCompare(a.fecha));
      await Store.set('asis_sesiones', sesiones);
    }
    if(Array.isArray(r.pendientes)){
      pendientes = r.pendientes;
      await Store.set('asis_pendientes', pendientes);
    }
    if(Array.isArray(r.asistenciaLS)){
      if(revisionLocalLS === revLSAlEnviar){
        asistenciaLS = r.asistenciaLS;
        await Store.set('asis_asistenciaLS', asistenciaLS);
      } else {
        resyncPendiente = true;
      }
    }
    if(Array.isArray(r.prospectos)){
      prospectos = r.prospectos;
      if(Array.isArray(r.camposProspectos)) ajustes.camposProspectos = r.camposProspectos;
      await Store.set('asis_prospectos', prospectos);
      await Store.set('asis_ajustes', ajustes);
    }
    if(Array.isArray(r.ordenColegios)){
      ordenColegios = r.ordenColegios;
      await Store.set('asis_orden_colegios', ordenColegios);
    }
    if(Array.isArray(r.aliasColegios)){
      aliasColegios = r.aliasColegios;
      await Store.set('asis_alias_colegios', aliasColegios);
    }
    conn.vp = r.vp || conn.vp; conn.vh = r.vh || conn.vh; conn.vpend = r.vpend || conn.vpend;
    conn.vls = r.vls || conn.vls; conn.vpro = r.vpro || conn.vpro;
    const s = r.sesion || {};

    if(revisionLocal === revPresentesAlEnviar){
      activa = { id: s.id, titulo: s.titulo || '', fecha: s.fecha || hoyISO(), presentes: (r.presentes || []).slice().reverse() };
      await Store.set('asis_activa', activa);
    } else {
      resyncPendiente = true;
    }
    await guardarConn();
    marcarEstado('live', 'En vivo como ' + conn.usuario + ' · rol ' + conn.rol + ' · ' + horaCorta());
    aplicarRol(); renderAll();
  }finally{
    sincronizando = false;
    if(resyncPendiente){ resyncPendiente = false; setTimeout(sincronizar, 50); }
  }
}

function iniciarPoll(){
  clearInterval(pollTimer);
  pollTimer = setInterval(() => { if(!document.hidden) sincronizar(); }, 12000);
}
document.addEventListener('visibilitychange', () => { if(!document.hidden) sincronizar(); });
