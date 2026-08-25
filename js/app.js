/* =========================================================
   PUNTO DE ENTRADA Y BINDING DE EVENTOS GLOBAL DE LA APP
   ========================================================= */
(async function init(){
  personas = await Store.get('asis_personas', []);
  sesiones = await Store.get('asis_sesiones', []);
  ajustes  = await Store.get('asis_ajustes', ajustes);
  pendientes = await Store.get('asis_pendientes', []);
  asistenciaLS = await Store.get('asis_asistenciaLS', []);
  prospectos = await Store.get('asis_prospectos', []);
  ordenColegios = await Store.get('asis_orden_colegios', []);
  aliasColegios = await Store.get('asis_alias_colegios', []);
  activa   = await Store.get('asis_activa', null);
  conn     = await Store.get('asis_conn', conn);
  conn.url = URL_PREDETERMINADA;
  await guardarConn();
  outbox   = await Store.get('asis_outbox', []);

  if(!activa || activa.fecha !== hoyISO()){
    if(activa && activa.presentes.length){ /* se conserva hasta que la cierren */ }
    else activa = { id: uid(), titulo:'', fecha: hoyISO(), presentes: [] };
  }
  await Store.set('asis_activa', activa);

  if(Store.mode === 'mem'){
    const sw = $('#storeWarn');
    if(sw){
      sw.classList.remove('hidden');
      sw.innerHTML = 'Este navegador no está guardando datos de forma permanente. Descarga un respaldo desde Ajustes antes de cerrar, o publica el archivo en un servidor (ver instrucciones).';
    }
  }
  conn.clave = ''; conn.activa = false;
  aplicarRol();
  renderAll();
  cargando(false);
  if(conn.url || !ajustes.modoLocal) mostrarLogin();
  else marcarEstado('off','Trabajando solo en este dispositivo. Los datos no se comparten.');
})();

/* Modal scrim close */
$('#scrim')?.addEventListener('click', closeSheet);

/* Auth listeners */
$('#btnEntrar')?.addEventListener('click', entrar);
$('#lgClave')?.addEventListener('keydown', e => { if(e.key === 'Enter') entrar(); });
$('#lgUsuario')?.addEventListener('keydown', e => { if(e.key === 'Enter') $('#lgClave')?.focus(); });
$('#btnLocal')?.addEventListener('click', async () => {
  ajustes.modoLocal = true; conn = { url: URL_PREDETERMINADA, clave:'', usuarioLogin:'', usuario:'', rol:'', activa:false, vp:'', vh:'', vpend:'', vls:'', vpro:'' };
  await Store.set('asis_ajustes', ajustes); await guardarConn();
  document.body.classList.remove('bloqueada');
  aplicarRol(); renderAll();
  marcarEstado('off', 'Trabajando solo en este dispositivo. Los datos no se comparten.');
});
$('#btnSalir')?.addEventListener('click', async () => {
  conn.clave = ''; conn.activa = false; clearInterval(pollTimer);
  await guardarConn(); closeSheet(); mostrarLogin();
});

/* 2FA Recovery listeners */
$('#btnRecuperarLink')?.addEventListener('click', abrirRecuperar);
$('#btnCerrarRecuperar')?.addEventListener('click', closeSheet);
$('#scrimRecuperar')?.addEventListener('click', closeSheet);
$('#btnEnviar2FA')?.addEventListener('click', solicitar2FA);
$('#btnVerificar2FA')?.addEventListener('click', verificar2FA);
$('#btnReenviar2FA')?.addEventListener('click', solicitar2FA);
$('#btnGuardarNuevaClave')?.addEventListener('click', guardarNuevaClave);

/* Navigation listeners */
$$('.tabbar button').forEach(b => b.addEventListener('click', () => irA(b.dataset.v)));
$$('#segHist button').forEach(b => b.addEventListener('click', () => {
  $$('#segHist button').forEach(x=>x.classList.remove('on')); b.classList.add('on');
  $('#histSes')?.classList.toggle('hidden', b.dataset.h!=='ses');
  $('#histPer')?.classList.toggle('hidden', b.dataset.h!=='per');
}));

/* Search input */
$('#q')?.addEventListener('input', e => {
  $('#qClear')?.classList.toggle('hidden', !e.target.value);
  renderResults(e.target.value);
});
$('#qClear')?.addEventListener('click', () => { $('#q').value=''; $('#qClear')?.classList.add('hidden'); renderResults(''); $('#q')?.focus(); });
$('#btnCerrar')?.addEventListener('click', abrirCerrarSesion);
$('#btnPdfOnly')?.addEventListener('click', () => procesarCerrarSesion(false));
$('#btnPdfMail')?.addEventListener('click', () => procesarCerrarSesion(true));
$('#btnCerrarCancel')?.addEventListener('click', closeSheet);
$$('#segFormato button').forEach(b => b.addEventListener('click', () => {
  $$('#segFormato button').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
}));

/* Modal Carnet */
$('#btnCancelar')?.addEventListener('click', closeSheet);
$('#btnConfirmar')?.addEventListener('click', async () => {
  const p = seleccion; if(!p) return;
  const i = activa.presentes.findIndex(x => x.id === p.id);
  if(i >= 0){
    activa.presentes.splice(i,1);
    revisionLocal++;
    await Store.set('asis_activa', activa);
    push('desmarcar', { persona_id: p.id });
    closeSheet(); toast('Se quitó de la lista');
  } else {
    const rep0 = activa.presentes.find(x => x.id !== p.id && normCI(x.ci) && normCI(x.ci) === normCI(p.ci));
    if(rep0){ toast('Ya hay alguien con esa cédula en la lista: ' + rep0.nombre); return; }
    const lista = p.esProspecto ? 'prospecto' : (p.vip ? 'JxJ' : 'base');
    activa.presentes.unshift({ id:p.id, nombre:p.nombre, ci:p.ci, colegio: secundario(p), hora: horaCorta(), lista });
    revisionLocal++;
    await Store.set('asis_activa', activa);
    push('marcar', { persona_id:p.id, nombre:p.nombre, ci:p.ci, colegio: secundario(p), hora: horaCorta(), lista });
    $('#cnStamp')?.classList.add('on');
    if($('#cnFoot')) $('#cnFoot').textContent = 'Registrado a las ' + activa.presentes[0].hora;
    toast(p.nombre.split(' ')[0] + ' registrado');
    setTimeout(() => { closeSheet(); if($('#q')) $('#q').value=''; $('#qClear')?.classList.add('hidden'); renderResults(''); $('#q')?.focus(); }, 620);
  }
  renderStrip(); renderPresentes();
});

/* Import Excel listeners */
$('#btnImport')?.addEventListener('click', () => {
  if(typeof XLSX === 'undefined'){ toast('Conéctate a internet una vez para habilitar la lectura de Excel'); return; }
  $('#fileIn')?.click();
});
$('#fileIn')?.addEventListener('change', e => { leerImport(e.target.files[0]); e.target.value = ''; });
['#mapNombre','#mapCi','#mapCol'].forEach(s => $(s)?.addEventListener('change', mostrarExtras));
$$('#segMode button').forEach(b => b.addEventListener('click', () => {
  $$('#segMode button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); importMode = b.dataset.m; avisoReemplazo();
}));
$('#btnCancelImport')?.addEventListener('click', closeSheet);
$('#btnDoImport')?.addEventListener('click', async () => {
  if(!pendingImport) return;
  const iN = +$('#mapNombre').value, iC = +$('#mapCi').value, iL = +$('#mapCol').value;
  const ex = columnasExtra();
  const nuevos = pendingImport.datos.map(r => {
    const nombre = iN >= 0 ? String(r[iN] ?? '').trim() : '';
    const ci = iC >= 0 ? String(r[iC] ?? '').trim() : '';
    const colegio = iL >= 0 ? String(r[iL] ?? '').trim() : '';
    if(!nombre && !ci) return null;
    const extra = {};
    ex.forEach(x => { const v = String(r[x.i] ?? '').trim(); if(v) extra[x.c] = v; });
    return { id: 'p_' + (ci ? normCI(ci) : norm(nombre).replace(/ /g,'_')) + '_' + Math.random().toString(36).slice(2,5),
             nombre: nombre || ci, ci, colegio, extra };
  }).filter(Boolean);

  const clave = p => normCI(p.ci) ? 'ci:' + normCI(p.ci) : 'n:' + claveNombre(p.nombre);
  let descartados = 0;
  const previos = new Map(personas.map(p => [clave(p), !!p.vip]));
  const base = importMode === 'replace' ? [] : personas.slice();
  const vistos = new Set(base.map(clave));
  nuevos.forEach(p => {
    const k = clave(p);
    if(vistos.has(k)){ descartados++; return; }
    if(importMode === 'replace' && previos.get(k)) p.vip = true;
    vistos.add(k); base.push(p);
  });
  idxBusq.clear();
  personas = base;
  ajustes.campos = Array.from(new Set((importMode === 'replace' ? [] : campos()).concat(ex.map(x => x.c))));
  ajustes.fuente = pendingImport.nombreArchivo;
  await Store.set('asis_personas', personas);
  await Store.set('asis_ajustes', ajustes);
  const carga = personas.map(p => ({ id:p.id, nombre:p.nombre, ci:p.ci, colegio:p.colegio || '', extra:p.extra || {}, origen: p.nuevo ? 'app' : 'archivo', alta: p.alta || hoyISO() }));
  push('personas_set', { campos: campos(), personas: carga });
  pendingImport = null; closeSheet(); renderAll();
  toast(personas.length + ' personas' + (descartados ? ' · ' + descartados + ' repetidas descartadas' : ''));
});

/* Personas view & modal listeners */
$('#qp')?.addEventListener('input', renderPersonas);
$$('#segAlta button').forEach(b => b.addEventListener('click', () => {
  $$('#segAlta button').forEach(x => x.classList.remove('on')); b.classList.add('on'); altaPresente = b.dataset.a === 'si';
}));
$('#npJxJBtn')?.addEventListener('click', () => {
  altaJxJ = !altaJxJ;
  $('#npJxJBtn').textContent = altaJxJ ? '★' : '☆';
  $('#npJxJBtn').classList.toggle('on', altaJxJ);
});
$('#npLsBtn')?.addEventListener('click', () => {
  altaLaboral = !altaLaboral;
  $('#npLsBtn').classList.toggle('on', altaLaboral);
  $('#npLsBtn').style.opacity = altaLaboral ? '1' : '.35';
});
$('#btnAddPerson')?.addEventListener('click', () => abrirAlta('', false));
$('#qv')?.addEventListener('input', renderJxJ);
$('#qvAsignar')?.addEventListener('input', renderAsignarJxJ);
$('#btnCancelPerson')?.addEventListener('click', () => { editandoId = null; closeSheet(); });
$('#btnDelPerson')?.addEventListener('click', async () => {
  if(!editandoId) return;
  push('persona_del', { id: editandoId });
  personas = personas.filter(p => p.id !== editandoId);
  await Store.set('asis_personas', personas);
  editandoId = null; closeSheet(); renderAll(); toast('Persona eliminada de la base');
});
['#npNombre','#npCi'].forEach(s => $(s)?.addEventListener('input', revisarAlta));
$('#btnSavePerson')?.addEventListener('click', async () => {
  const n = $('#npNombre').value.trim(); if(!n){ toast('Escribe el nombre'); return; }
  const ci = $('#npCi').value.trim();
  const extra = {};
  $$('#npExtras [data-campo]').forEach(i => { const v = i.value.trim(); if(v) extra[i.dataset.campo] = v; });
  const r = coincidencias(n, ci, editandoId);
  if(r.dura){ revisarAlta(); return; }
  if(r.blandas.length && !dupConfirmado){
    dupConfirmado = true;
    revisarAlta();
    dupConfirmado = true;
    $('#btnSavePerson').textContent = 'Guardar de todos modos';
    return;
  }
  const esAdmin = rolActual() === 'admin';
  if(editandoId){
    const p0 = personas.find(x => x.id === editandoId);
    if(p0){
      idxBusq.delete(p0.id);
      p0.nombre = n; p0.ci = ci; p0.colegio = $('#npCol').value.trim(); p0.extra = extra;
      if(esAdmin) p0.vip = altaJxJ;
      if(esAdmin) p0.laboral = altaLaboral;
      await Store.set('asis_personas', personas);
      const payload = { id:p0.id, nombre:p0.nombre, ci:p0.ci, colegio:p0.colegio || '', extra, origen: p0.nuevo ? 'app' : 'archivo', alta: p0.alta || hoyISO() };
      if(esAdmin) payload.jxj = altaJxJ;
      if(esAdmin) payload.laboral = altaLaboral;
      push('persona_set', payload);
    }
    editandoId = null; closeSheet(); renderAll(); toast('Cambios guardados');
    return;
  }
  const nueva = { id:'p_'+uid(), nombre:n, ci, colegio: $('#npCol').value.trim(), extra, nuevo:true, alta:hoyISO(), exportado:false };
  if(esAdmin && altaJxJ) nueva.vip = true;
  if(esAdmin && altaLaboral) nueva.laboral = true;
  personas.unshift(nueva);
  await Store.set('asis_personas', personas);
  const payloadNueva = { id:nueva.id, nombre:nueva.nombre, ci:nueva.ci, colegio:nueva.colegio || '', extra, origen:'app', alta:nueva.alta };
  if(esAdmin) payloadNueva.jxj = altaJxJ;
  if(esAdmin) payloadNueva.laboral = altaLaboral;
  push('persona_set', payloadNueva);
  if(altaPresente && !activa.presentes.some(x => x.id === nueva.id)){
    activa.presentes.unshift({ id:nueva.id, nombre:nueva.nombre, ci:nueva.ci, colegio: secundario(nueva), hora: horaCorta(), lista: nueva.vip ? 'JxJ' : 'base' });
    revisionLocal++;
    await Store.set('asis_activa', activa);
    push('marcar', { persona_id:nueva.id, nombre:nueva.nombre, ci:nueva.ci, colegio: secundario(nueva), hora: horaCorta(), lista: nueva.vip ? 'JxJ' : 'base' });
  }
  closeSheet(); renderAll();
  toast(altaPresente ? nueva.nombre.split(' ')[0] + ' agregado y marcado presente' : 'Persona agregada a la base');
});

/* Pendientes sheet listeners */
$('#btnPendientes')?.addEventListener('click', abrirPendientes);
$('#btnPendClose')?.addEventListener('click', closeSheet);

/* Labor Social listeners */
$$('#segLS button').forEach(b => b.addEventListener('click', () => {
  $$('#segLS button').forEach(x => x.classList.remove('on')); b.classList.add('on');
  lsVista = b.dataset.ls;
  $('#lsHoy')?.classList.toggle('hidden', lsVista !== 'hoy');
  $('#lsLista')?.classList.toggle('hidden', lsVista !== 'lista');
  $('#lsReporte')?.classList.toggle('hidden', lsVista !== 'reporte');
  if(lsVista === 'reporte') renderReporteLS();
}));
if($('#lsFecha') && !$('#lsFecha').value) $('#lsFecha').value = hoyISO();
$('#lsFecha')?.addEventListener('change', () => { renderLsBuscar(''); renderLsPresentes(); });
$('#qls')?.addEventListener('input', e => renderLsBuscar(e.target.value));
$('#qlAsignar')?.addEventListener('input', renderAsignarLS);
$('#ql')?.addEventListener('input', renderListaLS);
if($('#lsDesde') && !$('#lsDesde').value){ $('#lsDesde').value = hoyISO(); $('#lsHasta').value = hoyISO(); }
$('#lsDesde')?.addEventListener('change', renderReporteLS);
$('#lsHasta')?.addEventListener('change', renderReporteLS);

$$('#segLsRepTipo button').forEach(b => b.addEventListener('click', () => {
  $$('#segLsRepTipo button').forEach(x => x.classList.remove('on')); b.classList.add('on');
  lsRepTipo = b.dataset.rtipo;
  lsRepPersona = null;
  $('#lsRepIndivBuscar')?.classList.toggle('hidden', lsRepTipo !== 'individual');
  $('#lsRepCuerpo')?.classList.toggle('hidden', lsRepTipo === 'individual');
  if($('#qlsRep')) $('#qlsRep').value = ''; if($('#lsRepIndivOut')) $('#lsRepIndivOut').innerHTML = '';
}));
$('#qlsRep')?.addEventListener('input', () => {
  const term = $('#qlsRep').value.trim();
  const out = $('#lsRepIndivOut');
  if(!term){ out.innerHTML = ''; return; }
  const res = buscar(term, personasConHistorialLS(), 10);
  out.innerHTML = res.length ? res.map(p => `<div class="row" data-lsrepper="${esc(p.id)}" style="cursor:pointer">
      <div class="avatar" style="width:38px;height:38px;font-size:14px;border-radius:10px">${esc(iniciales(p.nombre))}</div>
      <div class="r-main"><div class="r-name">${esc(p.nombre)}</div>
      <div class="r-meta"><span class="ci">${esc(formatearCedula(p.ci)||'—')}</span> · ${horasLaboral(p.id)} / ${metaLS()} horas</div></div>
      <div style="color:#B4BECD;font-size:20px">›</div>
    </div>`).join('') : '<div class="empty" style="margin-top:10px"><b>Sin resultados</b>Nadie con historial en Labor Social coincide.</div>';
  out.querySelectorAll('[data-lsrepper]').forEach(r => r.addEventListener('click', () => {
    lsRepPersona = personas.find(x => x.id === r.dataset.lsrepper);
    if(!lsRepPersona) return;
    $('#qlsRep').value = lsRepPersona.nombre;
    out.innerHTML = '';
    $('#lsRepCuerpo')?.classList.remove('hidden');
    renderReporteLS();
  }));
});

$('#btnLsPdf')?.addEventListener('click', async () => {
  const doc = generarPDFLaboral(); if(!doc) return;
  const nombre = nombreReporteLS('pdf');
  const blob = doc.output('blob');
  await compartirArchivo(blob, nombre, 'application/pdf', doc);
  const categoria = lsRepTipo === 'individual' ? 'Individual · ' + lsRepPersona.nombre : 'General';
  const r = await guardarEnNube(blob, nombre, 'application/pdf', 'Reportes Labor Social', categoria);
  toast(r.ok ? 'PDF listo y respaldado en la nube' : 'PDF listo (sin respaldo en la nube)');
});
$('#btnLsXls')?.addEventListener('click', async () => {
  const wb = libroLaboral(); if(!wb) return;
  const nombre = nombreReporteLS('xlsx');
  const blob = new Blob([XLSX.write(wb, { bookType:'xlsx', type:'array' })], { type: TIPO_XLSX });
  await compartirArchivo(blob, nombre, blob.type, null, wb);
  const categoria = lsRepTipo === 'individual' ? 'Individual · ' + lsRepPersona.nombre : 'General';
  const r = await guardarEnNube(blob, nombre, blob.type, 'Reportes Labor Social', categoria);
  toast(r.ok ? 'Excel listo y respaldado en la nube' : 'Excel listo (sin respaldo en la nube)');
});

/* Prospectos listeners */
$('#qpr')?.addEventListener('input', renderProspectos);
['#prNombre','#prCi'].forEach(s => $(s)?.addEventListener('input', revisarProspecto));
$('#btnAddProspecto')?.addEventListener('click', () => abrirProspecto(null));
$('#btnCancelProspecto')?.addEventListener('click', () => { editandoProspectoId = null; closeSheet(); });
$('#btnSaveProspecto')?.addEventListener('click', async () => {
  const n = $('#prNombre').value.trim(); if(!n){ toast('Escribe el nombre'); return; }
  const ci = $('#prCi').value.trim();
  const extra = {};
  $$('#prExtras [data-campo]').forEach(i => { const v = i.value.trim(); if(v) extra[i.dataset.campo] = v; });
  const datos = { nombre:n, ci, anio: $('#prAnio').value.trim(), colegio: $('#prColegio').value.trim(),
                  correo: $('#prCorreo').value.trim(), telefono: $('#prTelefono').value.trim(), extra };

  if(editandoProspectoId){
    const p0 = prospectos.find(x => x.id === editandoProspectoId);
    if(p0) Object.assign(p0, datos);
    await Store.set('asis_prospectos', prospectos);
    push('prospecto_set', Object.assign({ id: editandoProspectoId }, datos));
    editandoProspectoId = null; closeSheet(); renderProspectos();
    toast('Cambios guardados');
    return;
  }
  if(conn.activa){
    const r = await api('prospecto_set', datos);
    if(!r.ok){ toast(r.error || 'No se pudo guardar'); return; }
    const idx = prospectos.findIndex(x => x.id === r.id);
    if(idx >= 0){
      Object.keys(datos).forEach(k => {
        if(k === 'extra') prospectos[idx].extra = Object.assign({}, prospectos[idx].extra, datos.extra);
        else prospectos[idx][k] = datos[k] || prospectos[idx][k] || '';
      });
    } else {
      prospectos.unshift(Object.assign({ id: r.id, nuevo:true, alta: hoyISO() }, datos));
    }
    await Store.set('asis_prospectos', prospectos);
    closeSheet(); renderProspectos();
    toast(r.fusionado ? 'Se actualizó el registro existente (' + r.id + ')' : 'Prospecto guardado como ' + r.id);
    return;
  }
  const idLocal = 'pr_' + uid();
  prospectos.unshift(Object.assign({ id: idLocal, nuevo:true, alta: hoyISO() }, datos));
  await Store.set('asis_prospectos', prospectos);
  push('prospecto_set', datos);
  closeSheet(); renderProspectos();
  toast('Guardado. Se le asignará su número PROS al conectar.');
});
$('#btnDelProspecto')?.addEventListener('click', async () => {
  if(!editandoProspectoId) return;
  push('prospecto_del', { id: editandoProspectoId });
  prospectos = prospectos.filter(p => p.id !== editandoProspectoId);
  await Store.set('asis_prospectos', prospectos);
  editandoProspectoId = null; closeSheet(); renderProspectos();
  toast('Prospecto eliminado');
});

/* Connection sheet listeners */
$('#btnConexion')?.addEventListener('click', () => {
  const admin = rolActual() === 'admin';
  $('#connUrl').readOnly = !admin;
  $('#connUrl').style.opacity = admin ? '1' : '.6';
  $('#btnConectar').textContent = admin ? 'Guardar y reconectar' : 'Reconectar';
  $('#connUrl').value = conn.url || '';
  $('#connUsuario').value = conn.usuarioLogin || '';
  $('#connClave').value = conn.clave || '';
  marcarEstado(conn.activa ? 'live' : 'off', conn.activa
    ? 'En vivo como ' + conn.usuario + ' · rol ' + conn.rol
    : 'Trabajando solo en este dispositivo. Los datos no se comparten.');
  sheet('#shConexion');
});
$('#btnAjustesConn')?.addEventListener('click', () => $('#btnConexion')?.click());
$('#btnCerrarConexion')?.addEventListener('click', closeSheet);
$('#btnSincronizar')?.addEventListener('click', () => { if(conn.activa){ toast('Sincronizando…'); sincronizar(); } else toast('Primero conecta el dispositivo'); });

$('#btnConectar')?.addEventListener('click', async () => {
  const url = (rolActual() === 'admin' ? $('#connUrl').value.trim() : conn.url) || URL_PREDETERMINADA;
  const usuarioLogin = $('#connUsuario').value.trim();
  const clave = $('#connClave').value.trim().toUpperCase();
  if(!url || !usuarioLogin || !clave){ toast('Faltan el usuario y la clave'); return; }
  conn.url = url; conn.usuarioLogin = usuarioLogin; conn.clave = clave;
  marcarEstado('err', 'Conectando…');
  const r = await api('login', {});
  if(!r.ok){ conn.activa = false; marcarEstado('err', r.error || 'No se pudo conectar'); toast(r.error || 'No se pudo conectar'); return; }
  conn.activa = true; conn.rol = r.rol; conn.usuario = r.usuario;
  conn.claveHash = await hashClave(usuarioLogin, clave);
  ajustes.modoLocal = false;
  await guardarConn(); await Store.set('asis_ajustes', ajustes);
  aplicarRol(); await sincronizar(); iniciarPoll();
  toast('Conectado como ' + r.usuario);
});

$('#btnDesconectar')?.addEventListener('click', async () => {
  conn = { url: conn.url, clave:'', usuarioLogin:'', usuario:'', rol:'', activa:false, vp:'', vh:'', vpend:'', vls:'', vpro:'' };
  clearInterval(pollTimer);
  await guardarConn();
  aplicarRol(); marcarEstado('off', 'Desconectado. Los datos guardados siguen en este dispositivo.');
  renderAll(); toast('Dispositivo desconectado');
});

/* Settings sheet listeners */
$('#btnAjustes')?.addEventListener('click', abrirAjustes);
$('#btnCloseAjustes')?.addEventListener('click', guardarAjustes);
$('#btnBackup')?.addEventListener('click', descargarRespaldo);
$('#btnRestore')?.addEventListener('click', () => {
  if(conn.activa){
    toast('Estás conectado a la hoja: los datos salen de allá. Cierra sesión para restaurar un respaldo local.');
    return;
  }
  $('#restoreIn')?.click();
});
$('#restoreIn')?.addEventListener('change', e => { restaurarRespaldoFile(e.target.files[0]); e.target.value=''; });
