/* =========================================================
   CARNET DIGITAL E IDENTIDAD DE ESTUDIANTES
   ========================================================= */
function abrirCarnet(id){
  const p = personaPorId(id); if(!p) return;
  const esProspecto = esProspectoId(id);
  seleccion = Object.assign({}, p, { esProspecto });
  const ya = activa.presentes.find(x => x.id === p.id);
  $('#cnIni').textContent = iniciales(p.nombre);
  $('#cnName').textContent = p.nombre;
  $('#cnCi').textContent = formatearCedula(p.ci) || '—';
  $('#cnCol').textContent = secundario(p) || '—';
  $('#cnIni').classList.toggle('esvip', !esProspecto && !!p.vip);

  if(esProspecto){
    const datos = [['Año que cursa', p.anio || '', false], ['Correo', p.correo || '', false], ['Teléfono', p.telefono || '', false]]
      .concat(Object.keys(p.extra || {}).map(k => [k, p.extra[k] || '', false]))
      .filter(f => f[1]);
    $('#cnExtras').innerHTML = datos.length
      ? `<div class="sec-label" style="margin:14px 0 6px">Datos del prospecto</div>`
        + datos.map(f => `<div class="field"><label>${esc(f[0])}</label><div>${esc(f[1])}</div></div>`).join('')
      : '';
    $('#cnTag').textContent = '✉ Prospecto · ' + activa.fecha;
  } else {
    const entradasCarnet = entradasFicha(p).filter(f => !['Cédula','Universidad','JxJ'].includes(f[0]));
    const bloqueCarnet = (grupo, titulo) => {
      const visibles = entradasCarnet.filter(f => f[3] === grupo && f[1]);
      if(!visibles.length) return '';
      return `<div class="sec-label" style="margin:14px 0 6px">${esc(titulo)}</div>`
        + visibles.map(f => `<div class="field"><label>${esc(f[0])}</label><div>${esc(f[1])}</div></div>`).join('');
    };
    $('#cnExtras').innerHTML = bloqueCarnet('personal', 'Información personal')
      + bloqueCarnet('academica', 'Información académica')
      + bloqueCarnet('adicional', 'Información adicional');
    $('#cnTag').textContent = p.vip ? '★ JxJ · ' + activa.fecha : activa.fecha;
  }
  $('#cnStamp').classList.toggle('on', !!ya);
  $('#cnStamp').style.opacity = ya ? .92 : 0;
  $('#cnFoot').textContent = ya ? 'Registrado a las ' + ya.hora : 'Sin registrar';
  $('#btnConfirmar').textContent = ya ? 'Quitar de la lista' : 'Confirmar asistencia';
  $('#btnConfirmar').className = ya ? 'btn ghost' : 'btn jade';
  sheet('#shCarnet');
}
