/* =========================================================
   CONTROLADOR DEL HISTORIAL DE SESIONES E INFORMES
   ========================================================= */
let sesionActual = null;
let repPersonaSel = null;

function renderSesiones(){
  const c = $('#sesionesList'); if(!c) return;
  if(!sesiones.length){
    c.innerHTML = '<div class="empty"><b>Historial vacío</b>Las listas cerradas aparecerán aquí.</div>';
    return;
  }
  c.innerHTML = sesiones.map(s => `<button class="row" data-ses="${esc(s.id)}">
      <div class="r-main">
        <div class="r-name">${esc(s.titulo || 'Sesión sin título')}</div>
        <div class="r-meta">${esc(fechaLarga(s.fecha))} · ${s.presentes.length} presentes</div>
      </div>
      <div style="color:#B4BECD;font-size:20px">›</div>
    </button>`).join('');
  c.querySelectorAll('[data-ses]').forEach(r => r.addEventListener('click', () => {
    const s = sesiones.find(x => x.id === r.dataset.ses);
    if(s) abrirDetalleSesion(s);
  }));
}

function abrirDetalleSesion(ses){
  sesionActual = ses;
  $('#dsTitulo').textContent = ses.titulo || 'Sesión sin título';
  $('#dsSub').textContent = fechaLarga(ses.fecha) + ' · ' + ses.presentes.length + ' presentes';
  $('#dsCount').textContent = ses.presentes.length;
  $('#dsLista').innerHTML = ses.presentes.length
    ? ses.presentes.map((p,i) => `<div class="row done">
        <div class="tick">${i+1}</div>
        <div class="r-main">
          <div class="r-name">${esc(p.nombre)}</div>
          <div class="r-meta"><span class="ci">${esc(formatearCedula(p.ci)||'—')}</span> · ${esc(p.colegio||'—')} · ${esc(p.hora)}</div>
        </div>
      </div>`).join('')
    : '<div class="empty">Sin registrados.</div>';
  sheet('#shDetalleSesion');
}

function renderReportePer(){
  const out = $('#reportePer'); if(!out) return;
  const f = $('#histPerFiltros');
  if(f) f.innerHTML = `<div class="searchbar"><input id="qhp" placeholder="Nombre o cédula…" value="${esc($('#qhp')?.value||'')}"></div>`;
  const qhp = $('#qhp');
  if(qhp) qhp.addEventListener('input', () => { repPersonaSel = null; renderReportePer(); });

  if(repPersonaSel){
    const p = personaPorId(repPersonaSel);
    if(!p){ repPersonaSel = null; renderReportePer(); return; }
    const asistencias = [];
    sesiones.forEach(s => {
      const hit = s.presentes.find(x => x.id === p.id);
      if(hit) asistencias.push({ fecha: s.fecha, titulo: s.titulo, hora: hit.hora });
    });
    out.innerHTML = `<button class="btn ghost small" id="btnVolverRepPer" style="margin-bottom:12px">← Volver a buscar</button>`
      + `<div class="card">
          <div style="font-family:'Archivo';font-weight:600;font-size:20px">${esc(p.nombre)}</div>
          <div style="color:var(--slate);font-size:13.5px;margin-top:2px"><span class="mono">${esc(formatearCedula(p.ci)||'sin CI')}</span> · ${esc(secundario(p)||'—')}</div>
          <div class="stat" style="margin-top:14px"><div><b>${asistencias.length}</b><span>Asistencias totales</span></div><div><b>${sesiones.length}</b><span>Sesiones registradas</span></div></div>
          ${asistencias.length ? asistencias.map(a => `<div class="row done" style="margin-top:8px">
            <div class="tick">✓</div>
            <div class="r-main"><div class="r-name">${esc(a.titulo||'Sesión sin título')}</div><div class="r-meta">${esc(fechaLarga(a.fecha))} · ${esc(a.hora)}</div></div>
          </div>`).join('') : '<div class="empty" style="margin-top:12px">No tiene asistencias en el historial registrado.</div>'}
        </div>`;
    $('#btnVolverRepPer').addEventListener('click', () => { repPersonaSel = null; renderReportePer(); });
    return;
  }

  const term = $('#qhp')?.value.trim();
  if(!term){
    out.innerHTML = '<div class="empty">Busca a un estudiante para ver su récord histórico de asistencias.</div>';
    return;
  }
  const res = buscar(term, personas, 15);
  out.innerHTML = res.length
    ? res.map(p => `<button class="row" data-hpid="${esc(p.id)}">
        <div class="r-main"><div class="r-name">${esc(p.nombre)}</div><div class="r-meta"><span class="ci">${esc(formatearCedula(p.ci)||'—')}</span> · ${esc(secundario(p)||'—')}</div></div>
        <div style="color:#B4BECD;font-size:20px">›</div>
      </button>`).join('')
    : '<div class="empty">Nadie coincide con esa búsqueda.</div>';
  out.querySelectorAll('[data-hpid]').forEach(r => r.addEventListener('click', () => {
    repPersonaSel = r.dataset.hpid; renderReportePer();
  }));
}
