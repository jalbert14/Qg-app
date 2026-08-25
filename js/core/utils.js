/* =========================================================
   UTILIDADES Y HELPERS DE FORMATO Y BÚSQUEDA
   ========================================================= */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const norm = s => (s==null?'':String(s)).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const esc = s => (s==null?'':String(s)).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hoyISO = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const fechaLarga = iso => { const [y,m,d] = iso.split('-'); const M=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']; return `${+d} de ${M[+m-1]} de ${y}`; };
const horaCorta = () => { const d=new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const iniciales = n => (n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase() || '?';

function normCI(ci){
  let s = String(ci == null ? '' : ci).toUpperCase().replace(/[^0-9A-Z]/g, '');
  s = s.replace(/^[VE]/, '').replace(/^0+/, '');
  return s;
}
function claveNombre(n){ return norm(n).split(' ').filter(Boolean).sort().join(' '); }
function duplicadoDe(p, lista, excluirId){
  const c = normCI(p.ci);
  return lista.find(x => x.id !== excluirId && (
    (c && normCI(x.ci) === c) || (!c && !normCI(x.ci) && claveNombre(x.nombre) === claveNombre(p.nombre))
  ));
}
function parecidoA(p, lista, excluirId){
  return lista.find(x => x.id !== excluirId && claveNombre(x.nombre) === claveNombre(p.nombre));
}
function campos(){ return (ajustes.campos || []).filter(Boolean); }
function camposProspectos(){ return (ajustes.camposProspectos || []).filter(Boolean); }

function normCampo(s){ return String(s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
const GRUPO_DE_CAMPO = {
  'cedula':'personal', 'fecha de nacimiento':'personal', 'edad':'personal',
  'numero de contacto':'personal', 'representante':'personal',
  'numero del representante':'personal', 'resumen socioeconomico':'personal',
  'jxj':'academica', 'universidad':'academica', 'colegio de procedencia':'academica',
  'sector':'academica', 'carrera':'academica', 'semestre':'academica', 'convenio':'academica',
  'deuda':'academica', 'año de culminacion':'academica', 'ano de culminacion':'academica',
  'caso critico':'academica', 'tipo de caso':'academica', 'labor social':'academica',
  'observacion':'adicional', 'origen':'adicional', 'fecha de alta':'adicional', 'actualizado':'adicional'
};
function grupoCampo(etiqueta){ return GRUPO_DE_CAMPO[normCampo(etiqueta)] || 'adicional'; }

function valorCampoComo(p, nombreBuscado){
  const c = campos().find(x => normCampo(x) === normCampo(nombreBuscado));
  return c ? valorExtra(p, c) : '';
}
function calcularEdad(fechaStr){
  if(!fechaStr) return '';
  const d = new Date(fechaStr);
  if(isNaN(d.getTime())) return '';
  const hoy = new Date();
  let edad = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  if(m < 0 || (m === 0 && hoy.getDate() < d.getDate())) edad--;
  return (edad >= 0 && edad < 130) ? String(edad) : '';
}

function entradasFicha(p){
  const fijas = [
    ['Cédula', formatearCedula(p.ci), true, 'personal'],
    ['Universidad', secundario(p), false, 'academica'],
    ['JxJ', p.vip ? 'Sí ★' : 'No', false, 'academica']
  ];
  if(p.laboral) fijas.push(['Labor Social', horasLaboral(p.id) + ' / ' + metaLS() + ' horas', false, 'academica']);
  fijas.push(['Origen', p.nuevo ? 'Agregado en la app' : 'Archivo original', false, 'adicional']);
  fijas.push(['Fecha de alta', p.alta || '', false, 'adicional']);
  if(p.actualizado) fijas.push(['Actualizado', p.actualizado, false, 'adicional']);

  const fechaNac = valorCampoComo(p, 'Fecha de Nacimiento');
  const edadCalc = calcularEdad(fechaNac);
  const tieneColEdad = campos().some(c => normCampo(c) === 'edad');
  const extras = campos().map(c => {
    if(normCampo(c) === 'edad') return [c, edadCalc || valorExtra(p, c) || '', false, grupoCampo(c)];
    return [c, valorExtra(p, c) || '', false, grupoCampo(c)];
  });
  if(!tieneColEdad && fechaNac) extras.push(['Edad', edadCalc, false, 'personal']);

  return fijas.concat(extras);
}

function agruparEntradas(p, soloConValor){
  const grupos = { personal:[], academica:[], adicional:[] };
  entradasFicha(p).forEach(f => {
    if(soloConValor && !f[1]) return;
    grupos[f[3]].push(f);
  });
  return grupos;
}
function camposDe(p){ return campos(); }

const CONECTORES_COLEGIO = new Set(['la','el','los','las','de','del','y']);
function claveColegio(nombre){
  return norm(nombre).split(' ').filter(t => t && !CONECTORES_COLEGIO.has(t)).join(' ');
}

function unificarColegio(nombre){
  const n = String(nombre || '').trim();
  if(!n) return n;
  const hit = aliasColegios.find(a => claveColegio(a.de) === claveColegio(n));
  return hit ? hit.a : n;
}

function construirMapaColegios(lista){
  const conteos = new Map();
  lista.forEach(p => {
    const crudo = universidadHistorica(p) || 'Sin universidad';
    const clave = claveColegio(crudo);
    if(!conteos.has(clave)) conteos.set(clave, new Map());
    const m = conteos.get(clave);
    m.set(crudo, (m.get(crudo) || 0) + 1);
  });
  const representante = new Map();
  conteos.forEach((m, clave) => {
    let mejor = null, max = -1;
    m.forEach((veces, texto) => { if(veces > max){ max = veces; mejor = texto; } });
    representante.set(clave, mejor);
  });
  return p => {
    const crudo = universidadHistorica(p) || 'Sin universidad';
    return representante.get(claveColegio(crudo)) || crudo;
  };
}

function formatearCedula(ci){
  const s = String(ci || '').trim();
  if(!s) return '';
  const m = s.match(/^([VEve])[-.\s]?/);
  const prefijo = m ? m[1].toUpperCase() + '-' : '';
  const digitos = s.replace(/^[VEve][-.\s]?/, '').replace(/[^\d]/g, '');
  if(!digitos) return s;
  const conPuntos = digitos.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return prefijo + conPuntos;
}

function esNoAplica(v){
  const s = String(v || '').toUpperCase().replace(/[^A-Z]/g, '');
  return s === 'NA';
}
function secundario(p){
  if(!p) return '';
  const u = String(p.colegio || '').trim();
  if(u && !esNoAplica(u)) return unificarColegio(u);
  return unificarColegio(valorCampoComo(p, 'Colegio de procedencia') || u || '');
}

function indiceColegio(colegio){
  const c = claveColegio(colegio || 'sin universidad');
  const i = ordenColegios.findIndex(x => claveColegio(x) === c);
  return i >= 0 ? i : Infinity;
}

function universidadHistorica(p){
  const u = String(p.colegio || '').trim();
  if(u && !esNoAplica(u)) return unificarColegio(u);
  const vivo = personaPorId(p.id);
  return unificarColegio((vivo ? secundario(vivo) : '') || u || '');
}

function ordenarPorColegio(lista){
  const mapear = construirMapaColegios(lista);
  return lista.slice().sort((a, b) => {
    const ca = mapear(a) || 'Sin universidad', cb = mapear(b) || 'Sin universidad';
    const ia = indiceColegio(ca), ib = indiceColegio(cb);
    if(ia !== ib) return ia - ib;
    if(ia === Infinity && claveColegio(ca) !== claveColegio(cb)) return ca.localeCompare(cb);
    return (a.nombre || '').localeCompare(b.nombre || '');
  });
}

function esVip(p){ return !!(p && p.vip); }
function listaVip(){ return personas.filter(esVip); }

function buscarTodo(term, limite){
  const lim = limite || 12;
  const enPersonas = buscar(term, personas, lim);
  const faltan = Math.max(0, lim - enPersonas.length);
  const enProspectos = faltan ? buscar(term, prospectos, faltan) : [];
  return enPersonas.concat(enProspectos);
}
function esProspectoId(id){ return !personas.some(x => x.id === id) && prospectos.some(x => x.id === id); }
function personaPorId(id){ return personas.find(x => x.id === id) || prospectos.find(x => x.id === id); }

function esLaboral(p){ return !!(p && p.laboral); }
function listaLaboral(){ return personas.filter(esLaboral); }

function registrosLaboral(personaId){
  return asistenciaLS.filter(r => r.personaId === personaId).sort((a, b) => b.fecha.localeCompare(a.fecha));
}
function horasLaboral(personaId, desde, hasta){
  return registrosLaboral(personaId)
    .filter(r => (!desde || r.fecha >= desde) && (!hasta || r.fecha <= hasta))
    .reduce((a, r) => a + (r.horas || 0), 0);
}
function metaLS(){ return ajustes.metaLS || 120; }
function horasPorMarca(){ return ajustes.horasLS || 4; }
function valorExtra(p, c){ return (p && p.extra && p.extra[c]) ? String(p.extra[c]) : ''; }
