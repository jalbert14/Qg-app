/* =========================================================
   CONTROLADOR DE LA VISTA DE CONSULTA Y BUSQUEDA DE INSCRITOS
   ========================================================= */
function filaConsulta(p){
  return `<button class="row ${p.vip?'esvip':''}" data-id="${esc(p.id)}">
      <div class="r-main"><div class="r-name">${p.vip?'<span class="star">★</span>':''}${esc(p.nombre)}</div>
      <div class="r-meta"><span class="ci">${esc(formatearCedula(p.ci) || 'sin CI')}</span> · ${esc(secundario(p) || '—')}</div></div>
      <div style="color:#B4BECD;font-size:20px">›</div>
    </button>`;
}

function enlazarFilasConsulta(out){
  out.querySelectorAll('.row[data-id]').forEach(r => r.addEventListener('click', () => {
    consultaSel = r.dataset.id; renderConsulta(); window.scrollTo(0, 0);
  }));
}

function renderConsulta(){
  const out = $('#consultaOut'); if(!out) return;
  const f = $('#consultaFiltros');
  if(f) f.innerHTML = `<div class="searchbar"><input id="qc" placeholder="Nombre o cédula…" value="${esc($('#qc')?.value||'')}"></div>`;
  const qc = $('#qc');
  if(qc) qc.addEventListener('input', () => { consultaSel = null; renderConsulta(); });

  if(consultaSel){
    const p = personaPorId(consultaSel);
    if(!p){ consultaSel = null; renderConsulta(); return; }
    const ya = activa.presentes.find(x => x.id === p.id);
    const esf = entradasFicha(p);
    out.innerHTML = `<button class="btn ghost small" id="btnVolverConsulta" style="margin-bottom:12px">← Volver a buscar</button>`
      + `<div class="verdict yes">
          <div class="vd-bar"><div class="vd-mark">✓</div><b>ESTUDIANTE INSCRITO</b></div>
          <div class="vd-body">
            <div class="vd-name">${esc(p.nombre)}</div>
            <div class="vd-grid">${esf.map(f => `<div class="field"><label>${esc(f[0])}</label><div>${esc(f[1]||'—')}</div></div>`).join('')}</div>
          </div>
          <div class="vd-hist"><div>Estatus: <b>${ya?'Presente hoy':'Ausente hoy'}</b></div></div>
        </div>`;
    $('#btnVolverConsulta').addEventListener('click', () => { consultaSel = null; renderConsulta(); });
    return;
  }

  const term = $('#qc')?.value.trim();
  if(!term){
    out.innerHTML = '<div class="empty">Escribe el nombre o cédula de un estudiante para consultar su inscripción.</div>';
    return;
  }
  const res = buscar(term, personas, 15);
  out.innerHTML = res.length
    ? res.map(filaConsulta).join('')
    : '<div class="empty"><b>Sin resultados</b>Nadie en la base coincide con la búsqueda.</div>';
  enlazarFilasConsulta(out);
}
