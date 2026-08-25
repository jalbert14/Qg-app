/* =========================================================
   SERVICIO DE GENERACIÓN Y MANEJO DE DOCUMENTOS PDF (jsPDF)
   ========================================================= */
const LOGO_PDF = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAQDAwMDAgQDAwMEBAQFBgoGBgUFBgwICQcKDgwPDg4MDQ0PERYTDxAVEQ0NExoTFRcYGRkZDxIbHRsYHRYYGRj/2wBDAQQEBAYFBgsGBgsYEA0QGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBj/wAARCAEeAaQDASIAAhEBAxEB/8QAHQABAAEFAQEBAAAAAAAAAAAAAAgEBQYHCQMBAv/EAFEQAAEDAwIEAwQGBgUHCQkAAAEAAgMEBQYHERIhMUEIUWETInGBFDJCkaGxFSnxtp/o3p1p/o3p1p/o3p1p/o3p1p/o3p1p/o3p1p/o3p1p/o3p1p/o3p1p/o3p1p';


function generarPDF(ses){
  if(!window.jspdf){ toast('Conéctate a internet una vez para habilitar el PDF'); return null; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const L = 15, R = 195, W = R - L;
  const cx = (ajustes.pdfCampo && campos().indexOf(ajustes.pdfCampo) >= 0) ? ajustes.pdfCampo : '';
  const cols = cx
    ? [ {t:'#', w:9}, {t:'Nombre y apellido', w:58}, {t:'Cédula', w:26}, {t:'Universidad', w:40}, {t:cx, w:27}, {t:'Hora', w:20} ]
    : [ {t:'#', w:9}, {t:'Nombre y apellido', w:66}, {t:'Cédula', w:28}, {t:'Universidad', w:57}, {t:'Hora', w:20} ];
  let y = 0, pag = 0;

  const encabezado = () => {
    pag++;
    try{ doc.addImage(LOGO_PDF, 'JPEG', L, 9, 29, 29*682/1000); }catch(e){}
    doc.setTextColor(0,40,113); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    doc.text((ajustes.org || 'Queremos Graduarnos').slice(0,42), L+33, 17);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(125,135,155);
    doc.text('REGISTRO DE PRESENTES', L+33, 22.5);
    doc.setFillColor(0,40,113); doc.rect(L, 28.5, W, 1.1, 'F');
    doc.setFillColor(223,117,13); doc.rect(L, 28.5, 26, 1.1, 'F');
    doc.setTextColor(30); y = 38;
    if(pag === 1){
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.text(ses.titulo || 'Sesión sin título', L, y); y += 6;
      doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(90);
      const nvip = ses.presentes.filter(x => x.lista === 'JxJ').length;
      const npros = ses.presentes.filter(x => x.lista === 'prospecto').length;
      doc.text(fechaLarga(ses.fecha) + '  ·  Total de presentes: ' + ses.presentes.length
        + (nvip ? '  (' + nvip + ' de JxJ)' : '') + (npros ? '  (' + npros + ' prospectos)' : ''), L, y);
      doc.setTextColor(30); y += 8;
    }
    doc.setFillColor(232,238,248); doc.rect(L, y, W, 8, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    let x = L + 2; cols.forEach(c => { doc.text(c.t, x, y + 5.5); x += c.w; });
    y += 8; doc.setFont('helvetica','normal'); doc.setFontSize(9.5);
  };
  const cortar = (txt, w) => { let s = String(txt||'—'); while(doc.getTextWidth(s) > w - 4 && s.length > 3) s = s.slice(0,-1); return s; };
  const saltarPagina = () => {
    doc.setFontSize(8); doc.setTextColor(140); doc.text('Página ' + pag, 105, 288, {align:'center'});
    doc.addPage(); encabezado();
  };

  encabezado();
  const mapearColegio = construirMapaColegios(ses.presentes);
  const ordenados = ordenarPorColegio(ses.presentes);
  let colegioAnterior = null, contador = 0;
  ordenados.forEach((p) => {
    const colegioActual = mapearColegio(p) || 'Sin universidad';
    const cambiaGrupo = colegioActual !== colegioAnterior;
    if(y + (cambiaGrupo ? 13.5 : 7) > 275) saltarPagina();
    if(cambiaGrupo){
      doc.setFillColor(0,40,113); doc.rect(L, y, W, 6.5, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(255,255,255);
      doc.text(cortar(colegioActual.toUpperCase(), W - 4), L + 2, y + 4.5);
      y += 6.5; doc.setFont('helvetica','normal'); doc.setFontSize(9.5);
      colegioAnterior = colegioActual;
    }
    contador++;
    if(contador % 2 === 0){ doc.setFillColor(246,249,253); doc.rect(L, y, W, 7, 'F'); }
    doc.setTextColor(30);
    let x = L + 2;
    const marca = p.lista === 'JxJ' ? '* ' : (p.lista === 'prospecto' ? '+ ' : '');
    const vals = cx
      ? [String(contador), marca + p.nombre, formatearCedula(p.ci) || '—', colegioActual, valorExtra(personaPorId(p.id), cx) || '—', p.hora || '—']
      : [String(contador), marca + p.nombre, formatearCedula(p.ci) || '—', colegioActual, p.hora || '—'];
    vals.forEach((v, k) => { doc.text(cortar(v, cols[k].w), x, y + 4.8); x += cols[k].w; });
    doc.setDrawColor(224,229,237); doc.line(L, y + 7, R, y + 7);
    y += 7;
  });

  y += 14;
  if(y > 262){ doc.addPage(); encabezado(); y += 10; }
  doc.setDrawColor(120); doc.line(L, y, L + 62, y); doc.line(R - 62, y, R, y);
  doc.setFontSize(8.5); doc.setTextColor(110);
  doc.text('Firma del responsable', L, y + 5); doc.text('Sello', R - 62, y + 5);
  let yPie = y + 12;
  if(ses.presentes.some(x => x.lista === 'JxJ')){
    doc.setFontSize(8); doc.setTextColor(120);
    doc.text('*  Integrante de la lista JxJ', L, yPie); yPie += 5;
  }
  if(ses.presentes.some(x => x.lista === 'prospecto')){
    doc.setFontSize(8); doc.setTextColor(120);
    doc.text('+  Prospecto, todavía no inscrito formalmente', L, yPie);
  }
  doc.setFontSize(8); doc.setTextColor(150);
  doc.text('Generado el ' + fechaLarga(hoyISO()) + ' a las ' + horaCorta() + (conn.usuario ? '  ·  ' + conn.usuario : ''), L, 288);
  doc.text('Página ' + pag, 195, 288, {align:'right'});
  return doc;
}

function generarPDFLaboral(){
  if(!window.jspdf){ toast('Conéctate a internet una vez para habilitar el PDF'); return null; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const L = 15, R = 195, W = R - L;
  const individual = lsRepTipo === 'individual' && lsRepPersona;
  const desde = $('#lsDesde').value || hoyISO(), hasta = $('#lsHasta').value || hoyISO();
  const filas = filasReporteLS();
  const totalHoras = filas.reduce((a,r) => a + (r.horas||0), 0);
  let y = 0, pag = 0;
  const encabezado = () => {
    pag++;
    try{ doc.addImage(LOGO_PDF, 'JPEG', L, 9, 29, 29*682/1000); }catch(e){}
    doc.setTextColor(0,40,113); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    doc.text((ajustes.org || 'Queremos Graduarnos').slice(0,42), L+33, 17);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(125,135,155);
    doc.text(individual ? 'REPORTE INDIVIDUAL · LABOR SOCIAL' : 'REPORTE DE LABOR SOCIAL', L+33, 22.5);
    doc.setFillColor(0,40,113); doc.rect(L, 28.5, W, 1.1, 'F');
    doc.setFillColor(18,128,92); doc.rect(L, 28.5, 26, 1.1, 'F');
    doc.setTextColor(30); y = 38;
    if(pag === 1){
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      if(individual){
        doc.text(lsRepPersona.nombre + '  ·  ' + (lsRepPersona.ci || 'sin CI'), L, y); y += 6;
        doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(90);
        const totalHistorico = horasLaboral(lsRepPersona.id);
        doc.text('Del ' + fechaLarga(desde) + ' al ' + fechaLarga(hasta) + '  ·  Horas del período: ' + totalHoras, L, y); y += 5.5;
        doc.setFont('helvetica','bold'); doc.setTextColor(18,128,92);
        doc.text('Horas cumplidas hasta hoy: ' + totalHistorico + ' / ' + metaLS(), L, y);
        doc.setTextColor(30); y += 8;
      } else {
        doc.text('Del ' + fechaLarga(desde) + ' al ' + fechaLarga(hasta), L, y); y += 6;
        doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(90);
        doc.text('Marcas: ' + filas.length + '  ·  Horas totales: ' + totalHoras + '  ·  Meta por persona: ' + metaLS() + ' horas', L, y);
        doc.setTextColor(30); y += 8;
      }
    }
    const cols = individual
      ? [{t:'Fecha',w:40},{t:'Horas',w:30},{t:'Marcado por',w:W-70}]
      : [{t:'Fecha',w:24},{t:'Nombre',w:66},{t:'Cédula',w:28},{t:'Horas',w:20},{t:'Marcado por',w:37}];
    doc.setFillColor(232,238,248); doc.rect(L, y, W, 8, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    let x = L + 2; cols.forEach(c => { doc.text(c.t, x, y + 5.5); x += c.w; });
    y += 8; doc.setFont('helvetica','normal'); doc.setFontSize(9.5);
    return cols;
  };
  let cols = encabezado();
  filas.forEach((r, i) => {
    if(y > 275){ doc.setFontSize(8); doc.setTextColor(140); doc.text('Página ' + pag, 105, 288, {align:'center'}); doc.addPage(); cols = encabezado(); }
    if(i % 2 === 1){ doc.setFillColor(246,249,253); doc.rect(L, y, W, 7, 'F'); }
    doc.setTextColor(30);
    let x = L + 2;
    const vals = individual ? [r.fecha, String(r.horas), r.por||'—'] : [r.fecha, r.nombre, r.ci||'—', String(r.horas), r.por||'—'];
    vals.forEach((v, k) => { doc.text(String(v).slice(0,30), x, y + 4.8); x += cols[k].w; });
    doc.setDrawColor(224,229,237); doc.line(L, y + 7, R, y + 7);
    y += 7;
  });
  doc.setFontSize(8); doc.setTextColor(150);
  doc.text('Generado el ' + fechaLarga(hoyISO()) + ' a las ' + horaCorta() + (conn.usuario ? ' · ' + conn.usuario : ''), L, 288);
  doc.text('Página ' + pag, 195, 288, {align:'right'});
  return doc;
}

function nombreArchivo(ses, ext){
  const t = (ses.titulo || 'Asistencia').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'');
  return `${t}_${ses.fecha}.${ext || 'pdf'}`;
}

async function compartirArchivo(blob, nombre, tipo, doc, wb){
  try{
    const file = new File([blob], nombre, { type: tipo });
    if(navigator.canShare && navigator.canShare({ files:[file] })){
      await navigator.share({ files:[file], title: nombre });
      return true;
    }
  }catch(e){ if(e && e.name === 'AbortError') return false; }
  if(doc) doc.save(nombre); else if(wb) XLSX.writeFile(wb, nombre);
  return true;
}

async function archivoABase64(blob){
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binario = '';
  for(let i = 0; i < bytes.length; i++) binario += String.fromCharCode(bytes[i]);
  return btoa(binario);
}
async function guardarEnNube(blob, nombreArchivo, tipoMime, carpeta, categoria){
  if(!conn.activa) return { ok:false, motivo:'sin-conexion' };
  try{
    const contenidoBase64 = await archivoABase64(blob);
    return await api('guardar_reporte', { carpeta, categoria, nombreArchivo, tipoMime, contenidoBase64 });
  }catch(e){ return { ok:false, motivo:'error' }; }
}
function fechaPuntos(iso){ const [y,m,d] = (iso||hoyISO()).split('-'); return `${d}.${m}.${y}`; }
