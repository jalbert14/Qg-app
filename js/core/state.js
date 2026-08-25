/* =========================================================
   ESTADO GLOBAL DE LA APLICACIÓN
   ========================================================= */
let personas = [];      // {id, nombre, ci, colegio}
let sesiones = [];      // {id, titulo, fecha, presentes:[{id,nombre,ci,colegio,hora}]}
let activa = null;      // sesión en curso
let ajustes = { org:'Queremos Graduarnos', correo:'', fuente:'', campos:[], camposProspectos:[], pdfCampo:'', modoLocal:false, horasLS:4, metaLS:120 };
let seleccion = null;
let pendingImport = null;
let importMode = 'replace';
let dsCurrent = null;
let consultaSel = null;
let filtros = {};
let altaJxJ = false;   // estado del checkbox "Designar como JxJ" en el formulario de alta/edición
let pendientes = [];
let asistenciaLS = [];
let prospectos = [];
let ordenColegios = [];
let aliasColegios = [];
let altaLaboral = false;
let editandoProspectoId = null;
let lsVista = 'hoy';
let lsRepTipo = 'general';
let lsRepPersona = null;
let altaPresente = false;
let editandoId = null;
let dupConfirmado = false;
let conn = { url:'', clave:'', usuarioLogin:'', usuario:'', rol:'', activa:false };
let outbox = [];
let sincronizando = false;
let resyncPendiente = false;
let pollTimer = null;
let openSheet = null;

let revisionLocal = 0;
let revisionLocalLS = 0;
const idxBusq = new Map();

