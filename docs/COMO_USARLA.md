# Queremos Graduarnos — Control de Asistencia

App de registro de asistencia y consulta de inscritos, con la identidad visual de la institución.

## 1. Instalar en el celular

**Opción recomendada (2 minutos, gratis, sin cuenta):**
1. Descomprime `asistencia-QG.zip`. Adentro están `index.html`, `manifest.json` y los íconos — deben quedar siempre juntos en la misma carpeta.
2. Entra a `app.netlify.com/drop` desde la computadora y arrastra **la carpeta completa** (no un archivo suelto). Te da un enlace tipo `xyz123.netlify.app`.
3. Abre ese enlace en Chrome desde el celular → menú ⋮ → **Instalar aplicación** o **Agregar a pantalla de inicio**.
4. Queda en el escritorio con el logo de Queremos Graduarnos y el nombre "Asistencia QG", y se abre a pantalla completa.

Así los datos quedan guardados de forma permanente en el teléfono. La primera vez que la abras te va a pedir **usuario y clave** — la dirección de la hoja ya viene puesta por defecto, no hace falta escribirla ni verla en ningún momento.

**Opción sin servidor:** copia `index.html` al celular y ábrelo con Chrome. El logo y el PDF funcionan igual porque van incrustados en el archivo, pero algunos navegadores no guardan los datos entre sesiones al abrir archivos locales — en ese caso la app te avisa y debes usar **Ajustes → Descargar respaldo** antes de cerrar.

## 2. Preparar el Excel

Una fila por persona, con encabezados en la primera fila. Los nombres de las columnas pueden variar; la app te deja escoger cuál es cuál al importar.

| Nombre | Cédula | Colegio |
|---|---|---|
| María Pérez | V-28451236 | U.E. Simón Bolívar |
| José Rodríguez | V-30112458 | Colegio San José |

Formatos aceptados: `.xlsx`, `.xls`, `.csv`.

## 3. Uso diario

1. **Personas → Cargar Excel** (solo la primera vez, o cuando cambie la lista).
2. **Asistencia**: escribe el nombre o la cédula → toca a la persona → aparece su ficha → **Confirmar asistencia**. Queda sellada como PRESENTE.
   - La búsqueda también encuentra a los **Prospectos** — salen marcados con una etiqueta "Prospecto" para no confundirlos con la gente ya inscrita. Su ficha muestra sus propios datos (año que cursa, correo, teléfono, representante), no los de Personas. Se marcan presentes exactamente igual, en la misma lista del día.
3. Al terminar: **Cerrar lista y generar PDF** → pones el título de la sesión y el correo, eliges el formato (**PDF**, **Excel** o **ambos**) y le das a **Generar y enviar**.
   - En Android se abre el menú de compartir con los archivos ya adjuntos: eliges Gmail y listo.
   - Si el navegador no soporta compartir archivos, los descarga y abre el correo con la lista escrita, para que solo los adjuntes.
   - El **PDF** es el documento formal, con logo, numeración y espacio para firma y sello. El **Excel** trae la misma lista pero con *todas* las columnas adicionales y una columna de quién marcó a cada persona, para cuando necesites procesar los datos en vez de imprimirlos.
   - **El PDF y el Excel salen ordenados por colegio/universidad**, agrupados con un separador visual en el PDF. Por defecto el orden es alfabético; si quieres un orden específico (por ejemplo, siempre mostrar primero a una universidad en particular), ver la sección 10.
   - **Reporte por universidad:** justo antes de generar, hay un selector de **Universidad** con las que tengan gente presente ese día. Si eliges una en vez de "Todas", el PDF/Excel sale solo con los asistentes de esa universidad — la lista se cierra completa igual, el filtro solo afecta el documento que descargas. Desde **Historial**, al reabrir cualquier sesión pasada, ese mismo selector está disponible para volver a generar el reporte filtrado cuando quieras.
   - Desde **Historial**, abriendo cualquier sesión guardada, puedes volver a descargar su PDF o su Excel cuando quieras.
   - **Cada documento generado en la app —de cualquier tipo— lleva el nombre de quién lo generó**, en el pie de página del PDF y en una hoja de resumen del Excel.
4. Cada lista cerrada queda en **Historial**, con reportes por fecha y por persona, y exportación a Excel.

## 4. Registrar a alguien que no está en la base

Cuando llega una persona que no aparece, no hace falta salir de lo que estás haciendo:

- Desde **Asistencia**, si la búsqueda no encuentra a nadie aparece el botón **Registrar como persona nueva**, ya con el nombre o la cédula que escribiste. Por defecto queda marcada presente de una vez.
- Desde **Consulta**, el botón **Agregar a la base de datos** hace lo mismo, pero solo la agrega sin marcarle asistencia.
- Si escribes una cédula que ya existe, la app te avisa de quién es y no la duplica.

### Generar el archivo actualizado

En **Personas → Generar archivo actualizado** se descarga un Excel con toda la base:

- Hoja **Base**: todas las personas, con una columna que indica si vienen del archivo original o se agregaron desde la app, y la fecha de alta.
- Hoja **Nuevos**: solo las agregadas desde la última exportación.

Ese archivo reemplaza al que cargaste antes. Guárdalo como tu nueva lista oficial.

Un cuidado: si vuelves a importar un Excel con la opción **Reemplazar lista** y tienes personas agregadas en la app que no están en ningún archivo, se pierden. La app te lo advierte antes de hacerlo, y siempre puedes elegir **Agregar** en vez de reemplazar.

### Nadie queda registrado dos veces

El control funciona en los cuatro puntos por donde puede entrar una persona:

- **Al importar el Excel**: se descartan las filas repetidas del propio archivo y, si eliges "Agregar", también las que ya estaban. Al terminar te dice cuántas descartó.
- **Al registrar a alguien a mano**: si la cédula ya existe, no deja guardar y te dice a nombre de quién está.
- **Si el nombre coincide** con alguien que ya está pero la cédula es distinta o no la pusiste, te muestra el registro parecido y solo guarda si vuelves a tocar el botón. Así puedes distinguir a dos hermanos con nombres iguales sin bloquear el caso legítimo.
- **En la hoja de Google** (si trabajas conectado) se repite la misma revisión, para que dos dispositivos no creen la misma persona a la vez.

Las cédulas se comparan sin importar el formato: `V-28.451.236`, `28451236` y `v28451236` son la misma. Los nombres se comparan sin tildes, sin mayúsculas y sin importar el orden de las palabras.

En **Personas → Revisar duplicados** puedes buscar los que hayan quedado de antes: agrupa los casos por cédula o por nombre y con un toque dejas el registro correcto y borra el otro.

## 5. Ids automáticos en Personas

Si pegas o escribes una persona en la hoja y dejas la columna `id` vacía, la app se la asigna sola —**p001, p002, p003...**— la próxima vez que sincronice (unos segundos). No hace falta que la escribas tú, y nunca se repite un número aunque borres a alguien.

**La cédula siempre se muestra con el mismo formato**, sin importar cómo esté guardada en la hoja — con puntos cada tres cifras, con el prefijo V- o E- si lo tenía. Da igual si en la base está como `33924098`, `33,924,098` o `33.924.098`: en la app, en la ficha y en todos los documentos generados sale siempre igual, por ejemplo `33.924.098`. Esto es solo cómo se **muestra** — el dato guardado en la hoja no se toca.

## 6. La ficha de cada persona, en tres bloques

Al buscar a alguien —en Consulta, o al pasar asistencia— todos sus datos aparecen organizados en tres secciones:

- **Información personal**: Cédula, Fecha de nacimiento, Edad, Número de contacto, Representante, Número del representante, Resumen socioeconómico.
- **Información académica**: JxJ, Universidad, Colegio de procedencia, Sector, Carrera, Semestre, Convenio, Deuda, Año de culminación, Caso crítico, Tipo de caso.
- **Información adicional**: Observación, Origen, Fecha de alta, Actualizado.

Cualquier columna que agregues más adelante y no encaje en ninguna de las anteriores cae sola en "Información adicional".

En Consulta se muestran los tres bloques completos, con guion `—` donde falte un dato. Al pasar asistencia, para ir más rápido, un bloque no aparece si todos sus campos están vacíos, y Cédula/Universidad se quedan en su sitio fijo arriba de la ficha (no se repiten dentro de los bloques).

**La edad se calcula sola.** Si tu archivo tiene una columna "Fecha de Nacimiento", la app calcula la edad actual a partir de ahí cada vez que abres la ficha — no hace falta llenar ni mantener al día una columna de Edad aparte. Si además tienes una columna "Edad", su valor calculado reemplaza lo que haya escrito ahí.

## 7. Agregar más datos de cada persona

No hace falta tocar la app. **Agrega una columna al archivo base** (por ejemplo `Teléfono`, `Representante` o `Grado`) y vuelve a importarlo:

- La columna nueva aparece automáticamente en la ficha de la persona, tanto al pasar asistencia como al consultarla.
- El formulario de registro empieza a pedir ese dato cuando agregues a alguien nuevo.
- Se incluye en el Excel actualizado que genera la app.
- En **Ajustes → Columna extra en el PDF** puedes elegir una de ellas para que salga también en el reporte de asistencia.

Al importar, la app te dice qué columnas adicionales detectó antes de confirmar. Las que asignaste a nombre, cédula y colegio no se repiten como datos extra.

Si trabajas conectado a Google Sheets, es igual de simple: agrega la columna a la derecha en la pestaña `Personas` de la hoja y aparecerá en todos los dispositivos en la próxima sincronización.

## 8. Consultar sin marcar asistencia

Al abrir la app pide la clave de acceso. La clave **no queda guardada** en el teléfono: se pide cada vez que se abre, así un equipo prestado o perdido no le da acceso a nadie. Si no hay señal en ese momento, puedes entrar igual con la última clave que usaste en ese mismo dispositivo, y todo sube cuando vuelva la conexión.

Si vas a usar la app en un solo teléfono, sin hoja de Google, elige *Usar sin conexión en este dispositivo* la primera vez y no vuelve a pedir clave.

La pestaña **Consulta** sirve para verificar en segundos si alguien está inscrito en la institución, sin tocar la lista del día:

- Escribes el nombre o la cédula y responde con una franja verde **REGISTRADA EN LA INSTITUCIÓN** o roja **NO ESTÁ REGISTRADA**.
- Si está, muestra **toda su información**: cédula, colegio, todas las columnas adicionales del archivo, si fue agregada desde la app o venía del original, su fecha de alta, cuántas veces ha asistido y cuándo fue la última. Si además quieres marcarla presente, hay un botón para hacerlo desde ahí.
- Arriba hay **filtros** que se arman solos con las columnas del archivo: colegio, grado, sección o lo que tengas. Puedes combinarlos y ver el listado completo de quiénes cumplen esa condición, sin escribir nada en el buscador. Solo aparecen como filtro las columnas cuyos valores se repiten; las que son distintas para cada persona, como el teléfono, no tendrían sentido y se omiten.
- Si no está, te ofrece agregarla a la base de datos en el momento, con el dato que buscaste ya escrito.
- Cuando hay varios parecidos, aparecen debajo como "otras coincidencias" para que toques el correcto.

## 9. Detalles

- El encabezado del PDF se cambia en **Ajustes → Encabezado del PDF** (nombre de tu organización).
- El PDF incluye numeración, hora de registro de cada persona y espacio para firma y sello.
- **Ajustes → Descargar respaldo** guarda todo (personas + sesiones) en un archivo `.json` que puedes restaurar en otro teléfono.
- La primera vez necesita internet para cargar las librerías de Excel y PDF. Después de eso, el registro de asistencia funciona sin señal.

## 10. Varios dispositivos en vivo

La app funciona sola en un teléfono sin configurar nada. Si quieres que varios dispositivos compartan la misma base y la misma lista del día, con roles distintos por persona, sigue la guía `SINCRONIZACION.md`: se conecta a una hoja de Google mediante el script `Codigo.gs` que va incluido.

Resumen de roles: **admin** hace todo (editar la base, importar, borrar sesiones), **registrador** marca asistencia y agrega personas, **consulta** solo verifica inscritos y ve reportes.

## 11. Entrar con usuario y clave

La pantalla de inicio no muestra ni pide la dirección de la hoja de Google en ningún momento — queda guardada por dentro. Lo único que se pide es **Usuario** y **Clave**, dos campos separados, como cualquier inicio de sesión.

- Cada quien tiene su propio usuario (por ejemplo `ana.torres`) y su propia clave (el código que ya conocías, tipo `ADM-K4M7XP`). Ambos los asigna el administrador al crear la cuenta, con el menú **Asistencia QG → Crear nueva clave de acceso** desde la hoja.
- Si ya tenías cuentas creadas de antes de esta actualización, **no hay que hacer nada**: la primera vez que alguien sincronice después de actualizar, cada cuenta recibe un usuario propio automáticamente, derivado del nombre de esa persona. Para saber cuál le tocó a cada uno, revisa la columna `usuario` en la pestaña `Usuarios` de tu hoja.
- El teléfono recuerda el usuario para la próxima vez (así no hay que escribirlo cada vez), pero **nunca recuerda la clave** — eso hay que escribirlo siempre, por seguridad.
- **Usar sin conexión en este dispositivo** sigue disponible como botón en la pantalla de inicio, en cualquier momento, no solo la primera vez.

## 12. Ordenar el PDF y el Excel por colegio, y unificar nombres escritos distinto

**Las variantes de un mismo colegio se agrupan solas, sin configurar nada.** Si en tu base "C.E.N. LA INDIA URQUIA", "C.E.N LA INDIA URQUÍA" y "C.E.N. INDIA URQUIA" son la misma institución escrita de formas distintas —con o sin puntos, con o sin tildes, con o sin "la"/"el"/"de"— la app ya las reconoce como una sola al generar cualquier reporte, y elige automáticamente la forma que más se repite para mostrarla.

La pestaña **`OrdenColegios`** de tu hoja sigue estando ahí para dos cosas que sí necesitan que las definas tú:

**Elegir el orden de aparición.** Escribe los nombres de las universidades en la columna `colegio`, una por fila, en el orden en que quieres que aparezcan agrupadas. Los que no estén en esa lista van al final, en orden alfabético entre ellos.

**Unificar casos que la app no puede adivinar sola** — cuando la diferencia no es de puntuación ni tildes sino un nombre genuinamente distinto para el mismo lugar (una sigla, un apodo). Ahí sí hace falta decírselo, en la columna `unificar_como`:

| colegio | unificar_como |
|---|---|
| Universidad Central de Venezuela | *(vacío — esta es la oficial)* |
| UCV | Universidad Central de Venezuela |

No hace falta avisarle nada a la app en ningún caso — lo toma solo la próxima vez que sincronice. El PDF muestra un separador visual con el nombre de cada universidad ya unificada; el Excel sale ordenado igual, sin separadores.

## 13. Registro por Google Form

Los estudiantes nuevos pueden autorregistrarse con un formulario, sin que nadie tenga que sentarse a cargarlos a mano. Necesita cuenta de Google para llenarlo, y se configura en la hoja de Google — el detalle completo está en `SINCRONIZACION.md`.

Lo importante del comportamiento:
- **Si es una persona nueva**, entra directo a la base.
- **Si la cédula ya existe**, no se pisa nada solo. Queda en espera y en Personas te aparece un botón **"Revisar solicitudes"** con el número de casos. Ahí decides, uno por uno: actualizar a la persona que ya tenías con los datos nuevos, crearla aparte si de verdad es otra persona, o descartar la solicitud.

## 14. Labor Social

Registra a quienes hacen labor social con QG y les lleva las horas cumplidas solo. Cada asistencia marcada equivale a horas fijas (**4 por defecto**, ajustable) hasta llegar a una meta (**120 por defecto**, también ajustable) — ambas se cambian en **Ajustes → Labor Social**.

**Designar a alguien (solo el admin):** pestaña **L. Social → Personas → busca por nombre o cédula** → toca el círculo ○ para llenarlo ⏱. Igual que JxJ, también hay un interruptor en el formulario de Personas al crear o editar a alguien.

**Marcar asistencia (admin y registrador):**
1. Pestaña **L. Social → Marcar**. La fecha por defecto es hoy; puedes cambiarla si estás registrando un día anterior.
2. Busca a la persona y toca **Marcar**. Suma las horas configuradas y queda con un ✓ verde.
3. No se puede marcar dos veces el mismo día a la misma persona — si te equivocas, la quitas con el botón ✕ junto a su nombre en "Presentes ese día".

**Ver las horas:**
- En la pestaña **Personas** del sub-menú de L. Social, cada quien muestra sus horas y el porcentaje cumplido de la meta.
- En **Consulta**, la ficha de cualquier persona con la marca ⏱ muestra sus horas acumuladas.

**Reporte — general o individual:**

En la pestaña **Reporte** eliges primero **General** o **Individual**:

- **General**: elige un rango de fechas (**Desde / Hasta** — pon el mismo día en ambos para ver un solo día) y arma el resumen de todos: cuántas marcas, cuántas personas distintas, y las horas totales de ese período.
- **Individual**: busca a la persona primero. Una vez elegida, el resumen muestra dos cosas por separado: las **horas del período** que elegiste, y las **horas totales acumuladas** de todo su historial con el porcentaje de la meta — así ves de un vistazo si ya casi cumple las 120 horas, aunque el período que estés mirando sea de una sola semana.

**Documentos:** los botones **PDF** y **Excel** generan el informe según el modo activo, con el logo QG y encabezado institucional. Los reportes individuales llevan el nombre y la cédula de la persona; los generales, el nombre del reporte y la fecha. Los dos se pueden compartir directo desde el celular con el menú nativo de Android, y además **quedan respaldados solos en Google Drive** — ver la sección siguiente.

Quitar a alguien de Labor Social no borra su historial de horas — solo dice que ya no está activo en el programa; sus marcas anteriores se conservan y sus reportes individuales se pueden seguir generando.

## 15. Reportes guardados en la nube

Cada PDF y Excel que generes en la app —de asistencia o de Labor Social, general o individual— se guarda solo en Google Drive además de descargarse o compartirse en el teléfono. No hace falta hacer nada extra ni acordarse de guardar nada.

- Quedan organizados en carpetas por tipo: **Reportes de asistencia** y **Reportes Labor Social**, dentro de una carpeta general `QG - Reportes`.
- Cada archivo lleva en el nombre a quién corresponde (si es individual) o la fecha (si es general), y guarda quién lo generó.
- Puedes ver el registro completo de todos los reportes generados —fecha, quién lo hizo, enlace directo— en la pestaña **`Reportes`** de tu hoja de Google.
- Si el teléfono no tiene conexión con la hoja en ese momento, el reporte se genera y descarga igual; simplemente no queda el respaldo en la nube esa vez.

El detalle técnico de dónde exactamente quedan guardadas las carpetas está en `SINCRONIZACION.md`.

## 16. Prospectos

Una lista aparte, separada de la base general, para quienes muestran interés en QG por primera vez — es una pre-inscripción. Pestaña **Prospectos**, con estos datos: nombre, cédula, año que cursa, colegio, correo y teléfono.

- **Cada prospecto recibe un número propio automático — PROS001, PROS002...** — para distinguirse a simple vista de la gente ya inscrita en Personas. Lo asigna la hoja, no el teléfono, así que dos personas registrando prospectos al mismo tiempo nunca terminan con el mismo número. Si borras un prospecto, ese número no se repite nunca — el que sigue después siempre es uno nuevo.
- **Admin y registrador** pueden agregar y editar prospectos. **Solo el admin** puede eliminarlos.
- Si registras una cédula que ya está anotada como prospecto, la app avisa y **actualiza ese mismo registro** en vez de duplicarlo — y nunca borra un dato que ya tenías con uno vacío: si el segundo registro no trae teléfono, por ejemplo, se conserva el que ya estaba.
- Es una lista de datos aparte de `Personas` (nombre, cédula, año, colegio, correo, teléfono son suyos, no de la base general), pero **sí se les puede pasar asistencia**: ver más abajo.

**Asistencia de prospectos:** desde la pestaña **Asistencia**, buscarlos funciona igual que con cualquier persona — salen marcados con una etiqueta "Prospecto" para distinguirlos. Se marcan presentes en la misma lista del día, quedan en el mismo PDF y Excel (con un `+` junto al nombre y una nota al pie explicándolo, para no confundirlos con la estrella `*` de JxJ), y aparecen igual en el reporte por persona del **Historial**. La única diferencia es que su ficha muestra sus propios datos —año, correo, teléfono, representante— en vez de los campos de Personas, ya que son cosas distintas.
- Un prospecto no se convierte solo en una persona inscrita — si decides inscribirlo formalmente, lo agregas a Personas a mano.

**Agregar más datos a cada prospecto:** igual que en Personas, puedes agregar columnas nuevas directo en la pestaña `Prospectos` de tu hoja, y aparecen solas en el formulario de la app — no hace falta pedirlo. De entrada ya trae una columna **"Datos del representante"**, para anotar nombre, teléfono o parentesco de quien responde por esa persona.

## 17. La estrella JxJ

JxJ no es una lista aparte: es una **estrella ★** que se le pone a cualquier persona que ya está en la base general. Todos comparten la misma ficha, los mismos datos y las mismas columnas; la estrella solo marca a quién quieres distinguir.

**Designar a alguien (solo el admin):**
1. Pestaña **JxJ → Buscar por nombre o cédula**.
2. Sale la persona con una estrella vacía ☆ al lado. Tócala para llenarla ★.
3. Ya quedó en "Lista JxJ actual", debajo.

Tocar la estrella de nuevo la quita. También puedes marcarla directamente al **crear o editar** a alguien desde Personas: el formulario tiene un interruptor ★ *Designar como JxJ*, visible solo para el admin.

- **Se les pasa asistencia igual que a cualquiera.** Al buscar un nombre en Asistencia, quien tiene estrella sale marcado con ★ junto al nombre.
- **Quedan identificados en los documentos.** En el PDF su nombre lleva un asterisco y el encabezado dice cuántos de los presentes tienen estrella; en el Excel hay una columna `Lista` (Base/JxJ) y también una columna `JxJ` (SI/NO) en el Excel general de la base.
- **Solo el admin designa.** El registrador ve quién tiene estrella pero no puede agregar ni quitar a nadie; si lo intenta, la hoja lo rechaza aunque manipule la app.
- **Si reimportas un Excel con "Reemplazar lista"**, las estrellas de quien reaparezca en el archivo nuevo se conservan solas — no hay que volver a designar a nadie.

## 18. Qué tan grande puede ser el archivo

Medido sobre la propia app, con la base cargada en el teléfono:

| Personas | Peso guardado | Búsqueda | Revisar duplicados |
|---|---|---|---|
| 1.000 | 130 KB | instantánea | instantáneo |
| 5.000 | 640 KB | instantánea | menos de 1 s |
| 20.000 | 2,5 MB | instantánea | 1-2 s |
| 50.000 | 6,4 MB | instantánea | 3-5 s |

**El límite real no es la velocidad, es el espacio de guardado del navegador: unos 5 MB.** Eso da margen cómodo hasta unas 15.000 personas. Si lo superas, la app te avisa con un mensaje en pantalla y debes descargar un respaldo desde Ajustes; no se pierde nada en silencio.

Notas:

- Al importar, el archivo de Excel se lee completo en memoria. Con más de 20.000 filas la importación puede tardar varios segundos y en teléfonos con poca RAM conviene hacerla desde la computadora y luego sincronizar.
- Buscar por nombre es instantáneo a cualquier tamaño. Buscar por cédulas que no existen es lo más lento, porque recorre toda la base: aun con 50.000 personas está por debajo de la décima de segundo.
- El listado de Personas muestra 60 a la vez a propósito, para no trabar la pantalla; el filtro busca sobre toda la base.
- Conectado a Google Sheets, la base solo se descarga cuando cambió. Las sincronizaciones normales pesan unos pocos KB aunque la base tenga miles de personas.
- Google Sheets aguanta hasta 10 millones de celdas, así que la hoja no es el límite.

## 19. Identidad visual

- Azul institucional `#002871` y naranja `#DF750D`, tomados directamente del logo.
- El logo fue vectorizado, así que se ve nítido en el ícono, en la barra superior y en el encabezado del PDF, a cualquier tamaño.
- El azul organiza la estructura (barra, botones, encabezado del PDF) y el naranja marca los puntos de atención: el contador de presentes, la pestaña activa, el foco del buscador y las personas nuevas.
- El verde de "presente" y el rojo de "no registrado" se mantienen aparte a propósito: son señales de estado y deben distinguirse de un vistazo de los colores de la marca.
