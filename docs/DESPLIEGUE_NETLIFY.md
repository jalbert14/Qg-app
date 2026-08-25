# Guía de Despliegue en Netlify — Queremos Graduarnos (QG-APP)

Esta guía explica paso a paso cómo publicar **QG-APP** de forma **100% gratuita y segura** en **Netlify** con HTTPS habilitado.

---

## Opción 1: Despliegue Rápido (Arrastrar y Soltar) — Sin necesidad de Git

1. Inicia sesión o crea una cuenta gratuita en [app.netlify.com](https://app.netlify.com).
2. En el panel principal (*Sites*), busca la sección que dice:
   > **"Want to deploy a new site without connecting to Git? Drag and drop your site folder here"**.
3. Selecciona la carpeta completa de tu proyecto en la computadora:
   `c:\Users\Usuario.COMPUTADORA-SOP\Desktop\QG-APP`
4. Arrastra y suelta la carpeta dentro del recuadro de Netlify.
5. En menos de 10 segundos, Netlify generará un enlace público HTTPS (ejemplo: `https://asistencia-qg-12345.netlify.app`).

---

## Opción 2: Despliegue Continuo con GitHub (Recomendado)

1. Sube tu código a un repositorio en GitHub (público o privado).
2. Entra a Netlify y presiona **"Add new site" → "Import an existing project"**.
3. Selecciona **GitHub** y autoriza el acceso a tu repositorio `QG-APP`.
4. Configura las opciones de despliegue:
   - **Branch to deploy**: `main` o `master`
   - **Build command**: *(Dejar en blanco)*
   - **Publish directory**: `.` *(Punto: la raíz del proyecto)*
5. Haz clic en **Deploy site**. Cada vez que subas cambios a GitHub, Netlify actualizará la web automáticamente.

---

## Medidas de Seguridad Aplicadas

- **HTTPS Automático**: Toda la comunicación entre los usuarios y la app viaja cifrada mediante SSL.
- **Protección HTTP (netlify.toml)**: Se incluyen cabeceras anti-clickjacking (`X-Frame-Options`), prevención de tipos MIME (`X-Content-Type-Options`) y reglas de aislamiento origin.
- **Protección de Datos Locales**: Los datos guardados en el almacenamiento del navegador (`localStorage`) están ofuscados mediante `qg1:` Base64 URL-safe, evitando inspección directa por terceros en dispositivos compartidos.
- **Seguridad en la Hoja de Google (Backend)**: Todas las operaciones de eliminación o modificación de base de datos están restringidas por rol en el archivo de Google Apps Script (`backend/Codigo.gs`).

---

## Cambiar el Dominio de la App en Netlify

Si deseas ponerle un nombre personalizado a la URL:
1. En Netlify, ve a **Site configuration → Domain management**.
2. Haz clic en **Options → Edit site name**.
3. Escribe un nombre legible, por ejemplo: `asistencia-qg` → la URL quedará como:
   `https://asistencia-qg.netlify.app`
