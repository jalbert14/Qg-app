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
