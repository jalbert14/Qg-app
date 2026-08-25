/* =========================================================
   SERVICIO DE IMPORTACIÓN Y EXPORTACIÓN EXCEL (XLSX)
   ========================================================= */
const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function leerImport(f){
  if(!f) return;
  const rd = new FileReader();
  rd.onload = ev => {
    try{
      const wb = XLSX.read(new Uint8Array(ev.target.result), {type:'array'});
      const ws = wb.Sheets[wb.SheetNames[0]];
      const filas = XLSX.utils.sheet_to_json(ws, {header:1, blankrows:false, defval:''});
      if(filas.length < 2){ toast('El archivo no tiene datos'); return; }
      let hi = 0;
      for(let i=0;i<Math.min(6,filas.length);i++){ if(filas[i].filter(c=>String(c).trim()).length >= 2){ hi = i; break; } }
      const cab = filas[hi].map((c,i) => String(c).trim() || ('Columna ' + (i+1)));
      const datos = filas.slice(hi+1).filter(r => r.some(c => String(c).trim()));
      pendingImport = { cab, datos, nombreArchivo: f.name };
      const opts = cab.map((c,i) => `<option value="${i}">${esc(c)}</option>`).join('') + '<option value="-1">— ninguna —</option>';
      $('#mapNombre').innerHTML = opts; $('#mapCi').innerHTML = opts; $('#mapCol').innerHTML = opts;
      const find = (...keys) => { const i = cab.findIndex(c => keys.some(k => norm(c).includes(k))); return i; };
      const nm = find('nombre','apellido','estudiante','alumno','participante');
      $('#mapNombre').value = String(nm >= 0 ? nm : 0);
      const ci = find('ci','cedula','documento','dni','identidad'); $('#mapCi').value = String(ci >= 0 ? ci : -1);
      const co = find('colegio','institucion','plantel','escuela','liceo','unidad educativa');
      $('#mapCol').value = String(co >= 0 ? co : -1);
      $('#mapSub').textContent = `${f.name} · ${datos.length} filas detectadas`;
      mostrarExtras(); avisoReemplazo();
      sheet('#shMap');
    }catch(err){ toast('No se pudo leer el archivo'); }
  };
  rd.readAsArrayBuffer(f);
}

function columnasExtra(){
  if(!pendingImport) return [];
  const usados = [+$('#mapNombre').value, +$('#mapCi').value, +$('#mapCol').value];
  return pendingImport.cab.map((c, i) => ({ c: String(c).trim(), i }))
    .filter(x => usados.indexOf(x.i) < 0 && x.c && !/^Columna \d+$/.test(x.c));
}

function mostrarExtras(){
  const ex = columnasExtra();
  $('#mapExtras').innerHTML = ex.length
    ? 'Las demás columnas se guardan como datos adicionales y aparecerán en la ficha de cada persona: <b>' + ex.map(x => esc(x.c)).join(', ') + '</b>.'
    : 'Este archivo no trae columnas adicionales. Si más adelante le agregas una, aparecerá aquí y en la ficha.';
}

function avisoReemplazo(){
  const pend = personas.filter(p => p.nuevo && !p.exportado).length;
  const w = $('#mapWarn');
  const mostrar = pend > 0 && importMode === 'replace';
  w.classList.toggle('hidden', !mostrar);
  if(mostrar) w.innerHTML = `Tienes <b>${pend}</b> ${pend===1?'persona agregada':'personas agregadas'} en la app que no están en ningún archivo. Si reemplazas la lista se pierden. Genera primero el archivo actualizado, o elige "Agregar". <b>Las estrellas de JxJ se conservan</b> para quien reaparezca en el archivo nuevo.`;
}

function libroSesion(ses){
  if(typeof XLSX === 'undefined'){ toast('Conéctate a internet una vez para habilitar Excel'); return null; }
  const cs = campos();
  const mapearColegio = construirMapaColegios(ses.presentes);
  const filas = ordenarPorColegio(ses.presentes).map((p, i) => {
    const p0 = personaPorId(p.id);
    const o = { 'N': i + 1, Nombre: p.nombre, Cedula: formatearCedula(p.ci), Lista: p.lista === 'JxJ' ? 'JxJ' : (p.lista === 'prospecto' ? 'Prospecto' : 'Base'), Universidad: mapearColegio(p) };
    cs.forEach(c => { o[c] = valorExtra(p0, c); });
    o.Hora = p.hora || '';
    o.Marcado_por = p.por || '';
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(filas);
  ws['!cols'] = [{wch:4},{wch:30},{wch:15},{wch:8},{wch:26}].concat(cs.map(() => ({wch:16})), [{wch:8},{wch:18}]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
    Institucion: ajustes.org || '', Sesion: ses.titulo || 'Sin título',
    Fecha: ses.fecha, Total_presentes: ses.presentes.length, Generado: hoyISO() + ' ' + horaCorta(),
    Generado_por: conn.usuario || ''
  }]), 'Resumen');
  return wb;
}

function libroLaboral(){
  if(typeof XLSX === 'undefined'){ toast('Conéctate a internet una vez para habilitar Excel'); return null; }
  const individual = lsRepTipo === 'individual' && lsRepPersona;
  const filas = filasReporteLS();
  const wb = XLSX.utils.book_new();
  const encabezadoResumen = { Institucion: ajustes.org || 'Queremos Graduarnos',
    Reporte: individual ? 'Individual · ' + lsRepPersona.nombre : 'General de Labor Social',
    Generado_por: conn.usuario || '', Generado_el: hoyISO() + ' ' + horaCorta() };
  if(individual){
    const ws = XLSX.utils.json_to_sheet(filas.map(r => ({ Fecha:r.fecha, Horas:r.horas, Marcado_por:r.por||'' })));
    ws['!cols'] = [{wch:12},{wch:8},{wch:20}];
    XLSX.utils.book_append_sheet(wb, ws, 'Labor Social');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([Object.assign({
      Nombre: lsRepPersona.nombre, Cedula: lsRepPersona.ci || '', Horas_del_periodo: filas.reduce((a,r)=>a+r.horas,0),
      Horas_totales: horasLaboral(lsRepPersona.id), Meta: metaLS()
    }, encabezadoResumen)]), 'Resumen');
  } else {
    const ws = XLSX.utils.json_to_sheet(filas.map(r => ({ Fecha:r.fecha, Nombre:r.nombre, Cedula:r.ci||'', Horas:r.horas, Marcado_por:r.por||'' })));
    ws['!cols'] = [{wch:12},{wch:30},{wch:15},{wch:8},{wch:20}];
    XLSX.utils.book_append_sheet(wb, ws, 'Labor Social');
    const resumen = Array.from(new Set(filas.map(r=>r.personaId))).map(id => {
      const p = filas.filter(r=>r.personaId===id);
      return { Nombre:p[0].nombre, Cedula:p[0].ci||'', Horas_del_periodo: p.reduce((a,r)=>a+r.horas,0), Horas_totales: horasLaboral(id), Meta: metaLS() };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen.length ? resumen : [encabezadoResumen]), 'Resumen');
  }
  return wb;
}
