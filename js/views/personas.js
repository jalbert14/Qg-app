/* =========================================================
   CONTROLADOR DE LA VISTA Y EDICIÓN DE PERSONAS
   ========================================================= */
let ultimaClaveDup = '';

function renderPersonas(){
  $('#pCount').textContent = personas.length + (personas.length === 1 ? ' persona' : ' personas');
  $('#pSource').textContent = ajustes.fuente ? 'Origen: ' + ajustes.fuente : 'Sin archivo cargado';
  const pend = personas.filter(p => p.nuevo && !p.exportado).length;
  const nt = $('#nuevosTxt');
  if(nt) nt.innerHTML = pend
    ? `<b style="color:var(--accent)">${pend} ${pend===1?'persona nueva':'personas nuevas'}</b> desde la última exportación. Genera el archivo actualizado y reemplaza con él tu Excel original.`
    : 'Genera el archivo actualizado cuando quieras: incluye a todos, con una hoja aparte para los agregados desde la app.';
  const term = $('#qp')?.value;
  const lista = term ? buscar(term, personas, 60) : personas.slice(0, 60);
  const c = $('#personasList');
  if(!personas.length){ c.innerHTML = '<div class="empty"><b>Base de datos vacía</b>Carga un Excel con las columnas de nombre, cédula y colegio.</div>'; return; }
  const editable = rolActual() === 'admin';
  c.innerHTML = lista.map(p => `<div class="row" data-edit="${esc(p.id)}" style="cursor:${editable?'pointer':'default'}">
      <div class="r-main">
        <div class="r-name">${esc(p.nombre)}${p.nuevo && !p.exportado ? ' <span class="pill nuevo">nuevo</span>' : ''}</div>
        <div class="r-meta"><span class="ci">${esc(formatearCedula(p.ci)||'—')}</span> · ${esc(p.colegio||'—')}</div>
      </div>
      <button class="x-btn" data-id="${esc(p.id)}" aria-label="Eliminar">✕</button>
    </div>`).join('') + (!term && personas.length > 60 ? `<div class="empty">Mostrando 60 de ${personas.length}. Usa el filtro para buscar.</div>` : '');
  c.querySelectorAll('.x-btn').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    push('persona_del', { id: b.dataset.id });
    personas = personas.filter(p => p.id !== b.dataset.id);
    await Store.set('asis_personas', personas); renderPersonas(); renderStrip();
  }));
  if(editable) c.querySelectorAll('[data-edit]').forEach(r => r.addEventListener('click', () => {
    const p0 = personas.find(x => x.id === r.dataset.edit);
    if(p0) abrirAlta('', false, p0);
  }));
}

function abrirAlta(term, presente, persona){
  editandoId = persona ? persona.id : null;
  const soloNums = term ? /^[\d.\-vVeE\s]+$/.test(term) : false;
  $('#npNombre').value = persona ? persona.nombre : (term && !soloNums ? term : '');
  $('#npCi').value = persona ? (persona.ci || '') : (term && soloNums ? term : '');
  $('#npCol').value = persona ? (persona.colegio || '') : '';
  $('#npTitulo').textContent = persona ? 'Editar persona' : 'Agregar persona';
  $('#npSub').textContent = persona ? 'Los cambios se reflejan en todos los dispositivos.' : 'Se suma a la base de datos actual.';
  $('#npExtras').innerHTML = campos().map(c =>
    `<label class="lbl">${esc(c)}</label><input class="inp" data-campo="${esc(c)}" value="${esc(valorExtra(persona, c))}" placeholder="${esc(c)}">`).join('');
  $('#npAviso').className = 'warn hidden'; $('#npAviso').innerHTML = '';
  dupConfirmado = false; ultimaClaveDup = '';
  $('#btnSavePerson').textContent = 'Guardar'; $('#btnSavePerson').disabled = false;
  $('#btnDelPerson').classList.toggle('hidden', !persona);
  $('#segAlta').classList.toggle('hidden', !!persona);
  altaJxJ = !!(persona && persona.vip);
  $('#npJxJWrap').classList.toggle('hidden', rolActual() !== 'admin');
  $('#npJxJBtn').textContent = altaJxJ ? '★' : '☆';
  $('#npJxJBtn').classList.toggle('on', altaJxJ);
  altaLaboral = !!(persona && persona.laboral);
  $('#npLsWrap').classList.toggle('hidden', rolActual() !== 'admin');
  $('#npLsBtn').classList.toggle('on', altaLaboral);
  $('#npLsBtn').style.opacity = altaLaboral ? '1' : '.35';
  altaPresente = persona ? false : !!presente;
  $$('#segAlta button').forEach(b => b.classList.toggle('on', (b.dataset.a === 'si') === altaPresente));
  sheet('#shPersona');
  revisarAlta();
  setTimeout(() => { ($('#npNombre').value ? $('#npCi') : $('#npNombre')).focus(); }, 260);
}

function coincidencias(nombre, ci, excluirId){
  const c = normCI(ci), n = claveNombre(nombre);
  const tk = norm(nombre).split(' ').filter(Boolean);
  let dura = null; const blandas = [];
  for(const p of personas){
    if(p.id === excluirId) continue;
    if(c && normCI(p.ci) === c){ dura = p; continue; }
    if(!n) continue;
    const ptk = norm(p.nombre).split(' ').filter(Boolean);
    const igual = claveNombre(p.nombre) === n;
    const contenido = tk.length >= 2 && ptk.length >= 2 &&
      (tk.every(x => ptk.indexOf(x) >= 0) || ptk.every(x => tk.indexOf(x) >= 0));
    if(igual || contenido) blandas.push(p);
  }
  return { dura, blandas: blandas.slice(0, 3) };
}

function tarjetaPersona(p){
  return `<div class="dup-persona"><b>${esc(p.nombre)}</b><span>${esc(formatearCedula(p.ci) || 'sin cédula')} · ${esc(secundario(p) || '—')}</span></div>`;
}

function revisarAlta(){
  const n = $('#npNombre').value.trim(), ci = $('#npCi').value.trim();
  const box = $('#npAviso'), btn = $('#btnSavePerson');
  const r = (n || ci) ? coincidencias(n, ci, editandoId) : { dura:null, blandas:[] };
  const clave = (r.dura ? r.dura.id : '') + '|' + r.blandas.map(x => x.id).join(',');
  if(clave !== ultimaClaveDup){ ultimaClaveDup = clave; dupConfirmado = false; btn.textContent = 'Guardar'; }

  if(r.dura){
    box.className = 'warn dup';
    box.innerHTML = '<span class="dup-tit">Esta persona ya está registrada</span>'
      + 'La cédula coincide con la de un registro que ya existe:' + tarjetaPersona(r.dura)
      + `<button class="dup-btn" data-ver="${esc(r.dura.id)}">Ver su ficha</button>`;
    btn.disabled = true;
  } else if(r.blandas.length){
    box.className = 'warn';
    box.innerHTML = '<span class="dup-tit">Puede que ya esté registrada</span>'
      + (r.blandas.length === 1 ? 'Hay alguien con ese mismo nombre:' : 'Hay personas con ese mismo nombre:')
      + r.blandas.map(tarjetaPersona).join('')
      + `<button class="dup-btn" data-ver="${esc(r.blandas[0].id)}">Ver su ficha</button>`
      + '<div style="margin-top:8px">Si de verdad es otra persona, toca Guardar dos veces.</div>';
    btn.disabled = false;
  } else {
    box.className = 'warn hidden'; box.innerHTML = ''; btn.disabled = false;
  }

  box.querySelectorAll('[data-ver]').forEach(b => b.addEventListener('click', () => {
    editandoId = null; closeSheet();
    setTimeout(() => abrirCarnet(b.dataset.ver), 220);
  }));
}

function nuevosPendientes(){ return personas.filter(p => p.nuevo && !p.exportado); }

function renderPendientes(){
  const btn = $('#btnPendientes'); if(!btn) return;
  const n = pendientes.length;
  btn.classList.toggle('hidden', !n);
  btn.textContent = 'Revisar solicitudes (' + n + ')';
}

function tarjetaPendiente(p){
  const extra = [p.carrera, p.semestre].filter(Boolean).join(' · ');
  return `<div class="card" style="margin-bottom:11px">
      <div style="font-family:'Archivo';font-weight:600;font-size:16px">${esc(p.nombre)}</div>
      <div style="font-size:13px;color:var(--slate);margin-top:2px">
        <span class="mono">${esc(p.ci)}</span>${p.colegio ? ' · ' + esc(p.colegio) : ''}${extra ? ' · ' + esc(extra) : ''}
      </div>
      <div class="warn" style="margin-top:9px;margin-bottom:0">Coincide con <b>${esc(p.coincideNombre)}</b>, que ya está en la base.</div>
      <div class="btn-grid" style="margin-top:9px">
        <button class="btn small" data-resolver="fusionar" data-id="${esc(p.id)}">Actualizar existente</button>
        <button class="btn small ghost" data-resolver="nueva" data-id="${esc(p.id)}">Crear aparte</button>
      </div>
      <button class="btn small ghost" style="margin-top:8px;color:var(--danger)" data-resolver="descartar" data-id="${esc(p.id)}">Descartar solicitud</button>
    </div>`;
}

function abrirPendientes(){
  const list = $('#pendList'); if(!list) return;
  list.innerHTML = pendientes.length
    ? pendientes.map(tarjetaPendiente).join('')
    : '<div class="empty"><b>No hay solicitudes pendientes</b></div>';
  if(!conn.activa){
    list.innerHTML += '<div class="empty">Necesitas conexión para resolver solicitudes.</div>';
  } else {
    list.querySelectorAll('[data-resolver]').forEach(b => b.addEventListener('click', async () => {
      const id = b.dataset.id, modo = b.dataset.resolver;
      const card = b.closest('.card'); if(card) card.style.opacity = '.5';
      const r = await api('pendiente_resolver', { id, modo });
      if(r.ok){
        pendientes = pendientes.filter(p => p.id !== id);
        await Store.set('asis_pendientes', pendientes);
        toast(modo === 'fusionar' ? 'Datos actualizados' : modo === 'nueva' ? 'Persona creada aparte' : 'Solicitud descartada');
        renderPendientes(); abrirPendientes();
        sincronizar();
      } else toast(r.error || 'No se pudo procesar');
    }));
  }
  sheet('#shPendientes');
}

