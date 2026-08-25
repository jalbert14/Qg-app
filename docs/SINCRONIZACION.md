# Sincronización entre dispositivos

La app puede trabajar de dos maneras:

- **Sola en el teléfono** (como venía). No hay que configurar nada.
- **Conectada a una hoja de Google.** La base de personas y la asistencia del día se comparten en vivo entre todos los dispositivos, y cada persona entra con su propio usuario y clave, que definen lo que puede hacer.

Esto se configura **una sola vez** y toma unos 20 minutos.

---

## Paso 1 — Crear la hoja

1. Entra a `sheets.google.com` y crea una hoja nueva. Llámala **Base de Datos QGerianos**.
2. Menú **Archivo → Configuración → Zona horaria**: escoge *(GMT-04:00) Caracas*. Esto es importante: de ahí sale la fecha de cada sesión.

## Paso 2 — Pegar el script

3. En la hoja: menú **Extensiones → Apps Script**.
4. Borra todo lo que aparezca en el editor y pega el contenido completo del archivo `Codigo.gs`.
5. Guarda (el ícono del disquete).

## Paso 3 — Preparar las pestañas y las claves

6. Vuelve a la pestaña de la hoja de cálculo y **recarga la página**. Aparecerá un menú nuevo llamado **Asistencia QG**.
7. Menú **Asistencia QG → Preparar hoja**.
8. Google va a pedir permisos. Es normal: el script es tuyo y corre dentro de tu cuenta.
   - Aparecerá *"Google no ha verificado esta aplicación"* → **Configuración avanzada** → **Ir a Base de Datos QGerianos (no seguro)** → **Permitir**.
9. Se crean siete pestañas: `Personas`, `Sesiones`, `Asistencia`, `Usuarios`, `AsistenciaLS`, `Prospectos`, `OrdenColegios`. La marca JxJ y la de Labor Social viven como columnas más (`jxj`, `laboral`) dentro de `Personas`, no como hojas aparte. Las pestañas `Pendientes` y `Reportes` se crean solas la primera vez que hacen falta.

> El archivo puedes llamarlo como quieras y renombrarlo cuando quieras: el script trabaja sobre la hoja donde está pegado, no sobre un nombre. Lo que **no** debes renombrar son las cuatro pestañas de adentro ni las primeras columnas de cada una.
10. Abre la pestaña **Usuarios**: ahí están las tres cuentas iniciales, una por rol — con su usuario y su clave ya asignados en las columnas `usuario` y `clave`.

## Paso 4 — Publicar el script

11. Vuelve a Apps Script: botón **Implementar → Nueva implementación**.
12. En el engranaje ⚙ escoge el tipo **Aplicación web**.
13. Configura:
    - **Ejecutar como:** Yo (tu correo)
    - **Quién tiene acceso:** Cualquier persona
14. **Implementar** y copia la **URL de la aplicación web**. Termina en `/exec`.

> Esta URL ya viene precargada dentro de la app (el archivo `asistencia.html`/`index.html`), así que en ningún teléfono hace falta escribirla ni verla — la pantalla de inicio solo pide usuario y clave. Si algún día cambias de hoja o de implementación, el admin puede actualizarla desde **Ajustes → Conexión con la hoja y roles**.

> "Cualquier persona" no significa que tu hoja quede pública. Nadie ve la hoja: solo este script responde, y exige un usuario y una clave válidos en cada llamada. Aun así, **trata la URL y las claves como contraseñas**.

## Paso 5 — Conectar cada dispositivo

15. Abre la app. La pantalla de inicio ya pide **usuario y clave** directamente, sin nada más que configurar.
16. Escribe el usuario y la clave de esa persona → **Entrar**. El punto de estado (arriba a la derecha) se pone verde y abajo dice con qué nombre y rol entraste.

Repite esto en cada teléfono con el usuario y la clave que le correspondan.

---

## Entrar a la app

La pantalla de inicio no pide ni muestra la dirección de la hoja — queda guardada por dentro. Cada vez que se abre, la app pide **usuario y clave**. La clave nunca se guarda en el teléfono, solo queda una huella cifrada que sirve para dejar entrar a esa misma persona cuando no hay señal; el usuario sí se recuerda, para no tener que escribirlo cada vez.

**La dirección de la hoja solo la puede cambiar el rol admin**, desde Ajustes → Conexión con la hoja y roles — ahí también puede ver/cambiar su usuario y clave si hace falta. A los demás roles no se les muestra ese campo de la URL como editable.

### Cuentas creadas antes de esta versión

Si ya tenías el script funcionando con el sistema de solo-clave, no hay que migrar nada a mano. La primera vez que cualquier dispositivo sincronice después de actualizar el script, cada cuenta de la pestaña `Usuarios` recibe un `usuario` propio, derivado automáticamente de su nombre (por ejemplo, "Ana Torres" → `ana.torres`). Si dos personas comparten nombre, a la segunda se le agrega un número para no chocar. Revisa la columna `usuario` en tu hoja para confirmar qué le tocó a cada quien, y avísales su nuevo usuario (la clave no cambia).

## Los roles

| | admin | registrador | consulta |
|---|:---:|:---:|:---:|
| Verificar si alguien está inscrito | Sí | Sí | Sí |
| Ver historial y reportes | Sí | Sí | Sí |
| Marcar asistencia | Sí | Sí | — |
| Agregar personas nuevas | Sí | Sí | — |
| Cerrar la lista y generar el PDF | Sí | Sí | — |
| Editar o eliminar personas de la base | Sí | — | — |
| Importar un Excel (reemplaza la base) | Sí | — | — |
| Eliminar sesiones del historial | Sí | — | — |
| Cambiar la hoja conectada | Sí | — | — |
| Designar o quitar la estrella JxJ | Sí | — | — |
| Designar o quitar de Labor Social | Sí | — | — |
| Marcar asistencia de Labor Social | Sí | Sí | — |
| Generar el reporte de Labor Social (PDF/Excel) | Sí | Sí | Sí |
| Agregar o editar prospectos | Sí | Sí | — |
| Eliminar prospectos | Sí | — | — |

Los permisos se revisan **en la hoja**, no en el teléfono: aunque alguien manipule la app, el script rechaza lo que su rol no permite.

### Crear más cuentas

Menú **Asistencia QG → Crear nueva clave de acceso** — a pesar del nombre del menú, ahora te va a mostrar un usuario y una clave juntos. También puedes escribir la fila a mano en la pestaña `Usuarios`; si dejas la columna `usuario` vacía, se autoasigna sola la próxima vez que la app sincronice.

### Quitar el acceso

Cambia la columna `activo` de `SI` a `NO`. Son dos cosas distintas y conviene tenerlas claras:

1. **El acceso se corta de inmediato.** En la siguiente acción que intente el teléfono, la hoja la rechaza. No hay que esperar nada ni tocar el dispositivo.
2. **La fila se borra sola a los 30 días.** El script anota la fecha de desactivación en la columna `desactivada` y, cumplido el plazo, elimina la clave de la hoja para que no se acumulen.

Si vuelves a poner `SI` antes de que se cumpla el mes, la fecha se limpia y la clave queda como nueva. El plazo se cuenta desde que se desactivó, no desde que se creó.

La limpieza corre sola una vez al día de madrugada, y también la primera vez que alguien usa la app cada día, por si el disparador automático no llegara a ejecutarse. Puedes forzarla desde el menú **Asistencia QG → Limpiar claves vencidas ahora**.

Para cambiar el plazo, edita `const DIAS_BAJA = 30;` al principio del script.

Al borrarse la fila se pierde el nombre de esa persona en la lista de usuarios, pero **no** el registro de lo que hizo: la columna `marcado_por` de la pestaña `Asistencia` conserva quién marcó a cada quien.

---

## Cómo se comporta en el día a día

- La app se sincroniza al abrirla, al volver a ella y cada 12 segundos mientras está en pantalla.
- Lo que marca un teléfono aparece en los demás en segundos.
- Si dos personas marcan al mismo tiempo, no se duplica: se unifica por persona.
- **Sin señal sigue funcionando.** Lo que marques queda en cola, el punto se pone naranja y todo sube solo al reconectar.
- La lista del día es **una sola y compartida**. Al cerrarla se cierra para todos y se genera el PDF; si después alguien marca a alguien más, se abre una lista nueva de ese mismo día.
- Con la app conectada ya no hace falta generar el Excel actualizado a mano: las personas nuevas se escriben directo en la hoja.

## Orden de colegios en los reportes, y unificación automática de nombres

**La app agrupa sola las variantes de un mismo colegio que solo difieren en puntos, comas, tildes o palabras conectoras** (la, el, los, las, de, del, y) — por ejemplo "C.E.N. LA INDIA URQUIA", "C.E.N LA INDIA URQUÍA" y "C.E.N. INDIA URQUIA" se reconocen como el mismo lugar sin que haya que configurar nada. Al generar un reporte, se elige automáticamente como texto a mostrar la variante que más se repite en esa lista de presentes.

Esto pasa siempre, en cualquier hoja, sin necesitar la pestaña `OrdenColegios`. Esa pestaña sigue existiendo para dos cosas que sí requieren que se lo digas tú:

**Elegir el orden de aparición.** En la columna `colegio`, escribe los nombres de las universidades en el orden en que quieres que aparezcan agrupadas — una fila por universidad, con `unificar_como` vacío. Los que no estén en esa lista se agrupan al final, en orden alfabético. Si la pestaña está vacía o no existe, se ordena alfabéticamente por defecto.

**Unificar casos que la app no puede adivinar sola** — cuando dos nombres de colegio son genuinamente distintos en su texto (no solo puntuación/tildes/conectores) pero sabes que se refieren al mismo lugar, por ejemplo un apodo o una sigla distinta ("UCV" y "Universidad Central de Venezuela"). Ahí sí hace falta decírselo, con una fila por cada variante:

| colegio | unificar_como |
|---|---|
| Universidad Central de Venezuela | |
| UCV | Universidad Central de Venezuela |

Igual que con `colegio` en `Personas`, esta columna acepta "universidad", "institución", "liceo" o "escuela" como nombre alternativo del encabezado.

## Reportes en la nube

Cada PDF y Excel que se genera en la app —de asistencia general o de Labor Social, general o individual— se sube solo a Google Drive, sin que nadie tenga que hacer nada extra. Queda además del archivo que se descarga o comparte en el teléfono; no lo reemplaza.

### Dónde quedan guardados

En el Drive de la cuenta de Google con la que publicaste el script (la que usaste en el paso "Implementar"), dentro de una carpeta `QG - Reportes` que se crea sola la primera vez que hace falta, con una subcarpeta por tipo:

- `QG - Reportes / Reportes de asistencia`
- `QG - Reportes / Reportes Labor Social`

Si en el futuro agregas otro tipo de reporte, su carpeta se crea sola con el nombre que le corresponda, siguiendo el mismo patrón.

### Cómo se nombran

- **Reportes generales:** con el nombre del reporte y la fecha — por ejemplo *"Reporte de asistencia del 09.08.2026"* o *"Reporte de Labor Social del 01.08.2026 al 08.08.2026"*.
- **Reportes individuales** (de Labor Social): con el nombre y la cédula de la persona — por ejemplo *"María Pérez - V28451236 - Reporte Labor Social.pdf"*.

### Quién generó cada uno

Cada archivo queda con una descripción en Drive ("Generado por Fulano — categoría") y además se anota en una pestaña nueva de tu hoja, **`Reportes`**, con la fecha, el tipo, el nombre del archivo, quién lo generó y el enlace directo al archivo en Drive. Esa pestaña se crea sola; no hace falta prepararla.

### Detalles importantes

- **Solo se sube si el teléfono está conectado a la hoja.** En modo local (sin conexión) o si se cae la señal justo en ese momento, el archivo se genera y se descarga igual — simplemente no queda respaldo en la nube esa vez.
- **Los tres roles pueden generar y respaldar reportes**, incluido consulta, ya que generar un reporte no modifica ningún dato.
- **El logo QG va en todos los PDF**, incrustado como imagen. En los Excel no es técnicamente posible incrustar el logo como imagen con las herramientas disponibles; en su lugar, el nombre de la institución aparece como texto en la hoja de resumen de cada archivo.
- **La primera vez que actualices el script** después de este cambio, Google va a pedir un permiso nuevo (acceso a Drive) — es normal, acéptalo para que el respaldo funcione.
- Las carpetas y la pestaña `Reportes` quedan privadas a la cuenta que las creó. Si quieres que otros administradores las vean, compártelas normalmente desde Google Drive.

## Registro por Google Form (autorregistro de estudiantes)

Puedes armar un Google Form para que los estudiantes nuevos se anoten solos. No escribe directo en `Personas` — hace falta un puente que ya está armado en el script. Solo te falta crear el formulario y conectarlo.

### 1. Crear el formulario

Entra a `forms.google.com` y crea uno nuevo con **estas preguntas, con este texto exacto** (el script busca las respuestas por el título de la pregunta):

| Pregunta | Tipo | Obligatoria |
|---|---|---|
| Nombre completo | Respuesta corta | Sí |
| Cédula | Respuesta corta | Sí |
| Colegio o institución actual | Respuesta corta | Sí |
| Colegio de procedencia | Respuesta corta | No |
| Carrera | Respuesta corta | No |
| Semestre | Respuesta corta | No |

Si necesitas otro dato, agrégalo igual de fácil — pero acuérdate de agregarlo también dentro de la función `procesarRegistroForm` del script (te explico dónde, más abajo), porque los campos que no estén ahí se pierden.

### 2. Exigir cuenta de Google

Menú ⚙ del formulario → pestaña **General**:
- Activa **"Restringir a 1 respuesta"**. Google va a pedir que actives el inicio de sesión — acéptalo. Con esto cada quien solo puede llenarlo una vez con su cuenta de Google.
- Actívalo también dentro de **Respuestas → Recopilar direcciones de correo electrónico** (verificado). Así el script guarda su correo como dato de contacto.

### 3. Conectar las respuestas a tu hoja

Pestaña **Respuestas** del formulario → ícono verde de Sheets → **Seleccionar hoja existente** → elige **Base de Datos QGerianos**. Se crea una pestaña nueva llamada "Respuestas de formulario 1" — no la borres, ahí es donde Google guarda cada envío antes de que el script lo procese.

### 4. Instalar el disparador

5. Vuelve a tu hoja de Google → **Extensiones → Apps Script**.
6. En el ícono del reloj ⏰ de la barra izquierda (Activadores) → **Añadir activador**.
7. Configura:
   - **Función a ejecutar:** `procesarRegistroForm`
   - **Fuente del evento:** *Desde la hoja de cálculo*
   - **Tipo de evento:** *Al enviar formulario*
8. Guardar. Google va a pedir permisos otra vez — acéptalos.

Con eso queda activo. Pruébalo llenando el formulario tú mismo una vez.

### Cómo se comporta

- **Si la cédula no está en la base:** entra directo a `Personas`, con `origen: formulario` y la estrella JxJ en NO.
- **Si la cédula ya existe:** no toca nada todavía. Queda guardada en una pestaña nueva, `Pendientes`, y en la app le aparece al admin un botón **"Revisar solicitudes"** en la pestaña Personas, con el número de casos esperando.
- Ahí, por cada solicitud, el admin elige:
  - **Actualizar existente** — rellena carrera, semestre, colegio de procedencia y correo en el registro que ya había. El nombre, la cédula y el colegio del registro original **no se tocan**, para que un error de tipeo en el formulario no dañe un dato bueno que ya tenías.
  - **Crear aparte** — para el caso real (raro, pero puede pasar) de que sea otra persona con una cédula parecida o mal transcrita; se crea como alguien nuevo.
  - **Descartar** — si fue un error o un duplicado sin sentido, se cierra sin tocar nada.
- Si el formulario llega incompleto (falta nombre o cédula), se ignora sin romper nada.
- Cualquier error inesperado al procesar una respuesta queda anotado en una pestaña `ErroresForm` que se crea sola, para que puedas diagnosticarlo sin que el formulario deje de recibir gente.

## Agregar más datos de cada persona

Agrega una columna a la derecha en la pestaña `Personas` (por ejemplo `Teléfono` o `Representante`) y escribe los valores. En la próxima sincronización ese dato aparece en la ficha de la persona en todos los dispositivos, y el formulario de registro empieza a pedirlo. No hay que tocar el script.

## Referencia rápida: qué se puede tocar y qué no

El **orden** de las columnas nunca importa — la app busca cada dato por su nombre, no por su posición. Lo único que no puedes hacer es **renombrar** las columnas fijas a algo que la app no reconozca.

**`Personas`** — fijas: `id`, `nombre`, `ci`, `colegio` (acepta también "universidad", "institución", "liceo", "escuela"), `origen`, `alta`, `actualizado`, `jxj`, `laboral`. Todo lo demás que agregues es libre.

**`Prospectos`** — fijas: `id`, `nombre`, `ci`, `año` (acepta también "anio"), `colegio` (mismos sinónimos que arriba), `correo`, `telefono`, `origen`, `alta`, `actualizado`. Todo lo demás es libre.

**`OrdenColegios`** — una sola columna, `colegio`. El orden de las filas es el orden de agrupación en los reportes.

**`Usuarios`** — se edita a mano con frecuencia (activar/desactivar cuentas), pero los encabezados (`clave`, `nombre`, `rol`, `activo`, `desactivada`, `usuario`) no se tocan.

**No se editan a mano en absoluto**, las administra el script solo: `Sesiones`, `Asistencia`, `AsistenciaLS`, `Pendientes`, `Reportes`, y la pestaña de respuestas del Google Form si lo configuraste.

Y una regla que vale para toda la hoja: **nunca borres la columna `id`** de `Personas` ni de `Prospectos` — es lo que conecta cada fila con su historial de asistencia.

## Si algo falla

- **"Usuario o clave incorrectos"**: revisa la pestaña `Usuarios` — que el usuario y la clave coincidan exactamente con esa fila, y que `activo` diga `SI`.
- **El punto se queda naranja**: normalmente es señal. Si no, verifica que la URL termine en `/exec` y que en el paso 13 hayas puesto *Cualquier persona*.
- **Ya tenías el script instalado de antes**: pega la versión nueva, vuelve a correr **Asistencia QG → Preparar hoja** (Google va a pedir un permiso adicional, el de programar tareas diarias) y crea una **nueva versión** de la implementación como se explica abajo. La columna `desactivada` se agrega sola.
- **Modificaste el script y no cambia nada**: Apps Script sirve la última *versión implementada*. Ve a **Implementar → Administrar implementaciones → editar (lápiz) → Versión: Nueva versión → Implementar**.
- **Las fechas salen corridas un día**: revisa la zona horaria del paso 2.
