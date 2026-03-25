# Mapa Completo Del Repo - AnimoCerca

Ultima actualizacion: 2026-03-25

## Objetivo de este documento
Este mapa resume todas las carpetas y archivos relevantes del repo, que hace cada uno y cuales son generados, operativos o de producto. Sirve como referencia rapida para mantenimiento, onboarding y pruebas en telefono.

## Vision general
Raiz del repo:
- `.git/`: metadatos de Git.
- `.next/`: build y cache generados por Next.js. No se edita a mano.
- `node_modules/`: dependencias instaladas. No se edita a mano.
- `docs/`: documentacion de producto, tecnica y mapa del repo.
- `prisma/`: esquema y seed de base de datos.
- `public/`: assets publicos, manifest PWA y service worker.
- `scripts/`: automatizaciones PowerShell para exponer la app y apagar el tunel.
- `src/`: codigo de aplicacion.
- `tests/`: checklist de validacion.

## Archivos de raiz
- `.env`: variables locales reales del entorno. Puede contener secretos.
- `.env.example`: plantilla de entorno.
- `.gitignore`: exclusiones de Git.
- `.public-link.json`: estado del tunel publico. Artefacto operativo.
- `README.md`: entrada principal al proyecto.
- `ENTORNO_PRUEBAS_ACTIVO.txt`: nota local del entorno de pruebas.
- `eslint.config.mjs`: configuracion de ESLint.
- `next-env.d.ts`: tipos generados por Next.js.
- `next.config.ts`: configuracion base de Next.js.
- `package.json`: scripts y dependencias.
- `package-lock.json`: lockfile de npm.
- `public-link.txt`: salida legible del enlace publico. Artefacto operativo.
- `tsconfig.json`: configuracion TypeScript.

## Logs y artefactos operativos en raiz
Estos archivos son salidas de ejecucion y no forman parte del codigo fuente:
- `dev-server.err.log`
- `dev-server.log`
- `dev.err.log`
- `dev.out.log`
- `lt.err.log`
- `lt.out.log`
- `prod.err.log`
- `prod.out.log`
- `public-server.err.log`
- `public-server.out.log`
- `public-tunnel.err.log`
- `public-tunnel.out.log`
- `test-tunnel.err.log`
- `test-tunnel.out.log`
- `tunnel.err.log`
- `tunnel.out.log`
- `tunnel2.err.log`
- `tunnel2.out.log`

## `docs/`
### `docs/design/`
- `initial-design.md`: planteamiento visual y de producto original, mas un resumen de como ha evolucionado.

### `docs/engineering/`
- `guia-tecnica-programadores.md`: documentacion tecnica viva del sistema.
- `mapa-completo-repo.md`: este documento.

## `prisma/`
- `schema.prisma`: modelo de datos principal.
- `seed.ts`: usuarios demo, plantillas, mensajes y contactos iniciales.

## `public/`
- `manifest.webmanifest`: configuracion PWA instalable.
- `sw.js`: service worker con precache minimo y fallback a `/offline`.
- `icons/icon-192.png`: icono principal PWA.
- `icons/icon-512.png`: icono grande PWA.
- `icons/apple-touch-icon.png`: icono para iOS.
- `file.svg`: asset decorativo de ejemplo.
- `globe.svg`: asset decorativo de ejemplo.
- `next.svg`: asset decorativo de ejemplo.
- `vercel.svg`: asset decorativo de ejemplo.
- `window.svg`: asset decorativo de ejemplo.

## `scripts/`
- `start-public-link.ps1`: levanta `next start`, abre tunel HTTPS y genera `.public-link.json` y `public-link.txt`.
- `show-public-link.ps1`: muestra la URL publica actual o la reconstruye desde logs.
- `stop-public-link.ps1`: apaga procesos de tunel y servidor y limpia estado.
- `install-autostart-public-link.ps1`: helper de Windows para iniciar el tunel al arrancar sesion. Revisar antes su ruta hardcodeada.
- `uninstall-autostart-public-link.ps1`: elimina el autostart anterior.

## `src/`
### `src/app/`
- `layout.tsx`: metadata global, fuentes y montaje del `PwaProvider`.
- `page.tsx`: redireccion inicial a `login` o `dashboard`.
- `globals.css`: estilos globales, layout y componentes de interfaz.
- `not-found.tsx`: pantalla 404.
- `offline/page.tsx`: fallback de navegacion sin conexion.
- `icon.png`: icono de app route.

### `src/app/(public)/`
- `login/page.tsx`: login y CTA de instalacion.
- `register/page.tsx`: registro y CTA de instalacion.

### `src/app/(app)/`
- `layout.tsx`: protege rutas autenticadas y monta `AppShell`.
- `dashboard/page.tsx`: panel principal, metricas, rankings, enlace publico y ubicacion.
- `messages/new/page.tsx`: pantalla de nuevo mensaje.
- `messages/inbox/page.tsx`: tabs de recibidos/enviados y marcado de `READ`.

### `src/app/api/`
- `auth/login/route.ts`: login.
- `auth/register/route.ts`: registro.
- `contacts/route.ts`: listar e importar contactos.
- `happiness/me/route.ts`: score de felicidad del usuario actual.
- `happiness/leaderboard/route.ts`: ranking por ambito.
- `invites/[token]/route.ts`: preview publico de invitacion.
- `messages/route.ts`: crear mensajes.
- `messages/inbox/route.ts`: inbox API y marcado `READ`.
- `messages/sent/route.ts`: enviados API.
- `profile/location/route.ts`: actualizar pais y ciudad.
- `templates/route.ts`: listar plantillas.
- `users/search/route.ts`: buscador de usuarios.

### `src/app/i/`
- `[token]/page.tsx`: landing publica de invitacion por token con `replyTo`.

### `src/app/u/`
- `[username]/page.tsx`: landing publica por username.

## `src/components/`
- `app-shell.tsx`: shell autenticada con header y navegacion inferior.
- `auth-form.tsx`: formulario de login/registro.
- `install-app-button.tsx`: CTA de instalacion PWA con logica Android/iOS.
- `location-settings-form.tsx`: formulario para ranking por ubicacion.
- `message-card.tsx`: tarjeta de mensaje en inbox/sent.
- `pwa-provider.tsx`: registro de service worker y captura de `beforeinstallprompt`.

## `src/features/`
### `src/features/messages/`
- `new-message-form.tsx`: buscador de destinatario, plantillas, contactos y envio inmediato.

## `src/lib/`
### `src/lib/auth/`
- `password.ts`: hash y verificacion de contrasenas.
- `session.ts`: firma, verificacion y cookie de sesion.

### `src/lib/db/`
- `prisma.ts`: singleton de Prisma Client.

## `src/server/`
### `src/server/services/`
- `contacts.ts`: normalizacion de contactos.
- `happiness.ts`: algoritmo de score y ranking.
- `invites.ts`: preview de invitaciones por token.
- `usernames.ts`: generacion de `username` unico.

### `src/server/validators/`
- `auth.ts`: esquemas de login y registro.
- `message.ts`: esquema de creacion de mensaje.

## `src/styles/`
- `tokens.css`: tokens visuales base.

## `tests/`
### `tests/e2e/`
- `checklist.md`: checklist manual E2E para validar movil, PWA, auth, mensajes, ranking y operacion.

## Flujo recomendado para instalar y probar en telefono
1. Configurar `.env` a partir de `.env.example`.
2. Ejecutar `npm install`.
3. Ejecutar `npm run db:push`.
4. Ejecutar `npm run db:seed`.
5. Ejecutar `npm run dev -- --hostname 0.0.0.0 --port 3000` para pruebas de UX en la misma red.
6. Ejecutar `npm run build`.
7. Ejecutar `scripts/start-public-link.ps1` para obtener HTTPS y validar instalacion PWA.
8. Abrir la URL publica desde Android Chrome o Safari iPhone.
9. Instalar la app con el CTA o con el menu del navegador.
10. Validar el flujo completo con `tests/e2e/checklist.md`.

## Archivos que no deberias editar a mano
- `.next/**`
- `node_modules/**`
- logs `*.log`
- `.public-link.json`
- `public-link.txt`

## Riesgos y notas de mantenimiento
- La instalacion PWA depende de HTTPS o `localhost`.
- iOS no muestra `beforeinstallprompt`; requiere instalacion manual desde Safari.
- La feature de mensajes programados sigue desactivada aunque Prisma conserve el campo.
- `install-autostart-public-link.ps1` debe revisarse antes de usarse en otro equipo o ruta.
