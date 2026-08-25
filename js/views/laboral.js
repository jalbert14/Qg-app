/* =========================================================
   CONTROLADOR DE LA VISTA DE LABOR SOCIAL
   ========================================================= */
async function marcarLaboral(id, on){
  const p = personas.find(x => x.id === id); if(!p) return;
  p.laboral = on;
  await Store.set('asis_personas', personas);
  push('laboral_set', { id: p.id, laboral: on });
  toast(on ? ('⏱ ' + p.nombre.split(' ')[0] + ' ahora está en Labor Social') : (p.nombre.split(' ')[0] + ' ya no está en Labor Social'));
  renderAll();
}

function fechaLS(){ return $('#lsFecha')?.value || hoyISO(); }

function renderLsBuscar(term){
  const out = $('#lsBuscarOut'); if(!out) return;
  if(!term){ out.innerHTML = ''; return; }
  const res = buscar(term, listaLaboral(), 10);
  if(!res.length){
    out.innerHTML = '<div class="empty" style="margin-top:10px"><b>Sin resultados</b>Nadie en Labor Social coincide con esa búsqueda.</div>';
    return;
  }
  const f = fechaLS();
  out.innerHTML = '<div style="height:8px"></div>' + res.map(p => {
    const yaHoy = asistenciaLS.some(r => r.personaId === p.id && r.fecha === f);
    return `<div class="row ${yaHoy?'done':''}" data-lsver="${esc(p.id)}" style="cursor:pointer">
      <div class="avatar" style="width:38px;height:38px;font-size:14px;border-radius:10px">${esc(iniciales(p.nombre))}</div>
      <div class="r-main">
        <div class="r-name">${esc(p.nombre)}</div>
        <div class="r-meta"><span class="ci">${esc(formatearCedula(p.ci)||'sin CI')}</span> · ${horasLaboral(p.id)} / ${metaLS()} horas</div>
      </div>
      ${yaHoy ? '<div class="tick">✓</div>' : `<button class="btn small" style="width:auto;margin:0;padding:8px 12px" data-lsmarcar="${esc(p.id)}">Marcar</button>`}
    </div>`;
  }).join('');
  out.querySelectorAll('[data-lsmarcar]').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    const p = personas.find(x => x.id === b.dataset.lsmarcar); if(!p) return;
    const reg = { id:'tmp_'+uid(), fecha:f, personaId:p.id, nombre:p.nombre, ci:p.ci, horas:horasPorMarca(), por:conn.usuario||'' };
    asistenciaLS.push(reg);
    revisionLocalLS++;
    await Store.set('asis_asistenciaLS', asistenciaLS);
    renderLsBuscar(term); renderLsPresentes(); renderLaboral();
    toast(p.nombre.split(' ')[0] + ' presente · +' + horasPorMarca() + ' horas');
    const r = await api('ls_marcar', { persona_id:p.id, nombre:p.nombre, ci:p.ci, fecha:f, horas:horasPorMarca() });
    if(!r.ok && !r.red){ toast(r.error || 'No se pudo marcar'); }
    sincronizar();
  }));
  out.querySelectorAll('[data-lsver]').forEach(r => r.addEventListener('click', () => abrirCarnet(r.dataset.lsver)));
}

function renderLsPresentes(){
  const c = $('#lsPresentes'); if(!c) return;
  const f = fechaLS();
  const hoy = asistenciaLS.filter(r => r.fecha === f).sort((a,b) => (b.id||'').localeCompare(a.id||''));
  if(!hoy.length){ c.innerHTML = '<div class="empty">Nadie marcado todavía en esta fecha.</div>'; return; }
  c.innerHTML = hoy.map(r => `<div class="row done">
      <div class="tick">✓</div>
      <div class="r-main">
        <div class="r-name">${esc(r.nombre)}</div>
        <div class="r-meta"><span class="ci">${esc(formatearCedula(r.ci)||'—')}</span> · ${r.horas} horas · ${esc(r.por||'')}</div>
      </div>
      <button class="x-btn" data-lsquitar="${esc(r.personaId)}" aria-label="Quitar">✕</button>
    </div>`).join('');
  c.querySelectorAll('[data-lsquitar]').forEach(b => b.addEventListener('click', async () => {
    revisionLocalLS++;
    asistenciaLS = asistenciaLS.filter(r => !(r.personaId === b.dataset.lsquitar && r.fecha === f));
    await Store.set('asis_asistenciaLS', asistenciaLS);
    renderLsPresentes(); renderLsBuscar($('#qls')?.value||''); renderLaboral();
    const r = await api('ls_desmarcar', { persona_id: b.dataset.lsquitar, fecha: f });
    if(!r.ok && !r.red) toast(r.error || 'No se pudo quitar');
    sincronizar();
  }));
}

function filaLS(p, conBoton){
  const editable = rolActual() === 'admin';
  const horas = horasLaboral(p.id);
  const pct = Math.min(100, Math.round(horas / metaLS() * 100));
  return `<div class="row ${p.laboral?'esvip':''}" data-lsrow="${esc(p.id)}" style="cursor:pointer">
      <div class="avatar ${p.laboral?'esvip':''}" style="width:38px;height:38px;font-size:14px;border-radius:10px">${esc(iniciales(p.nombre))}</div>
      <div class="r-main">
        <div class="r-name">${p.laboral?'<span class="star" style="color:var(--jade)">⏱</span>':''}${esc(p.nombre)}</div>
        <div class="r-meta"><span class="ci">${esc(formatearCedula(p.ci)||'sin CI')}</span> · ${horas} / ${metaLS()} horas (${pct}%)</div>
      </div>
      ${conBoton && editable ? `<button class="star-btn ${p.laboral?'on':''}" style="${p.laboral?'color:var(--jade)':''}" data-lstoggle="${esc(p.id)}" aria-label="${p.laboral?'Quitar de Labor Social':'Agregar a Labor Social'}">${p.laboral?'⏱':'○'}</button>` : '<div style="color:#B4BECD;font-size:20px">›</div>'}
    </div>`;
}
function enlazarFilasLS(cont){
  cont.querySelectorAll('[data-lstoggle]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const p = personas.find(x => x.id === b.dataset.lstoggle);
    if(p) marcarLaboral(p.id, !p.laboral);
  }));
  cont.querySelectorAll('[data-lsrow]').forEach(r => r.addEventListener('click', () => abrirCarnet(r.dataset.lsrow)));
}
function renderAsignarLS(){
  const cont = $('#lAsignar'); if(!cont) return;
  const term = $('#qlAsignar').value.trim();
  if(!term){ cont.innerHTML = ''; return; }
  const res = buscar(term, personas, 12);
  cont.innerHTML = res.length ? res.map(p => filaLS(p, true)).join('')
    : '<div class="empty" style="margin-top:10px"><b>Sin resultados</b>Nadie en la base coincide con la búsqueda.</div>';
  enlazarFilasLS(cont);
}
function renderListaLS(){
  const c = $('#lList'); if(!c) return;
  const lista0 = listaLaboral();
  $('#lCount').textContent = lista0.length + (lista0.length === 1 ? ' persona en Labor Social' : ' personas en Labor Social');
  if(!lista0.length){
    c.innerHTML = rolActual() === 'admin'
      ? '<div class="empty"><b>Todavía no hay nadie</b>Busca arriba a alguien de la base y toca el reloj para agregarlo.</div>'
      : '<div class="empty"><b>Todavía no hay nadie en Labor Social</b></div>';
    return;
  }
  const term = $('#ql')?.value;
  const lista = term ? buscar(term, lista0, 60) : lista0.slice(0, 60);
  c.innerHTML = lista.map(p => filaLS(p, rolActual() === 'admin')).join('')
    + (!term && lista0.length > 60 ? `<div class="empty">Mostrando 60 de ${lista0.length}.</div>` : '');
  enlazarFilasLS(c);
}

function filasReporteLS(){
  const desde = $('#lsDesde')?.value || '0000-01-01', hasta = $('#lsHasta')?.value || '9999-12-31';
  let base = asistenciaLS;
  if(lsRepTipo === 'individual' && lsRepPersona) base = base.filter(r => r.personaId === lsRepPersona.id);
  return base.filter(r => r.fecha >= desde && r.fecha <= hasta).sort((a,b) => a.fecha.localeCompare(b.fecha) || a.nombre.localeCompare(b.nombre));
}

function renderReporteLS(){
  const out = $('#lsResumen'); if(!out) return;
  const filas = filasReporteLS();
  const totalHoras = filas.reduce((a,r) => a + (r.horas||0), 0);

  if(lsRepTipo === 'individual' && lsRepPersona){
    const totalHistorico = horasLaboral(lsRepPersona.id);
    const pct = Math.min(100, Math.round(totalHistorico / metaLS() * 100));
    out.innerHTML = `<div class="stat"><div><b>${filas.length}</b><span>Marcas</span></div><div><b>${totalHoras}</b><span>Horas del período</span></div><div><b>${totalHistorico}</b><span>Horas totales</span></div></div>`
      + `<div class="warn" style="margin-top:0">Lleva <b>${totalHistorico} / ${metaLS()}</b> horas (${pct}%) de la meta, sumando todo su historial — no solo el período elegido.</div>`
      + (filas.length ? filas.slice().reverse().map(r => `<div class="row" style="cursor:default">
            <div class="r-main"><div class="r-name">${esc(r.fecha)}</div>
            <div class="r-meta">${r.horas} horas · ${esc(r.por||'—')}</div></div>
          </div>`).join('') : '<div class="empty">Sin marcas de esta persona en ese período.</div>');
    return;
  }

  const personasUnicas = new Set(filas.map(r => r.personaId)).size;
  if(!filas.length){ out.innerHTML = '<div class="empty">Nadie marcado en ese período.</div>'; return; }
  out.innerHTML = `<div class="stat"><div><b>${filas.length}</b><span>Marcas</span></div><div><b>${personasUnicas}</b><span>Personas</span></div><div><b>${totalHoras}</b><span>Horas</span></div></div>`
    + filas.slice().reverse().slice(0, 60).map(r => `<div class="row" style="cursor:default">
        <div class="r-main"><div class="r-name">${esc(r.nombre)}</div>
        <div class="r-meta"><span class="ci">${esc(formatearCedula(r.ci)||'—')}</span> · ${esc(r.fecha)} · ${r.horas} horas</div></div>
      </div>`).join('')
    + (filas.length > 60 ? `<div class="empty">Mostrando 60 de ${filas.length} marcas.</div>` : '');
}

function renderLaboral(){ renderLsPresentes(); renderListaLS(); if(lsVista === 'reporte') renderReporteLS(); }

function personasConHistorialLS(){
  const conRegistro = new Set(asistenciaLS.map(r => r.personaId));
  return personas.filter(p => p.laboral || conRegistro.has(p.id));
}

