/* =========================================================
   CONTROLADOR DE LA VISTA JXJ (ESTUDIANTES VIP)
   ========================================================= */
async function marcarJxJ(id, on){
  const p = personas.find(x => x.id === id); if(!p) return;
  p.vip = on;
  await Store.set('asis_personas', personas);
  push('jxj_set', { id: p.id, jxj: on });
  toast(on ? ('★ ' + p.nombre.split(' ')[0] + ' ahora es JxJ') : (p.nombre.split(' ')[0] + ' ya no es JxJ'));
  renderAll();
}

function filaJxJ(p, conEstrella){
  const editable = rolActual() === 'admin';
  return `<div class="row ${p.vip ? 'esvip' : ''}" data-jxjrow="${esc(p.id)}" style="cursor:pointer">
      <div class="avatar ${p.vip ? 'esvip' : ''}" style="width:38px;height:38px;font-size:14px;border-radius:10px">${esc(iniciales(p.nombre))}</div>
      <div class="r-main">
        <div class="r-name">${p.vip ? '<span class="star">★</span>' : ''}${esc(p.nombre)}</div>
        <div class="r-meta"><span class="ci">${esc(formatearCedula(p.ci) || 'sin CI')}</span>${secundario(p) ? ' · ' + esc(secundario(p)) : ''}</div>
      </div>
      ${conEstrella && editable ? `<button class="star-btn ${p.vip ? 'on' : ''}" data-toggle="${esc(p.id)}" aria-label="${p.vip ? 'Quitar de JxJ' : 'Agregar a JxJ'}">${p.vip ? '★' : '☆'}</button>` : '<div style="color:#B4BECD;font-size:20px">›</div>'}
    </div>`;
}

function enlazarFilasJxJ(cont){
  cont.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const p = personas.find(x => x.id === b.dataset.toggle);
    if(p) marcarJxJ(p.id, !p.vip);
  }));
  cont.querySelectorAll('[data-jxjrow]').forEach(r => r.addEventListener('click', () => abrirCarnet(r.dataset.jxjrow)));
}

function renderAsignarJxJ(){
  const cont = $('#jxjAsignar'); if(!cont) return;
  const term = $('#qvAsignar').value.trim();
  if(!term){ cont.innerHTML = ''; return; }
  const res = buscar(term, personas, 12);
  cont.innerHTML = res.length
    ? res.map(p => filaJxJ(p, true)).join('')
    : '<div class="empty" style="margin-top:10px"><b>Sin resultados</b>Nadie en la base coincide con la búsqueda.</div>';
  enlazarFilasJxJ(cont);
}

function renderJxJ(){
  const c = $('#vipList'); if(!c) return;
  const lista0 = listaVip();
  $('#vipCount').textContent = lista0.length + (lista0.length === 1 ? ' persona en JxJ' : ' personas en JxJ');
  if(!lista0.length){
    c.innerHTML = rolActual() === 'admin'
      ? '<div class="empty"><b>Todavía no hay nadie en JxJ</b>Busca arriba a alguien de la base y toca la estrella para agregarlo.</div>'
      : '<div class="empty"><b>Todavía no hay nadie en JxJ</b></div>';
    return;
  }
  const term = $('#qv').value;
  const lista = term ? buscar(term, lista0, 60) : lista0.slice(0, 60);
  c.innerHTML = lista.map(p => filaJxJ(p, rolActual() === 'admin')).join('')
    + (!term && lista0.length > 60 ? `<div class="empty">Mostrando 60 de ${lista0.length}.</div>` : '');
  enlazarFilasJxJ(c);
}
