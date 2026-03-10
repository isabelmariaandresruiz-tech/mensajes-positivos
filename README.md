# AnimoCerca (MVP Fase 1)

Aplicacion web instalable (PWA) para enviar mensajes positivos, felicitaciones y apoyo.

## Novedades implementadas
- Busqueda de personas por nombre, email o `@username`.
- Importacion de contactos del telefono (cuando el navegador lo permite).
- Bandejas separadas de mensajes **recibidos** y **enviados**.
- Biblioteca de plantillas positivas y de refuerzo emocional basada en mindfulness, clasificada por categorias.
- Medidor de felicidad con ranking: suma por impacto real (personas distintas + respuestas) y penaliza spam/repeticion.
- Ranking por ambitos: global, por pais y por ciudad.

## Stack
- Next.js 16 + TypeScript
- Prisma + SQLite local (cero coste)
- Auth por email/contrasena con cookie de sesion
- PWA minima (manifest + service worker)

## Configuracion
1. Instala dependencias:
   - `npm install`
2. Copia variables de entorno:
   - `copy .env.example .env`
3. Aplica esquema y seed:
   - `npm run db:push`
   - `npm run db:seed`
4. Inicia app:
   - `npm run dev -- --hostname 127.0.0.1 --port 3000`

## Credenciales demo
- Usuario 1: `ana@animocerca.local` / `Animo1234` / `@ana`
- Usuario 2: `luis@animocerca.local` / `Animo1234` / `@luis`

## Rutas clave
- `GET /login`
- `GET /dashboard`
- `GET /u/[username]` (enlace compartible para companeros)
- `GET /messages/new`
- `GET /messages/inbox?view=received`
- `GET /messages/inbox?view=sent`
- `GET /api/users/search?q=`
- `GET/POST /api/contacts`
- `GET /api/templates`
- `POST /api/messages`
- `GET /api/happiness/me`
- `GET /api/happiness/leaderboard?scope=global|country|city`
- `PATCH /api/profile/location`

## Nota sobre contactos del telefono
Por privacidad del sistema operativo, la lectura de contactos requiere permiso y depende del navegador/dispositivo (normalmente Android + Chrome).

## Regla del medidor de felicidad
- Suma por mensajes enviados con contenido util y por mensajes leidos.
- Suma extra por llegar a personas distintas con mensajes suficientemente completos.
- Suma extra por respuestas recibidas (con limite decreciente por la misma persona).
- Penaliza volumen diario excesivo, repetir mucho al mismo contacto y copiar el mismo texto en masa.

## Ranking por ubicacion
- Puedes competir en ranking global, de tu pais y de tu ciudad.
- Si no tienes pais/ciudad, actualizalos desde Dashboard en la tarjeta de ubicacion local.

## Pruebas en telefonos (iOS y Android)
1. Prueba funcional rapida en la misma red Wi-Fi:
   - `npm run dev -- --hostname 0.0.0.0 --port 3000`
   - Abre en el movil: `http://TU_IP_LOCAL:3000`
2. Prueba PWA real (instalacion) en iOS y Android:
   - Usa una URL HTTPS (por ejemplo despliegue en Vercel Hobby).
   - En Android: menu del navegador > "Instalar aplicacion".
   - En iOS (Safari): Compartir > "Anadir a pantalla de inicio".
3. Nota tecnica importante:
   - En HTTP local por IP la app web funciona, pero Service Worker/instalacion PWA puede no estar disponible.
## Flujo para companeros
1. Comparte tu enlace publico desde Dashboard (`/u/tuusername`).
2. Tu companero abre el enlace, instala la app y crea cuenta.
3. Al pulsar "Instalar y enviar mensaje" entra directo al formulario para enviarte mensaje.
## Enlace publico temporal (sin coste)
1. Arrancar enlace HTTPS para compartir:
   - `powershell -ExecutionPolicy Bypass -File scripts/start-public-link.ps1 -Username ana`
2. Compartir con tu companero:
   - `URL_PUBLICA/u/ana`
3. Tu companero pulsa "Instalar y enviar mensaje", se registra y te escribe.
4. Para apagarlo:
   - `powershell -ExecutionPolicy Bypass -File scripts/stop-public-link.ps1`

> Nota: este enlace dura mientras tu ordenador siga encendido y los procesos sigan activos.

## Modo automatico sin cuentas
1. Instalar arranque automatico (lo levanta al iniciar Windows):
   - `powershell -ExecutionPolicy Bypass -File scripts/install-autostart-public-link.ps1 -Username ana`
2. Ver enlace activo en cualquier momento:
   - `powershell -ExecutionPolicy Bypass -File scripts/show-public-link.ps1`
   - Tambien queda guardado en `public-link.txt`.
3. Quitar arranque automatico:
   - `powershell -ExecutionPolicy Bypass -File scripts/uninstall-autostart-public-link.ps1`

> Este modo no requiere Vercel, GitHub ni cuentas externas. Solo mantener el PC encendido.

## Documentacion para programadores
- Guia tecnica completa: `docs/engineering/guia-tecnica-programadores.md`
- Checklist E2E actualizada: tests/e2e/checklist.md

