/* =========================================================
   CONTROLADOR DE LA VISTA DE PROSPECTOS
   ========================================================= */
function claveDupProspecto(nombre, ci){
  const c = normCI(ci); return c ? 'ci:' + c : 'n:' + claveNombre(nombre);
}
function coincidenciaProspecto(nombre, ci, excluirId){
  const clave = claveDupProspecto(nombre, ci);
  return prospectos.find(x => x.id !== excluirId && claveDupProspecto(x.nombre, x.ci) === clave);
}

function renderProspectos(){
  const c = $('#prList'); if(!c) return;
  $('#prCount').textContent = prospectos.length + (prospectos.length === 1 ? ' registrado' : ' registrados');
  if(!prospectos.length){
    c.innerHTML = '<div class="empty"><b>Todavía no hay prospectos</b>Registra a alguien interesado en conocer más sobre QG.</div>';
    return;
  }
  const term = $('#qpr')?.value;
  const lista = term ? buscar(term, prospectos, 60) : prospectos.slice(0, 60);
  c.innerHTML = lista.map(p => `<div class="row" data-prrow="${esc(p.id)}" style="cursor:pointer">
      <div class="avatar" style="width:38px;height:38px;font-size:14px;border-radius:10px">${esc(iniciales(p.nombre))}</div>
      <div class="r-main">
        <div class="r-name">${esc(p.nombre)}</div>
        <div class="r-meta"><span class="ci">${esc(formatearCedula(p.ci) || 'sin CI')}</span>${p.anio ? ' · ' + esc(p.anio) : ''}${p.colegio ? ' · ' + esc(p.colegio) : ''}</div>
      </div>
      <button class="x-btn" data-prdel="${esc(p.id)}" aria-label="Eliminar">✕</button>
    </div>`).join('') + (!term && prospectos.length > 60 ? `<div class="empty">Mostrando 60 de ${prospectos.length}.</div>` : '');
  c.querySelectorAll('[data-prrow]').forEach(r => r.addEventListener('click', () => {
    const p = prospectos.find(x => x.id === r.dataset.prrow);
    if(p) abrirProspecto(p);
  }));
  c.querySelectorAll('[data-prdel]').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    push('prospecto_del', { id: b.dataset.prdel });
    prospectos = prospectos.filter(p => p.id !== b.dataset.prdel);
    await Store.set('asis_prospectos', prospectos);
    renderProspectos();
    toast('Prospecto eliminado');
  }));
}

function revisarProspecto(){
  const n = $('#prNombre').value.trim(), ci = $('#prCi').value.trim();
  const box = $('#prAviso');
  const otro = (n || ci) ? coincidenciaProspecto(n, ci, editandoProspectoId) : null;
  if(otro && normCI(ci)){
    box.classList.remove('hidden');
    box.innerHTML = `Ya hay un prospecto con esa cédula: <b>${esc(otro.nombre)}</b>. Se va a actualizar ese registro en vez de crear uno nuevo.`;
  } else {
    box.classList.add('hidden'); box.innerHTML = '';
  }
}

function abrirProspecto(p){
  editandoProspectoId = p ? p.id : null;
  $('#prTitulo').textContent = p ? 'Editar prospecto' : 'Agregar prospecto';
  $('#prNombre').value = p ? p.nombre : '';
  $('#prCi').value = p ? (p.ci || '') : '';
  $('#prAnio').value = p ? (p.anio || '') : '';
  $('#prColegio').value = p ? (p.colegio || '') : '';
  $('#prCorreo').value = p ? (p.correo || '') : '';
  $('#prTelefono').value = p ? (p.telefono || '') : '';
  $('#prExtras').innerHTML = camposProspectos().map(c =>
    `<label class="lbl">${esc(c)}</label><textarea class="inp" data-campo="${esc(c)}" rows="2" style="resize:vertical;font-family:inherit" placeholder="${esc(c)}">${esc((p && p.extra && p.extra[c]) || '')}</textarea>`).join('');
  $('#prAviso').className = 'warn hidden'; $('#prAviso').innerHTML = '';
  $('#btnDelProspecto').classList.toggle('hidden', !p);
  sheet('#shProspecto');
  setTimeout(() => $('#prNombre').focus(), 260);
}
