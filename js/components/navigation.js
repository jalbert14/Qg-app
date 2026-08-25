/* =========================================================
   CONTROLADOR DE NAVEGACIÓN Y RENDERIZADO PRINCIPAL
   ========================================================= */
function irA(v){
  $$('.tabbar button').forEach(x => x.classList.toggle('on', x.dataset.v === v));
  $$('.view').forEach(s => s.classList.remove('on'));
  $('#v-'+v).classList.add('on');
  window.scrollTo(0,0);
}

function renderStrip(){
  $('#stTitle').textContent = activa.titulo || 'Sesión sin título';
  $('#stDate').textContent = fechaLarga(activa.fecha);
  $('#stCount').textContent = activa.presentes.length;
  $('#brandSub').textContent = personas.length ? personas.length + ' personas en la base' : 'Carga tu Excel para empezar';
}

function renderAll(){
  renderStrip();
  renderAvisoDia();
  renderPresentes();
  renderPersonas();
  renderJxJ();
  renderSesiones();
  renderReportePer();
  renderConsulta();
  renderPendientes();
  renderLaboral();
  renderProspectos();
}
