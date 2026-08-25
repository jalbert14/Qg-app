/* =========================================================
   CONTROLADOR DE LA VISTA DE ASISTENCIA
   ========================================================= */
function textoBusqueda(p){
  let s = idxBusq.get(p.id);
  if(s === undefined){
    s = norm(p.nombre) + ' ' + norm(p.ci) + ' ' + normCI(p.ci).toLowerCase() + ' ' + norm(p.colegio);
    idxBusq.set(p.id, s);
  }
  return s;
}

function buscar(term, lista, limite){
  const t = norm(term); if(!t) return [];
  const partes = t.split(' ');
  const tope = limite || 10, res = [];
  for(let i = 0; i < lista.length && res.length < tope; i++){
    const hay = textoBusqueda(lista[i]);
    let ok = true;
    for(let k = 0; k < partes.length; k++){ if(hay.indexOf(partes[k]) < 0){ ok = false; break; } }
    if(ok) res.push(lista[i]);
  }
  return res;
}

function renderResults(term){
  const cont = $('#results');
  if(!term){ cont.innerHTML=''; return; }
  if(!personas.length && !prospectos.length){
    cont.innerHTML = '<div class="empty" style="margin-top:10px"><b>No hay base de datos</b>Ve a Personas y carga tu archivo de Excel.</div>';
    return;
  }
  const res = buscarTodo(term, 12);
  if(!res.length){
    cont.innerHTML = '<div class="empty" style="margin-top:10px"><b>Sin resultados</b>Nadie en la base coincide con «' + esc(term) + '».</div>'
      + '<button class="btn ghost" id="btnAltaAsist">Registrar como persona nueva</button>';
    $('#btnAltaAsist').addEventListener('click', () => abrirAlta(term.trim(), true));
    return;
  }
  cont.innerHTML = '<div style="height:10px"></div>' + res.map(p => {
    const yes = activa.presentes.some(x => x.id === p.id);
    const esProsp = esProspectoId(p.id);
    return `<button class="row ${yes?'done':''} ${p.vip?'esvip':''}" data-id="${esc(p.id)}">
      <div class="avatar ${p.vip?'esvip':''}" style="width:38px;height:38px;font-size:14px;border-radius:10px">${esc(iniciales(p.nombre))}</div>
      <div class="r-main">
        <div class="r-name">${p.vip?'<span class="star">★</span>':''}${esc(p.nombre)}${esProsp?' <span class="pill grey">Prospecto</span>':''}</div>
        <div class="r-meta"><span class="ci">${esc(formatearCedula(p.ci)||'sin CI')}</span> · ${esc(secundario(p)||'—')}</div>
      </div>
      ${yes?'<div class="tick">✓</div>':'<div style="color:#B4BECD;font-size:20px">›</div>'}
    </button>`;
  }).join('');
  cont.querySelectorAll('.row').forEach(r => r.addEventListener('click', () => abrirCarnet(r.dataset.id)));
}

function renderAvisoDia(){
  const w = $('#diaWarn'); if(!w) return;
  const otroDia = activa.presentes.length > 0 && activa.fecha !== hoyISO();
  w.classList.toggle('hidden', !otroDia);
  if(!otroDia) return;
  w.innerHTML = `<span class="dup-tit">Lista sin cerrar del ${esc(fechaLarga(activa.fecha))}</span>`
    + `Tiene ${activa.presentes.length} ${activa.presentes.length === 1 ? 'persona' : 'personas'}. Si sigues marcando, se suman a esa lista y el PDF saldrá con esa fecha.`
    + '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">'
    + '<button class="dup-btn" id="btnCerrarVieja">Cerrarla y generar su PDF</button>'
    + '<button class="dup-btn" id="btnNuevaHoy" style="background:transparent;color:inherit;border:1.5px solid currentColor">Guardarla y empezar la de hoy</button></div>';
  $('#btnCerrarVieja').addEventListener('click', () => $('#btnCerrar').click());
  $('#btnNuevaHoy').addEventListener('click', async () => {
    sesiones.unshift(JSON.parse(JSON.stringify(activa)));
    activa = { id: uid(), titulo:'', fecha: hoyISO(), presentes: [] };
    revisionLocal++;
    await Store.set('asis_sesiones', sesiones);
    await Store.set('asis_activa', activa);
    renderAll();
    toast('Lista anterior guardada en el historial');
  });
}

function renderPresentes(){
  const c = $('#presentes');
  if(!activa.presentes.length){
    c.innerHTML = '<div class="empty"><b>Lista vacía</b>Busca a una persona arriba y confirma su asistencia.</div>';
    $('#btnCerrar').disabled = true; return;
  }
  $('#btnCerrar').disabled = false;
  c.innerHTML = activa.presentes.map((p,i) => `<div class="row done ${p.lista === 'JxJ' ? 'esvip' : ''}">
      <div class="tick">✓</div>
      <div class="r-main">
        <div class="r-name">${p.lista === 'JxJ' ? '<span class="star">★</span>' : ''}${esc(p.nombre)}${p.lista === 'prospecto' ? ' <span class="pill grey">Prospecto</span>' : ''}</div>
        <div class="r-meta"><span class="ci">${esc(formatearCedula(p.ci)||'—')}</span> · ${esc(p.colegio||'—')} · ${esc(p.hora)}</div>
      </div>
      <button class="x-btn" data-i="${i}" aria-label="Quitar">✕</button>
    </div>`).join('');
  c.querySelectorAll('.x-btn').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    push('desmarcar', { persona_id: activa.presentes[+b.dataset.i].id });
    revisionLocal++;
    activa.presentes.splice(+b.dataset.i, 1);
    await Store.set('asis_activa', activa);
    renderStrip(); renderPresentes(); renderResults($('#q').value);
  }));
}

async function cerrarSesionAsistencia(){
  if(!activa || !activa.presentes || !activa.presentes.length){
    toast('La lista está vacía');
    return;
  }
  
  cargando(true, 'Generando PDF...');
  try {
    const sesCerrada = JSON.parse(JSON.stringify(activa));
    sesiones.unshift(sesCerrada);
    await Store.set('asis_sesiones', sesiones);
    
    const doc = generarPDF(sesCerrada);
    const nombre = (sesCerrada.titulo ? norm(sesCerrada.titulo).replace(/ /g,'_') + '_' : '') + 'Asistencia_' + sesCerrada.fecha + '.pdf';
    
    if(doc){
      const blob = doc.output('blob');
      await compartirArchivo(blob, nombre, 'application/pdf', doc);
      guardarEnNube(blob, nombre, 'application/pdf', 'Listas de Asistencia', sesCerrada.fecha);
    }
    
    activa = { id: uid(), titulo:'', fecha: hoyISO(), presentes: [] };
    revisionLocal++;
    await Store.set('asis_activa', activa);
    
    renderAll();
    toast('Sesión cerrada y PDF generado');
  } catch(e) {
    console.error('Error al cerrar sesión de asistencia:', e);
    toast('Ocurrió un error al generar el PDF.');
  } finally {
    cargando(false);
  }
}
