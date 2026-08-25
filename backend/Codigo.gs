/**
 * Queremos Graduarnos — puente entre la app de asistencia y esta hoja de cálculo.
 * Menú "Asistencia QG" → "Preparar hoja" para crear las pestañas y las claves.
 */

const CAB = {
  Personas:    ['id', 'nombre', 'ci', 'colegio', 'origen', 'alta', 'actualizado', 'jxj', 'laboral'],
  Sesiones:   ['sesion_id', 'fecha', 'titulo', 'estado', 'cerrada_en'],
  Asistencia: ['sesion_id', 'fecha', 'persona_id', 'nombre', 'ci', 'colegio', 'hora', 'estado', 'marcado_por', 'marcado_en', 'lista'],
  Usuarios:   ['clave', 'nombre', 'rol', 'activo', 'desactivada', 'usuario', 'correo'],
  Pendientes:   ['pendiente_id', 'fecha', 'nombre', 'ci', 'colegio', 'colegio_procedencia', 'carrera', 'semestre', 'correo', 'coincide_id', 'coincide_nombre', 'estado'],
  AsistenciaLS: ['registro_id', 'fecha', 'persona_id', 'nombre', 'ci', 'horas', 'marcado_por', 'marcado_en'],
  Prospectos:   ['id', 'nombre', 'ci', 'año', 'colegio', 'correo', 'telefono', 'origen', 'alta', 'actualizado'],
  Reportes:     ['id_archivo', 'fecha', 'carpeta', 'categoria', 'nombre_archivo', 'generado_por', 'url'],
  OrdenColegios: ['colegio', 'unificar_como']
};

const PERMISOS = {
  admin:       ['login','sync','marcar','desmarcar','persona_set','persona_del','personas_set','jxj_set','pendiente_resolver','cerrar','sesion_del',
                 'laboral_set','ls_marcar','ls_desmarcar','prospecto_set','prospecto_del','guardar_reporte'],
  registrador: ['login','sync','marcar','desmarcar','persona_set','cerrar','ls_marcar','ls_desmarcar','prospecto_set','guardar_reporte'],
  consulta:    ['login','sync','guardar_reporte']
};

const DIAS_HISTORIAL = 120;
const DIAS_BAJA = 30;   // una clave desactivada se borra sola al cabo de estos días

/* ---------------------------------------------------------- menú y preparación */

function onOpen(){
  SpreadsheetApp.getUi().createMenu('Asistencia QG')
    .addItem('Preparar hoja', 'configurar')
    .addItem('Crear nueva clave de acceso', 'nuevaClave')
    .addItem('Limpiar claves vencidas ahora', 'limpiarClavesManual')
    .addItem('Avisar a las apps de un cambio manual', 'avisarCambio')
    .addToUi();
}

function configurar(){
  Object.keys(CAB).forEach(function(n){ hoja(n); });
  asegurarColumnaJxJ(); asegurarColumnaLaboral();
  asegurarColumnas(['Datos del representante'], 'Prospectos');
  var u = hoja('Usuarios');
  if(u.getLastRow() < 2){
    u.appendRow(['PRUEBA', 'Usuario Prueba', 'admin', 'SI', '', 'prueba', '']);
    u.appendRow(['ADM-' + claveAzar(), 'Administrador', 'admin', 'SI', '', 'admin', '']);
    u.appendRow(['REG-' + claveAzar(), 'Registrador 1', 'registrador', 'SI', '', 'registrador', '']);
    u.appendRow(['CON-' + claveAzar(), 'Consulta 1', 'consulta', 'SI', '', 'consulta', '']);
  }
  asegurarUsuarioPrueba();
  migrarUsuarios();
  instalarLimpieza();
  SpreadsheetApp.getUi().alert(
    'Hoja preparada.\n\nEn la pestaña Usuarios están las claves de acceso.\n' +
    'Entrégale a cada persona la clave según su rol:\n\n' +
    '• admin — todo: editar la base, borrar sesiones, importar\n' +
    '• registrador — marcar asistencia y agregar personas\n' +
    '• consulta — solo verificar inscritos y ver reportes'
  );
}

function nuevaClave(){
  var ui = SpreadsheetApp.getUi();
  var nom = ui.prompt('Nombre de la persona:').getResponseText();
  if(!nom) return;
  var rol = ui.prompt('Rol (admin / registrador / consulta):').getResponseText().toLowerCase().trim();
  if(!PERMISOS[rol]){ ui.alert('Ese rol no existe.'); return; }
  var clave = rol.slice(0,3).toUpperCase() + '-' + claveAzar();
  migrarUsuarios();
  var usados = {};
  filasHoja('Usuarios').forEach(function(x){ if(x.usuario) usados[String(x.usuario).toLowerCase()] = true; });
  var base = slugUsuario(nom), cand = base, n = 2;
  while(usados[cand.toLowerCase()]){ cand = base + n; n++; }
  hoja('Usuarios').appendRow([clave, nom, rol, 'SI', '', cand]);
  ui.alert('Cuenta creada para ' + nom + ':\n\nUsuario: ' + cand + '\nClave: ' + clave);
}

/**
 * Si editas o pegas datos a mano en las pestañas, las apps deben enterarse.
 * Este disparador simple corre solo con cada edición de la hoja.
 */
function onEdit(e){
  try{
    var n = e.range.getSheet().getName();
    if(n === 'Personas') tocar('vp');
    else if(n === 'Sesiones' || n === 'Asistencia') tocar('vh');
    else if(n === 'Pendientes') tocar('vpend');
    else if(n === 'AsistenciaLS') tocar('vls');
    else if(n === 'Prospectos') tocar('vpro');
  }catch(x){}
}

function avisarCambio(){
  tocar('vp'); tocar('vh'); tocar('vpend'); tocar('vls'); tocar('vpro');
  alertaUi('Listo. Los dispositivos van a descargar los datos actualizados en la próxima sincronización (menos de un minuto).');
}
function alertaUi(m){ SpreadsheetApp.getUi().alert(m); }

function claveAzar(){
  var abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
  for(var i = 0; i < 6; i++) s += abc.charAt(Math.floor(Math.random() * abc.length));
  return s;
}

/* ------------------------------------------------- baja automática de claves */

/**
 * Una clave con activo = NO deja de servir de inmediato. Además queda con fecha
 * de desactivación y, pasados DIAS_BAJA días, su fila se borra sola.
 * Si la vuelves a poner en SI antes de que se cumpla el plazo, la fecha se limpia.
 */
function limpiarClaves(){
  migrarUsuarios();
  var h = hoja('Usuarios');
  var col = CAB.Usuarios.indexOf('desactivada') + 1;
  var hoyMs = fechaMs(hoy());
  var borrar = [];

  filas('Usuarios').forEach(function(u){
    if(!String(u.clave).trim()) return;
    var activa = String(u.activo).toUpperCase().indexOf('S') === 0;
    if(activa){
      if(u.desactivada) h.getRange(u._fila, col).setValue('');
      return;
    }
    var d = fechaMs(u.desactivada);
    if(!d){ h.getRange(u._fila, col).setValue(hoy()); return; }
    if(Math.floor((hoyMs - d) / 86400000) >= DIAS_BAJA) borrar.push(u._fila);
  });

  borrar.sort(function(a, b){ return b - a; }).forEach(function(f){ h.deleteRow(f); });
  PropertiesService.getScriptProperties().setProperty('limpieza', hoy());
  return borrar.length;
}

function limpiarClavesManual(){
  var n = limpiarClaves();
  SpreadsheetApp.getUi().alert(n
    ? n + (n === 1 ? ' clave vencida fue eliminada.' : ' claves vencidas fueron eliminadas.')
    : 'No hay claves vencidas. Las desactivadas se borran solas a los ' + DIAS_BAJA + ' días.');
}

function migrarUsuarios(){
  var h = hoja('Usuarios');
  var n = Math.max(h.getLastColumn(), CAB.Usuarios.length);
  var cab = h.getRange(1, 1, 1, n).getValues()[0].map(function(x){ return String(x).trim(); });
  CAB.Usuarios.forEach(function(c, i){
    if(cab[i] !== c) h.getRange(1, i + 1).setValue(c)
      .setFontWeight('bold').setBackground('#002871').setFontColor('#FFFFFF');
  });
}

function instalarLimpieza(){
  ScriptApp.getProjectTriggers().forEach(function(t){
    if(t.getHandlerFunction() === 'limpiarClaves') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('limpiarClaves').timeBased().everyDays(1).atHour(3).create();
}

function fechaMs(v){
  if(!v) return 0;
  if(Object.prototype.toString.call(v) === '[object Date]') return new Date(v).setHours(0,0,0,0);
  var s = String(v).trim().slice(0, 10);
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return 0;
  return new Date(+m[1], +m[2] - 1, +m[3]).getTime();
}

/* ---------------------------------------------------------- utilidades de hoja */

function hoja(nombre){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = ss.getSheetByName(nombre);
  if(!h){
    h = ss.insertSheet(nombre);
    h.appendRow(CAB[nombre]);
    h.getRange(1, 1, 1, CAB[nombre].length).setFontWeight('bold').setBackground('#002871').setFontColor('#FFFFFF');
    h.setFrozenRows(1);
  }
  return h;
}

/* Google Sheets a veces convierte un texto de fecha ("2026-08-08") en una celda
   de tipo fecha real, incluso si el script escribió texto plano — y también
   cuando alguien escribe una fecha a mano en una columna propia, como "Fecha
   de Nacimiento". Esto normaliza CUALQUIER valor de tipo fecha a texto legible,
   sin importar el nombre de la columna, para que nunca se vea como
   "Wed Jul 07 1993 00:00:00 GMT-0400" en la ficha. */
var SIEMPRE_CON_HORA = { actualizado:1, marcado_en:1 };
function normValor(col, raw){
  if(raw === null || raw === undefined || raw === '') return '';
  if(Object.prototype.toString.call(raw) === '[object Date]'){
    var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
    if(raw.getFullYear() < 1900){
      // Sheets guarda una celda de "solo hora" anclada al 30/12/1899 — se muestra nada más la hora
      return Utilities.formatDate(raw, tz, 'HH:mm');
    }
    var soloFecha = !SIEMPRE_CON_HORA[col] &&
      raw.getHours() === 0 && raw.getMinutes() === 0 && raw.getSeconds() === 0;
    return Utilities.formatDate(raw, tz, soloFecha ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm:ss');
  }
  return String(raw).trim();
}

function filas(nombre){
  var h = hoja(nombre);
  if(h.getLastRow() < 2) return [];
  var v = h.getRange(2, 1, h.getLastRow() - 1, CAB[nombre].length).getValues();
  return v.map(function(r, i){
    var o = { _fila: i + 2 };
    CAB[nombre].forEach(function(c, k){ o[c] = normValor(c, r[k]); });
    return o;
  });
}

/* La pestaña Personas admite columnas adicionales: cualquier columna que agregues
   a la derecha se convierte en un dato más de la ficha, sin tocar el script. */
function cabHoja(n){
  var h = hoja(n);
  var m = Math.max(h.getLastColumn(), CAB[n].length);
  return h.getRange(1, 1, 1, m).getValues()[0]
    .map(function(x){ return String(x).trim(); })
    .filter(function(x){ return x !== ''; });
}

function camposExtra(n){
  n = n || 'Personas';
  return cabHoja(n).filter(function(c){ return !nombreCanonico(n, c); });
}

function filasHoja(n){
  var h = hoja(n), cab = cabHoja(n);
  // las columnas fijas se reconocen sin importar mayúsculas, espacios de más, o el sinónimo usado
  if(h.getLastRow() < 2) return [];
  return h.getRange(2, 1, h.getLastRow() - 1, cab.length).getValues().map(function(r, i){
    var o = { _fila: i + 2, extra: {} };
    cab.forEach(function(c, k){
      var canon = nombreCanonico(n, c);
      var v = normValor(canon || c, r[k]);
      if(canon) o[canon] = v; else if(v) o.extra[c] = v;
    });
    return o;
  });
}
/* Algunas columnas fijas admiten más de un nombre habitual en la hoja,
   para no obligar a renombrar algo que el coordinador ya llama de otra forma. */
var ALIAS_COLUMNA = {
  colegio: ['colegio', 'universidad', 'institucion', 'institución', 'liceo', 'escuela'],
  'año': ['año', 'anio', 'ano']
};
function indiceColumna(n, cab, canon){
  for(var i = 0; i < cab.length; i++){ if(nombreCanonico(n, cab[i]) === canon) return i; }
  return -1;
}
function nombreCanonico(n, textoHeader){
  var t = String(textoHeader).trim().toLowerCase();
  var fijos = CAB[n];
  for(var i = 0; i < fijos.length; i++){
    var canon = fijos[i];
    if(t === canon) return canon;
    var alias = ALIAS_COLUMNA[canon];
    if(alias && alias.indexOf(t) >= 0) return canon;
  }
  return null;
}

function personasCab(){ return cabHoja('Personas'); }
function personasFilas(){ return filasHoja('Personas'); }

/**
 * La estrella JxJ vive como una columna más en Personas (valores SI/NO), no como
 * una hoja aparte: así cualquier persona de la base puede ser designada por el admin.
 * Esta función agrega la columna si el archivo es de antes de que existiera.
 */
/**
 * Agrega una columna booleana (SI/NO) a Personas si todavía no existe, sin tocar
 * nada más. Sirve tanto para la estrella JxJ como para la marca de Labor Social.
 */
function asegurarColumnaBooleana(nombreCol){
  var h = hoja('Personas'), cab = cabHoja('Personas');
  if(cab.some(function(c){ return String(c).trim().toLowerCase() === nombreCol; })) return cab;
  var col = cab.length + 1;
  h.getRange(1, col).setValue(nombreCol).setFontWeight('bold').setBackground('#002871').setFontColor('#FFFFFF');
  var ultima = h.getLastRow();
  if(ultima > 1){
    var relleno = [];
    for(var i = 0; i < ultima - 1; i++) relleno.push(['NO']);
    h.getRange(2, col, ultima - 1, 1).setValues(relleno);
  }
  return cabHoja('Personas');
}
function asegurarColumnaJxJ(){ return asegurarColumnaBooleana('jxj'); }
function asegurarColumnaLaboral(){ return asegurarColumnaBooleana('laboral'); }
function esJxJ(x){ return String((x && x.jxj) || '').toUpperCase().indexOf('S') === 0; }
function esLaboral(x){ return String((x && x.laboral) || '').toUpperCase().indexOf('S') === 0; }


function filaPersona(p, cab, n){
  n = n || 'Personas';
  return cab.map(function(c){
    var canon = nombreCanonico(n, c) || c;
    if(canon === 'id') return p.id;
    if(canon === 'nombre') return p.nombre;
    if(canon === 'ci') return p.ci || '';
    if(canon === 'colegio') return p.colegio || '';
    if(canon === 'origen') return p.origen || 'app';
    if(canon === 'alta') return p.alta || hoy();
    if(canon === 'actualizado') return ahora();
    if(canon === 'jxj') return p._jxjCell != null ? p._jxjCell : 'NO';
    if(canon === 'laboral') return p._laboralCell != null ? p._laboralCell : 'NO';
    return (p.extra && p.extra[c]) ? p.extra[c] : '';
  });
}

function asegurarColumnas(claves, n){
  n = n || 'Personas';
  var h = hoja(n), cab = cabHoja(n), faltan = [];
  (claves || []).forEach(function(k){
    k = String(k).trim();
    if(k && cab.indexOf(k) < 0 && faltan.indexOf(k) < 0) faltan.push(k);
  });
  if(faltan.length){
    h.getRange(1, cab.length + 1, 1, faltan.length).setValues([faltan])
      .setFontWeight('bold').setBackground('#002871').setFontColor('#FFFFFF');
  }
  return cabHoja(n);
}

/* comparables, para no permitir dos veces a la misma persona */
function normCI(ci){
  var s = String(ci == null ? '' : ci).toUpperCase().replace(/[^0-9A-Z]/g, '');
  return s.replace(/^[VE]/, '').replace(/^0+/, '');
}
function normNombre(n){
  return String(n == null ? '' : n).toLowerCase()
    .replace(/[áàä]/g,'a').replace(/[éèë]/g,'e').replace(/[íìï]/g,'i')
    .replace(/[óòö]/g,'o').replace(/[úùü]/g,'u').replace(/ñ/g,'n')
    .replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(String).sort().join(' ');
}
/**
 * Los prospectos llevan un identificador propio (PROS001, PROS002...) para
 * distinguirse a simple vista de la gente ya inscrita en Personas. El número
 * se guarda aparte (no se recalcula mirando la hoja) para que nunca se repita,
 * ni siquiera si se borra al último prospecto creado.
 */
/**
 * Si alguien pega datos directo en Personas sin llenar la columna "id"
 * (por ejemplo, al vaciar y reemplazar toda la base a mano), esas filas
 * quedarían sin forma de identificarse. Esta función les asigna un id propio
 * (p001, p002...) la primera vez que la hoja se sincroniza, igual que ya
 * se hace con los prospectos — nunca se repite, ni borrando filas.
 */
function asegurarIdsPersonas(){
  var h = hoja('Personas'), cab = cabHoja('Personas');
  var colId = indiceColumna('Personas', cab, 'id');
  if(colId < 0) return;
  var filas = filasHoja('Personas');
  var faltantes = filas.filter(function(x){ return !String(x.id || '').trim(); });
  if(!faltantes.length) return;
  var props = PropertiesService.getScriptProperties();
  var siguiente = parseInt(props.getProperty('persSeq') || '0', 10);
  filas.forEach(function(x){
    var m = String(x.id || '').match(/^p0*(\d+)$/i);
    if(m){ var n = parseInt(m[1], 10); if(n > siguiente) siguiente = n; }
  });
  faltantes.forEach(function(x){
    siguiente++;
    h.getRange(x._fila, colId + 1).setValue('p' + String(siguiente).padStart(3, '0'));
  });
  props.setProperty('persSeq', String(siguiente));
  tocar('vp');
}

/**
 * Lo mismo que asegurarIdsPersonas(), pero para Prospectos: si alguien pega
 * filas directo en la hoja sin llenar "id", quedarían todas con el mismo id
 * vacío — y la app no podría distinguir a quién se tocó en la lista. Usa el
 * mismo contador que siguienteIdProspecto(), así nunca se repite un número.
 */
function asegurarIdsProspectos(){
  var h = hoja('Prospectos'), cab = cabHoja('Prospectos');
  var colId = indiceColumna('Prospectos', cab, 'id');
  if(colId < 0) return;
  var filas = filasHoja('Prospectos');
  var faltantes = filas.filter(function(x){ return !String(x.id || '').trim(); });
  if(!faltantes.length) return;
  var props = PropertiesService.getScriptProperties();
  var siguiente = parseInt(props.getProperty('prosSeq') || '0', 10);
  filas.forEach(function(x){
    var m = String(x.id || '').match(/^PROS0*(\d+)$/i);
    if(m){ var n = parseInt(m[1], 10); if(n > siguiente) siguiente = n; }
  });
  faltantes.forEach(function(x){
    siguiente++;
    h.getRange(x._fila, colId + 1).setValue('PROS' + String(siguiente).padStart(3, '0'));
  });
  props.setProperty('prosSeq', String(siguiente));
  tocar('vpro');
}

function siguienteIdProspecto(){
  var props = PropertiesService.getScriptProperties();
  var actual = parseInt(props.getProperty('prosSeq') || '0', 10);
  var maxHoja = 0;
  filasHoja('Prospectos').forEach(function(x){
    var m = String(x.id || '').match(/^PROS0*(\d+)$/i);
    if(m){ var n = parseInt(m[1], 10); if(n > maxHoja) maxHoja = n; }
  });
  var siguiente = Math.max(actual, maxHoja) + 1;
  props.setProperty('prosSeq', String(siguiente));
  return 'PROS' + String(siguiente).padStart(3, '0');
}

function claveDup(p){
  return normCI(p.ci) ? 'ci:' + normCI(p.ci) : 'n:' + normNombre(p.nombre);
}

function hoy(){
  return Utilities.formatDate(new Date(), SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
}
function ahora(){
  return Utilities.formatDate(new Date(), SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}
function json(o){
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
/**
 * Convierte un nombre en un usuario de acceso corto y sin espacios
 * ("Ana Torres" → "ana.torres"). Si ya existe, se le agrega un número.
 */
function slugUsuario(nombre){
  var s = String(nombre || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
  return s || 'usuario';
}

/**
 * Si la hoja Usuarios es de antes de que existiera el usuario de acceso
 * (solo tenía clave), o si alguien agregó una fila a mano sin llenarlo,
 * esta función le asigna uno solo — derivado del nombre — la próxima vez
 * que la app sincronice. Nunca se repite entre personas distintas.
 */
function asegurarUsuariosLogin(){
  migrarUsuarios();
  var h = hoja('Usuarios'), cab = cabHoja('Usuarios');
  var colUsuario = indiceColumna('Usuarios', cab, 'usuario');
  if(colUsuario < 0) return;
  var filas = filasHoja('Usuarios');
  var usados = {};
  filas.forEach(function(x){ if(x.usuario) usados[String(x.usuario).toLowerCase()] = true; });
  filas.forEach(function(x){
    if(x.usuario) return;
    var base = slugUsuario(x.nombre), cand = base, n = 2;
    while(usados[cand.toLowerCase()]){ cand = base + n; n++; }
    usados[cand.toLowerCase()] = true;
    h.getRange(x._fila, colUsuario + 1).setValue(cand);
  });
}

function asegurarUsuarioPrueba(){
  try {
    var h = hoja('Usuarios');
    var filas = filasHoja('Usuarios');
    var existe = filas.some(function(x){ return String(x.usuario || '').toLowerCase() === 'prueba'; });
    if(!existe){
      h.appendRow(['PRUEBA', 'Usuario Prueba', 'admin', 'SI', '', 'prueba', '']);
    }
  } catch(e) {}
}

function autenticar(usuarioLogin, clave){
  if(!usuarioLogin || !clave) return null;
  var nu = String(usuarioLogin).trim().toLowerCase();
  var c = String(clave).trim().toUpperCase();
  var u = filasHoja('Usuarios').filter(function(x){
    return String(x.usuario || '').toLowerCase() === nu &&
           String(x.clave || '').toUpperCase() === c &&
           String(x.activo).toUpperCase().indexOf('S') === 0;
  })[0];
  return u && PERMISOS[u.rol] ? u : null;
}

/* ---------------------------------------------------------- entrada */

function doGet(){
  return json({ ok: true, servicio: 'Asistencia QG', hora: ahora() });
}

function doPost(e){
  var lock = LockService.getScriptLock();
  try{
    var p = JSON.parse(e.postData.contents);
    try{ asegurarUsuariosLogin(); asegurarUsuarioPrueba(); }catch(x){}   // por si la columna "usuario" todavía no existe
    if(p.accion === 'recuperar_solicitar' || p.accion === 'recuperar_validar_2fa' || p.accion === 'recuperar_cambiar_clave'){
      var rRec = ACCIONES[p.accion](p);
      rRec.ok = rRec.ok !== false;
      return json(rRec);
    }
    var u = autenticar(p.usuario, p.clave);
    if(!u) return json({ ok:false, error:'Usuario o clave incorrectos, o la cuenta está desactivada.' });
    if(PropertiesService.getScriptProperties().getProperty('limpieza') !== hoy()){
      try{ limpiarClaves(); }catch(x){}
    }
    if(PERMISOS[u.rol].indexOf(p.accion) < 0) return json({ ok:false, error:'Tu rol de ' + u.rol + ' no permite esta acción.' });
    var r = ACCIONES[p.accion](p, u) || {};
    r.ok = true; r.rol = u.rol; r.usuario = u.nombre; r.hora = ahora();
    return json(r);
  }catch(err){
    return json({ ok:false, error:String(err && err.message ? err.message : err) });
  }finally{
    try{ lock.releaseLock(); }catch(x){}
  }
}

/* ---------------------------------------------------------- acciones */

var ACCIONES = {

  login: function(){ return {}; },

  recuperar_solicitar: function(p){
    var term = String(p.usuario || '').trim().toLowerCase();
    if(!term) return { ok:false, error:'Escribe tu usuario o correo electrónico.' };
    var u = filasHoja('Usuarios').filter(function(x){
      return (String(x.usuario || '').toLowerCase() === term ||
              String(x.correo || '').toLowerCase() === term ||
              String(x.nombre || '').toLowerCase() === term) &&
             String(x.activo).toUpperCase().indexOf('S') === 0;
    })[0];
    if(!u) return { ok:false, error:'No se encontró una cuenta activa asignada a ese usuario o correo.' };
    var destino = u.correo || Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
    if(!destino) return { ok:false, error:'La cuenta no tiene un correo electrónico configurado para recibir el 2FA.' };
    var code = String(Math.floor(100000 + Math.random() * 900000));
    var props = PropertiesService.getScriptProperties();
    props.setProperty('2fa_' + String(u.usuario).toLowerCase(), JSON.stringify({ code: code, expira: Date.now() + 600000 }));
    
    var asunto = 'Código de verificación 2FA — Queremos Graduarnos';
    var cuerpo = 'Hola ' + u.nombre + ',\n\n' +
      'Tu código de verificación de 2 factores (2FA) para restablecer la contraseña es:\n\n' +
      '  ' + code + '\n\n' +
      'Este código es válido por 10 minutos. Si no solicitaste este cambio, ignora este correo.\n\n' +
      'Atentamente,\n' +
      'Equipo de Queremos Graduarnos';
    try {
      MailApp.sendEmail(destino, asunto, cuerpo);
    } catch(e) {
      return { ok:false, error:'No se pudo enviar el correo con el 2FA: ' + String(e.message||e) };
    }
    var visible = destino.replace(/^(.{2})(.*)(@.*)$/, function(m, p1, p2, p3){ return p1 + '***' + p3; });
    return { ok:true, usuario: u.usuario, mensaje: 'Código enviado a ' + visible };
  },

  recuperar_validar_2fa: function(p){
    var uName = String(p.usuario || '').trim().toLowerCase();
    var code = String(p.codigo || '').trim();
    if(!uName || !code) return { ok:false, error:'Falta el usuario o código 2FA.' };
    var props = PropertiesService.getScriptProperties();
    var raw = props.getProperty('2fa_' + uName);
    if(!raw) return { ok:false, error:'No hay una solicitud de 2FA activa. Solicita un nuevo código.' };
    var data = JSON.parse(raw);
    if(Date.now() > data.expira) return { ok:false, error:'El código 2FA ha expirado (duración 10 min). Solicita uno nuevo.' };
    if(data.code !== code) return { ok:false, error:'El código 2FA de 6 dígitos es incorrecto.' };
    return { ok:true, valido:true };
  },

  recuperar_cambiar_clave: function(p){
    var uName = String(p.usuario || '').trim().toLowerCase();
    var code = String(p.codigo || '').trim();
    var nuevaClave = String(p.nuevaClave || '').trim().toUpperCase();
    if(!uName || !code || !nuevaClave) return { ok:false, error:'Completa todos los campos.' };
    var val = ACCIONES.recuperar_validar_2fa(p);
    if(!val.ok) return val;
    var h = hoja('Usuarios');
    var cab = cabHoja('Usuarios');
    var colClave = indiceColumna('Usuarios', cab, 'clave');
    var u = filasHoja('Usuarios').filter(function(x){ return String(x.usuario || '').toLowerCase() === uName; })[0];
    if(!u) return { ok:false, error:'Usuario no encontrado.' };
    h.getRange(u._fila, colClave + 1).setValue(nuevaClave);
    PropertiesService.getScriptProperties().deleteProperty('2fa_' + uName);
    return { ok:true, mensaje:'Contraseña actualizada exitosamente.' };
  },

  enviar_reporte_correo: function(p){
    var correo = String(p.correo || '').trim();
    if(!correo) return { ok: false, error: 'Proporciona un correo electrónico de destino.' };
    
    var asunto = 'Reporte de Asistencia QG — ' + (p.titulo || p.fecha || 'Asistencia');
    var cuerpo = 'Hola,\n\nAdjunto encontrarás el reporte de asistencia correspondiente a: ' + 
                 (p.titulo ? p.titulo + ' (' + (p.fecha || '') + ')' : (p.fecha || 'Sesión de Asistencia')) + '.\n\n' +
                 'Generado por: ' + (p.usuario || 'Sistema QG') + '\n\n' +
                 'Atentamente,\nEquipo Queremos Graduarnos';
                 
    var adjuntos = [];
    if(p.archivoBase64 && p.nombreArchivo){
      var bytes = Utilities.base64Decode(p.archivoBase64);
      var blob = Utilities.newBlob(bytes, p.tipoMime || 'application/pdf', p.nombreArchivo);
      adjuntos.push(blob);
    }
    
    try {
      MailApp.sendEmail({
        to: correo,
        subject: asunto,
        body: cuerpo,
        attachments: adjuntos
      });
      return { ok: true, mensaje: 'Reporte enviado con éxito a ' + correo };
    } catch(e) {
      return { ok: false, error: 'No se pudo enviar el correo: ' + String(e.message || e) };
    }
  },

  sync: function(p){
    var ses = sesionAbierta();
    asegurarColumnaJxJ(); asegurarColumnaLaboral();
    asegurarColumnas(['Datos del representante'], 'Prospectos');
    asegurarIdsPersonas();
    asegurarIdsProspectos();
    var vp = version('vp'), vh = version('vh'), vpend = version('vpend'), vls = version('vls'), vpro = version('vpro');
    var asis = filas('Asistencia').filter(function(a){ return a.estado !== 'anulado'; });
    var limite = Utilities.formatDate(new Date(Date.now() - DIAS_HISTORIAL * 86400000),
      SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), 'yyyy-MM-dd');

    var presentes = asis.filter(function(a){ return a.sesion_id === ses.sesion_id; })
      .map(limpiaAsistencia);

    var historial = String(p.vh || '') === vh ? [] : filas('Sesiones')
      .filter(function(s){ return s.estado === 'cerrada' && s.fecha >= limite; })
      .map(function(s){
        return {
          id: s.sesion_id, fecha: s.fecha, titulo: s.titulo,
          presentes: asis.filter(function(a){ return a.sesion_id === s.sesion_id; }).map(limpiaAsistencia)
        };
      });

    var res = {
      vp: vp, vh: vh, vpend: vpend, vls: vls, vpro: vpro,
      sesion: { id: ses.sesion_id, fecha: ses.fecha, titulo: ses.titulo },
      presentes: presentes,
      ordenColegios: filasHoja('OrdenColegios').filter(function(x){ return x.colegio && !x.unificar_como; }).map(function(x){ return x.colegio; }),
      aliasColegios: filasHoja('OrdenColegios').filter(function(x){ return x.colegio && x.unificar_como; }).map(function(x){ return { de: x.colegio, a: x.unificar_como }; })
    };
    if(String(p.vp || '') !== vp){          // la base solo viaja si cambió
      res.campos = camposExtra();
      res.personas = personasFilas().map(function(x){
        return { id:x.id, nombre:x.nombre, ci:x.ci, colegio:x.colegio, extra:x.extra,
                 nuevo: x.origen === 'app', alta: x.alta, actualizado: x.actualizado, exportado: true, vip: esJxJ(x), laboral: esLaboral(x) };
      });
    }
    if(String(p.vh || '') !== vh) res.historial = historial;
    if(String(p.vpend || '') !== vpend){
      res.pendientes = filasHoja('Pendientes').filter(function(x){ return x.estado !== 'resuelto'; }).map(function(x){
        return { id:x.pendiente_id, fecha:x.fecha, nombre:x.nombre, ci:x.ci, colegio:x.colegio,
                 colegioProcedencia:x.colegio_procedencia, carrera:x.carrera, semestre:x.semestre, correo:x.correo,
                 coincideId:x.coincide_id, coincideNombre:x.coincide_nombre };
      });
    }
    if(String(p.vls || '') !== vls){        // el historial completo de labor social: se necesita entero para sumar horas
      res.asistenciaLS = filasHoja('AsistenciaLS').map(function(x){
        return { id:x.registro_id, fecha:x.fecha, personaId:x.persona_id, nombre:x.nombre, ci:x.ci,
                 horas: Number(x.horas) || 0, por:x.marcado_por };
      });
    }
    if(String(p.vpro || '') !== vpro){
      res.camposProspectos = camposExtra('Prospectos');
      res.prospectos = filasHoja('Prospectos').map(function(x){
        return { id:x.id, nombre:x.nombre, ci:x.ci, anio:x['año'], colegio:x.colegio, correo:x.correo,
                 telefono:x.telefono, extra:x.extra, nuevo: x.origen === 'app', alta:x.alta };
      });
    }
    return res;
  },

  marcar: function(p, u){
    var ses = sesionAbierta();
    var h = hoja('Asistencia');
    var ya = filas('Asistencia').filter(function(a){
      return a.sesion_id === ses.sesion_id && a.persona_id === String(p.persona_id);
    })[0];
    if(ya){
      if(ya.estado === 'anulado') h.getRange(ya._fila, 8).setValue('presente');
      return { sesion_id: ses.sesion_id };
    }
    h.appendRow([ses.sesion_id, ses.fecha, p.persona_id, p.nombre, p.ci || '', p.colegio || '',
                 p.hora || '', 'presente', u.nombre, ahora(), p.lista || 'base']);
    return { sesion_id: ses.sesion_id };
  },

  desmarcar: function(p){
    var ses = sesionAbierta();
    var h = hoja('Asistencia');
    filas('Asistencia').forEach(function(a){
      if(a.sesion_id === ses.sesion_id && a.persona_id === String(p.persona_id)) h.getRange(a._fila, 8).setValue('anulado');
    });
    return {};
  },

  persona_set: function(p, u){
    asegurarColumnaJxJ(); asegurarColumnaLaboral();
    var cab = asegurarColumnas(Object.keys(p.extra || {}));
    var h = hoja('Personas'), todas = personasFilas();
    var ex = todas.filter(function(x){ return x.id === String(p.id); })[0];
    if(!ex) ex = todas.filter(function(x){ return claveDup(x) === claveDup(p); })[0];
    // la estrella JxJ y Labor Social solo las toca el admin; cualquier otro caso conserva lo que ya había
    if(u && u.rol === 'admin' && p.jxj !== undefined) p._jxjCell = p.jxj ? 'SI' : 'NO';
    else p._jxjCell = ex ? (ex.jxj || 'NO') : 'NO';
    if(u && u.rol === 'admin' && p.laboral !== undefined) p._laboralCell = p.laboral ? 'SI' : 'NO';
    else p._laboralCell = ex ? (ex.laboral || 'NO') : 'NO';
    var fila = filaPersona(p, cab);
    if(ex){
      fila[indiceColumna('Personas', cab, 'id')] = ex.id;   // se conserva el registro que ya existía
      h.getRange(ex._fila, 1, 1, cab.length).setValues([fila]);
      tocar('vp');
      return { fusionado: ex.id !== String(p.id), id: ex.id };
    }
    h.appendRow(fila);
    tocar('vp');
    return { id: p.id };
  },

  persona_del: function(p){
    var h = hoja('Personas');
    var f = personasFilas().filter(function(x){ return x.id === String(p.id); })[0];
    if(f) h.deleteRow(f._fila);
    tocar('vp');
    return {};
  },

  personas_set: function(p){
    asegurarColumnaJxJ(); asegurarColumnaLaboral();
    var h = hoja('Personas');
    var extras = (p.campos || []).map(function(c){ return String(c).trim(); }).filter(String);
    (p.personas || []).forEach(function(x){
      Object.keys(x.extra || {}).forEach(function(k){ if(extras.indexOf(k) < 0) extras.push(k); });
    });
    // si alguien ya designado JxJ o Labor Social reaparece en el archivo nuevo, se conservan sus marcas
    var previosJxJ = {}, previosLab = {};
    personasFilas().forEach(function(x){
      if(esJxJ(x)) previosJxJ[claveDup(x)] = true;
      if(esLaboral(x)) previosLab[claveDup(x)] = true;
    });
    var cab = CAB.Personas.concat(extras);
    h.clear();
    h.getRange(1, 1, 1, cab.length).setValues([cab])
      .setFontWeight('bold').setBackground('#002871').setFontColor('#FFFFFF');
    h.setFrozenRows(1);
    var vistos = {}, fs = [], repetidos = 0;
    (p.personas || []).forEach(function(x){
      var k = claveDup(x);
      if(vistos[k]){ repetidos++; return; }
      vistos[k] = 1;
      x._jxjCell = previosJxJ[k] ? 'SI' : 'NO';
      x._laboralCell = previosLab[k] ? 'SI' : 'NO';
      fs.push(filaPersona(x, cab));
    });
    if(fs.length) h.getRange(2, 1, fs.length, cab.length).setValues(fs);
    tocar('vp');
    return { total: fs.length, repetidos: repetidos };
  },

  jxj_set: function(p){
    asegurarColumnaJxJ(); asegurarColumnaLaboral();
    var cab = cabHoja('Personas');
    var f = personasFilas().filter(function(x){ return x.id === String(p.id); })[0];
    if(!f) return { error: 'Persona no encontrada' };
    var col = indiceColumna('Personas', cab, 'jxj');
    if(col < 0) return { error: 'No se encontró la columna de JxJ' };
    hoja('Personas').getRange(f._fila, col + 1).setValue(p.jxj ? 'SI' : 'NO');
    tocar('vp');
    return { id: f.id, jxj: !!p.jxj };
  },

  laboral_set: function(p){
    asegurarColumnaJxJ(); asegurarColumnaLaboral();
    var cab = cabHoja('Personas');
    var f = personasFilas().filter(function(x){ return x.id === String(p.id); })[0];
    if(!f) return { error: 'Persona no encontrada' };
    var col = indiceColumna('Personas', cab, 'laboral');
    if(col < 0) return { error: 'No se encontró la columna de Labor Social' };
    hoja('Personas').getRange(f._fila, col + 1).setValue(p.laboral ? 'SI' : 'NO');
    tocar('vp');
    return { id: f.id, laboral: !!p.laboral };
  },

  pendiente_resolver: function(p){
    var hp = hoja('Pendientes');
    var cabP = cabHoja('Pendientes');
    var fila = filasHoja('Pendientes').filter(function(x){ return x.pendiente_id === String(p.id); })[0];
    if(!fila) return { error: 'Esa solicitud ya no existe.' };
    if(fila.estado === 'resuelto') return { error: 'Esa solicitud ya fue resuelta.' };

    if(p.modo === 'fusionar'){
      var cab = asegurarColumnas(['Colegio de procedencia', 'Carrera', 'Semestre', 'Correo']);
      var ex = personasFilas().filter(function(x){ return x.id === fila.coincide_id; })[0];
      if(ex){
        var actual = ex.extra || {};
        var upd = {
          id: ex.id, nombre: ex.nombre || fila.nombre, ci: ex.ci || fila.ci,
          colegio: ex.colegio || fila.colegio, origen: ex.origen, alta: ex.alta,
          extra: {
            'Colegio de procedencia': fila.colegio_procedencia || actual['Colegio de procedencia'] || '',
            'Carrera': fila.carrera || actual['Carrera'] || '',
            'Semestre': fila.semestre || actual['Semestre'] || '',
            'Correo': fila.correo || actual['Correo'] || ''
          },
          _jxjCell: ex.jxj || 'NO'
        };
        Object.keys(actual).forEach(function(k){ if(!(k in upd.extra)) upd.extra[k] = actual[k]; });
        hoja('Personas').getRange(ex._fila, 1, 1, cab.length).setValues([filaPersona(upd, cab)]);
        tocar('vp');
      }
    } else if(p.modo === 'nueva'){
      var cab2 = asegurarColumnas(['Colegio de procedencia', 'Carrera', 'Semestre', 'Correo']);
      var nueva = {
        id: 'p_' + claveAzar(), nombre: fila.nombre, ci: fila.ci, colegio: fila.colegio,
        origen: 'formulario', alta: hoy(),
        extra: { 'Colegio de procedencia': fila.colegio_procedencia, 'Carrera': fila.carrera,
                 'Semestre': fila.semestre, 'Correo': fila.correo },
        _jxjCell: 'NO'
      };
      hoja('Personas').appendRow(filaPersona(nueva, cab2));
      tocar('vp');
    }
    // 'descartar' no modifica Personas, solo cierra la solicitud

    hp.getRange(fila._fila, cabP.indexOf('estado') + 1).setValue('resuelto');
    tocar('vpend');
    return { ok: true };
  },

  /* --------------------------------------------------------- Labor Social */

  ls_marcar: function(p, u){
    var f = hoy();
    var ya = filasHoja('AsistenciaLS').filter(function(x){
      return x.fecha === (p.fecha || f) && x.persona_id === String(p.persona_id);
    })[0];
    if(ya) return { ya: true };
    var horas = Number(p.horas) > 0 ? Number(p.horas) : 4;
    hoja('AsistenciaLS').appendRow(['ls_' + claveAzar(), p.fecha || f, p.persona_id, p.nombre || '', p.ci || '', horas, u.nombre, ahora()]);
    tocar('vls');
    return { ok: true };
  },

  ls_desmarcar: function(p){
    var h = hoja('AsistenciaLS');
    var f = filasHoja('AsistenciaLS').filter(function(x){
      return x.fecha === p.fecha && x.persona_id === String(p.persona_id);
    })[0];
    if(f) h.deleteRow(f._fila);
    tocar('vls');
    return {};
  },

  /* ----------------------------------------------------------- Prospectos */

  prospecto_set: function(p){
    var cab = asegurarColumnas(Object.keys(p.extra || {}), 'Prospectos');
    var h = hoja('Prospectos'), todos = filasHoja('Prospectos');
    var ex = p.id ? todos.filter(function(x){ return x.id === String(p.id); })[0] : null;
    if(!ex && p.ci) ex = todos.filter(function(x){ return claveDup(x) === claveDup(p); })[0];
    var id = ex ? ex.id : siguienteIdProspecto();
    var fila = cab.map(function(c){
      var canon = nombreCanonico('Prospectos', c) || c;
      if(canon === 'id') return id;
      if(canon === 'nombre') return p.nombre || (ex && ex.nombre) || '';
      if(canon === 'ci') return p.ci || (ex && ex.ci) || '';
      if(canon === 'año') return p.anio || (ex && ex['año']) || '';
      if(canon === 'colegio') return p.colegio || (ex && ex.colegio) || '';
      if(canon === 'correo') return p.correo || (ex && ex.correo) || '';
      if(canon === 'telefono') return p.telefono || (ex && ex.telefono) || '';
      if(canon === 'origen') return (ex && ex.origen) || p.origen || 'app';
      if(canon === 'alta') return (ex && ex.alta) || p.alta || hoy();
      if(canon === 'actualizado') return ahora();
      var actual = (ex && ex.extra) || {};
      return (p.extra && p.extra[c] !== undefined && p.extra[c] !== '') ? p.extra[c] : (actual[c] || '');
    });
    if(ex){
      h.getRange(ex._fila, 1, 1, cab.length).setValues([fila]);
      tocar('vpro');
      return { fusionado: true, id: ex.id };
    }
    h.appendRow(fila);
    tocar('vpro');
    return { fusionado: false, id: id };
  },

  prospecto_del: function(p){
    var h = hoja('Prospectos');
    var f = filasHoja('Prospectos').filter(function(x){ return x.id === String(p.id); })[0];
    if(f) h.deleteRow(f._fila);
    tocar('vpro');
    return {};
  },

  /* -------------------------------------------------- Reportes en la nube */

  guardar_reporte: function(p, u){
    var carpeta = carpetaReportes(p.carpeta);
    var bytes = Utilities.base64Decode(p.contenidoBase64);
    var blob = Utilities.newBlob(bytes, p.tipoMime, p.nombreArchivo);
    var archivo = carpeta.createFile(blob);
    archivo.setDescription('Generado por ' + u.nombre + ' (' + u.rol + ') — ' + (p.categoria || ''));
    hoja('Reportes').appendRow([archivo.getId(), ahora(), p.carpeta, p.categoria || '', p.nombreArchivo, u.nombre, archivo.getUrl()]);
    return { ok: true, url: archivo.getUrl(), id: archivo.getId() };
  },

  cerrar: function(p){
    var ses = sesionAbierta();
    var h = hoja('Sesiones');
    var f = filas('Sesiones').filter(function(s){ return s.sesion_id === ses.sesion_id; })[0];
    if(f){
      h.getRange(f._fila, 3).setValue(p.titulo || ses.titulo || '');
      h.getRange(f._fila, 4).setValue('cerrada');
      h.getRange(f._fila, 5).setValue(ahora());
    }
    tocar('vh');
    return { cerrada: ses.sesion_id };
  },

  sesion_del: function(p){
    var hs = hoja('Sesiones'), ha = hoja('Asistencia');
    var f = filas('Sesiones').filter(function(s){ return s.sesion_id === String(p.sesion_id); })[0];
    if(f) hs.deleteRow(f._fila);
    filas('Asistencia').filter(function(a){ return a.sesion_id === String(p.sesion_id); })
      .sort(function(a,b){ return b._fila - a._fila; })
      .forEach(function(a){ ha.deleteRow(a._fila); });
    tocar('vh');
    return {};
  }
};

/* ---------------------------------------------------------- apoyo */

function version(k){
  var v = PropertiesService.getScriptProperties().getProperty(k);
  return v ? String(v) : '0';
}
function tocar(k){
  // un contador que solo sube nunca puede repetir un valor ya visto por un cliente,
  // a diferencia de una marca de tiempo, que si se llama dos veces muy seguido podía
  // terminar coincidiendo con un valor de varios pasos atrás
  var props = PropertiesService.getScriptProperties();
  var actual = Number(props.getProperty(k)) || 0;
  props.setProperty(k, String(actual + 1));
}

/* ------------------------------------------------- registro desde el formulario */

/**
 * Se dispara con el trigger instalable "Al enviar el formulario". Cada respuesta
 * se compara contra la base: si la cédula no existe, se agrega directo a Personas.
 * Si ya existe, se guarda en Pendientes para que el admin decida qué hacer.
 */
function procesarRegistroForm(e){
  try{
    var v = (e && e.namedValues) || {};
    var val = function(q){ return (v[q] && v[q][0] || '').toString().trim(); };
    var nombre = val('Nombre completo');
    var ci = val('Cédula');
    var colegio = val('Colegio o institución actual');
    var extra = {
      'Colegio de procedencia': val('Colegio de procedencia'),
      'Carrera': val('Carrera'),
      'Semestre': val('Semestre'),
      'Correo': val('Dirección de correo electrónico')
    };
    if(!nombre || !ci) return;   // respuesta incompleta, no se procesa

    asegurarColumnaJxJ(); asegurarColumnaLaboral();
    var candidato = { nombre: nombre, ci: ci };
    var existente = personasFilas().filter(function(x){ return claveDup(x) === claveDup(candidato); })[0];

    if(existente){
      var hp = hoja('Pendientes');
      hp.appendRow(['req_' + claveAzar(), ahora(), nombre, ci, colegio,
                     extra['Colegio de procedencia'], extra['Carrera'], extra['Semestre'], extra['Correo'],
                     existente.id, existente.nombre, 'pendiente']);
      tocar('vpend');
    } else {
      var cab = asegurarColumnas(Object.keys(extra).filter(function(k){ return extra[k]; }));
      var p = { id: 'p_' + claveAzar(), nombre: nombre, ci: ci, colegio: colegio,
                origen: 'formulario', alta: hoy(), extra: extra, _jxjCell: 'NO' };
      hoja('Personas').appendRow(filaPersona(p, cab));
      tocar('vp');
    }
  }catch(err){
    try{ hojaSimple('ErroresForm', ['fecha', 'error']).appendRow([new Date(), String(err)]); }catch(x){}
  }
}

function hojaSimple(nombre, cab){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var h = ss.getSheetByName(nombre);
  if(!h){ h = ss.insertSheet(nombre); h.appendRow(cab); h.setFrozenRows(1); }
  return h;
}

/* ------------------------------------------------- carpetas de reportes */

/**
 * Los PDF y Excel que genera la app quedan guardados en el Drive de la cuenta
 * que publicó el script, dentro de "QG - Reportes / <carpeta>". Se crean solas
 * la primera vez que hacen falta.
 */
function obtenerOCrearCarpeta(nombre, padre){
  var it = padre.getFoldersByName(nombre);
  if(it.hasNext()) return it.next();
  return padre.createFolder(nombre);
}
function carpetaReportes(nombreSubcarpeta){
  var raiz = obtenerOCrearCarpeta('QG - Reportes', DriveApp.getRootFolder());
  return obtenerOCrearCarpeta(nombreSubcarpeta || 'Otros reportes', raiz);
}

function sesionAbierta(){
  var f = hoy();
  var abierta = filas('Sesiones').filter(function(s){ return s.estado === 'abierta' && s.fecha === f; })[0];
  if(abierta) return abierta;
  var id = 's_' + f.replace(/-/g, '') + '_' + claveAzar().slice(0, 4).toLowerCase();
  hoja('Sesiones').appendRow([id, f, '', 'abierta', '']);
  return { sesion_id: id, fecha: f, titulo: '', estado: 'abierta' };
}

function limpiaAsistencia(a){
  return { id: a.persona_id, nombre: a.nombre, ci: a.ci, colegio: a.colegio,
           hora: a.hora, por: a.marcado_por, lista: a.lista || 'base' };
}

function norm(s){
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}
