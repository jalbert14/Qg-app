/* =========================================================
   CONTROLADOR DE LOGIN Y AUTENTICACIÓN
   ========================================================= */
function mostrarLogin(){
  if(!conn.url) conn.url = URL_PREDETERMINADA;
  $('#lgUsuario').value = conn.usuarioLogin || '';
  $('#lgClave').value = '';
  $('#lgMsg').className = 'lg-msg';
  $('#lgPie').textContent = 'Cada persona entra con su propio usuario y clave. Si no los tienes, pídeselos al administrador.';
  document.body.classList.add('bloqueada');
  setTimeout(() => (conn.usuarioLogin ? $('#lgClave') : $('#lgUsuario')).focus(), 200);
}

function avisoLogin(txt){
  const m = $('#lgMsg'); m.textContent = txt; m.className = 'lg-msg' + (txt ? ' on' : '');
}

async function entrar(){
  const usuarioLogin = $('#lgUsuario').value.trim();
  const clave = $('#lgClave').value.trim().toUpperCase();
  if(!conn.url) conn.url = URL_PREDETERMINADA;
  if(!usuarioLogin){ avisoLogin('Escribe tu usuario.'); return; }
  if(!clave){ avisoLogin('Escribe tu clave de acceso.'); return; }
  avisoLogin('');
  conn.usuarioLogin = usuarioLogin; conn.clave = clave;
  cargando(true, 'Verificando');
  const r = await api('login', {});
  cargando(false);

  if(r.ok){
    conn.activa = true; conn.rol = r.rol; conn.usuario = r.usuario;
    conn.claveHash = await hashClave(usuarioLogin, clave);
    ajustes.modoLocal = false;
    await guardarConn(); await Store.set('asis_ajustes', ajustes);
    document.body.classList.remove('bloqueada');
    aplicarRol(); renderAll(); iniciarPoll();
    cargando(true, 'Sincronizando');
    await sincronizar();
    cargando(false);
    toast('Bienvenido, ' + r.usuario.split(' ')[0]);
    return;
  }

  if(r.red && conn.claveHash && (await hashClave(usuarioLogin, clave)) === conn.claveHash){
    conn.activa = true;
    document.body.classList.remove('bloqueada');
    aplicarRol(); renderAll(); iniciarPoll();
    marcarEstado('err', 'Sin señal. Entraste con los datos guardados en este dispositivo.');
    toast('Sin señal: trabajando con la última información');
    return;
  }
  conn.clave = '';
  avisoLogin(r.red ? 'No hay señal y esos datos no coinciden con los últimos usados en este dispositivo.' : (r.error || 'Usuario o clave incorrectos.'));
}

let recuperandoUsuario = '';

function abrirRecuperar(){
  recuperandoUsuario = '';
  $('#recUsuario').value = $('#lgUsuario')?.value || '';
  $('#recCodigo').value = '';
  $('#recNuevaClave').value = '';
  $('#recConfClave').value = '';
  $('#recMsg').className = 'warn hidden'; $('#recMsg').innerHTML = '';
  $('#recPaso1').classList.remove('hidden');
  $('#recPaso2').classList.add('hidden');
  $('#recPaso3').classList.add('hidden');
  sheet('#shRecuperar');
  setTimeout(() => $('#recUsuario')?.focus(), 250);
}

function avisoRecuperar(txt, esError){
  const box = $('#recMsg');
  if(!txt){ box.className = 'warn hidden'; box.innerHTML = ''; return; }
  box.className = 'warn' + (esError ? ' dup' : '');
  box.innerHTML = txt;
}

async function solicitar2FA(){
  const term = $('#recUsuario').value.trim();
  if(!term){ avisoRecuperar('Escribe tu usuario o correo registrado.', true); return; }
  avisoRecuperar('');
  cargando(true, 'Enviando 2FA');
  const r = await api('recuperar_solicitar', { usuario: term });
  cargando(false);
  if(r.ok){
    recuperandoUsuario = r.usuario || term;
    avisoRecuperar(r.mensaje || 'Código 2FA enviado a tu correo. Revisa tu bandeja de entrada o SPAM.', false);
    $('#recPaso1').classList.add('hidden');
    $('#recPaso2').classList.remove('hidden');
    setTimeout(() => $('#recCodigo')?.focus(), 250);
  } else {
    avisoRecuperar(r.error || 'No se pudo enviar el código 2FA.', true);
  }
}

async function verificar2FA(){
  const code = $('#recCodigo').value.trim();
  if(!code || code.length < 6){ avisoRecuperar('Ingresa el código 2FA de 6 dígitos.', true); return; }
  avisoRecuperar('');
  cargando(true, 'Verificando');
  const r = await api('recuperar_validar_2fa', { usuario: recuperandoUsuario, codigo: code });
  cargando(false);
  if(r.ok){
    avisoRecuperar('Código verificado con éxito. Escribe tu nueva contraseña.', false);
    $('#recPaso2').classList.add('hidden');
    $('#recPaso3').classList.remove('hidden');
    setTimeout(() => $('#recNuevaClave')?.focus(), 250);
  } else {
    avisoRecuperar(r.error || 'Código 2FA incorrecto o expirado.', true);
  }
}

async function guardarNuevaClave(){
  const cl1 = $('#recNuevaClave').value.trim().toUpperCase();
  const cl2 = $('#recConfClave').value.trim().toUpperCase();
  if(!cl1){ avisoRecuperar('Escribe tu nueva clave.', true); return; }
  if(cl1 !== cl2){ avisoRecuperar('Las claves no coinciden.', true); return; }
  const code = $('#recCodigo').value.trim();
  avisoRecuperar('');
  cargando(true, 'Actualizando clave');
  const r = await api('recuperar_cambiar_clave', { usuario: recuperandoUsuario, codigo: code, nuevaClave: cl1 });
  cargando(false);
  if(r.ok){
    closeSheet();
    $('#lgUsuario').value = recuperandoUsuario;
    $('#lgClave').value = cl1;
    toast('Contraseña actualizada. Inicia sesión con tus nuevos datos.');
  } else {
    avisoRecuperar(r.error || 'No se pudo guardar la nueva clave.', true);
  }
}
