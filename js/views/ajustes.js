/* =========================================================
   CONTROLADOR DE CONFIGURACIÓN Y RESPALDOS LOCALES/NUBE
   ========================================================= */
function abrirAjustes(){
  $('#setOrg').value = ajustes.org || '';
  $('#setMail').value = ajustes.correo || '';
  $('#setHorasLS').value = ajustes.horasLS || 4;
  $('#setMetaLS').value = ajustes.metaLS || 120;
  const cs = campos();
  $('#setPdfCampo').innerHTML = '<option value="">— ninguna —</option>' + cs.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  $('#setPdfCampo').value = cs.indexOf(ajustes.pdfCampo) >= 0 ? ajustes.pdfCampo : '';
  sheet('#shAjustes');
}

async function guardarAjustes(){
  ajustes.org = $('#setOrg').value.trim();
  ajustes.correo = $('#setMail').value.trim();
  ajustes.pdfCampo = $('#setPdfCampo').value;
  ajustes.horasLS = Math.max(1, +$('#setHorasLS').value || 4);
  ajustes.metaLS = Math.max(1, +$('#setMetaLS').value || 120);
  await Store.set('asis_ajustes', ajustes);
  closeSheet();
  toast('Ajustes guardados');
  renderLaboral();
}

function descargarRespaldo(){
  const data = JSON.stringify({ personas, sesiones, activa, ajustes, v:3 }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], {type:'application/json'}));
  a.download = 'respaldo_asistencia_' + hoyISO() + '.json';
  a.click();
  toast('Respaldo descargado');
}

function restaurarRespaldoFile(f){
  if(!f) return;
  const rd = new FileReader();
  rd.onload = async ev => {
    try{
      const d = JSON.parse(ev.target.result);
      personas = d.personas || [];
      (d.vips || []).forEach(v => {
        const ex = personas.find(p => (v.ci && normCI(p.ci) === normCI(v.ci)) || claveNombre(p.nombre) === claveNombre(v.nombre));
        if(ex) ex.vip = true; else personas.push(Object.assign({}, v, { vip: true, colegio: v.colegio || '' }));
      });
      sesiones = d.sesiones || [];
      ajustes = d.ajustes || ajustes;
      idxBusq.clear();
      delete ajustes.camposVip;
      activa = d.activa && d.activa.fecha === hoyISO() ? d.activa : { id:uid(), titulo:'', fecha:hoyISO(), presentes:[] };
      await Store.set('asis_personas', personas);
      await Store.set('asis_sesiones', sesiones);
      await Store.set('asis_ajustes', ajustes);
      await Store.set('asis_activa', activa);
      closeSheet();
      renderAll();
      toast('Datos restaurados');
    }catch(err){
      toast('El archivo de respaldo no es válido');
    }
  };
  rd.readAsText(f);
}
