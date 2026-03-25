# AnimoCerca

Aplicacion mobile-first para enviar mensajes positivos, felicitaciones y apoyo emocional desde el telefono. El proyecto vive en un unico repo Next.js con backend y frontend juntos, y hoy soporta dos formas de uso en movil: navegador normal y PWA instalada en la pantalla principal.

## Estado actual del producto
- Registro y login por email y contrasena.
- Campo `phone` opcional en registro para mejorar el matching con contactos.
- Envio de mensajes solo inmediato. La programacion esta desactivada en UI y API.
- Bandeja de recibidos y enviados.
- Los mensajes pasan a `READ` al abrir la bandeja de recibidos.
- Plantillas positivas por categoria.
- Importacion de contactos del telefono cuando el navegador lo permite.
- Enlaces publicos por usuario (`/u/[username]`) e invitaciones por token (`/i/[token]`).
- Respuesta por token con `replyTo` preservado.
- Medidor de felicidad y ranking global, por pais y por ciudad.
- Flujo principal optimizado para telefono.
- Instalacion PWA disponible cuando abres la app con HTTPS o en `localhost`.

## Stack
- Next.js 16 + App Router
- React 19 + TypeScript
- Prisma + SQLite local
- JWT en cookie httpOnly
- Zod para validacion
- PWA ligera con `manifest.webmanifest` + `sw.js`

## Puesta en marcha local
1. Instala dependencias:
   - `npm install`
2. Crea variables de entorno:
   - `copy .env.example .env`
3. Reemplaza `SESSION_SECRET` por un valor largo y aleatorio.
4. Aplica esquema y datos demo:
   - `npm run db:push`
   - `npm run db:seed`
5. Arranca la app:
   - `npm run dev -- --hostname 0.0.0.0 --port 3000`

## Variables de entorno
`.env.example` contiene:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="change-me-before-production"
```

Notas:
- `SESSION_SECRET` es obligatorio. Si falta, la app falla al firmar o verificar sesiones.
- En local se usa SQLite. Para produccion real conviene migrar a Postgres o similar.

## Credenciales demo
- `ana@animocerca.local` / `Animo1234` / `@ana`
- `luis@animocerca.local` / `Animo1234` / `@luis`

## Probar desde el telefono
### Opcion 1: misma red Wi-Fi
1. Arranca con `0.0.0.0`:
   - `npm run dev -- --hostname 0.0.0.0 --port 3000`
2. Averigua la IP local del PC.
3. Abre en el telefono:
   - `http://TU_IP_LOCAL:3000`

Esto sirve para validar UX, formularios, navegacion y flujos basicos desde movil. En esta modalidad la app web funcionara, pero la instalacion PWA puede no aparecer porque la URL no es HTTPS.

### Opcion 2: HTTPS publico para compartir o validar instalacion
1. Arranca el enlace publico:
   - `powershell -ExecutionPolicy Bypass -File scripts/start-public-link.ps1 -Username ana`
2. Revisa la URL activa:
   - `powershell -ExecutionPolicy Bypass -File scripts/show-public-link.ps1`
3. Comparte el enlace de companero:
   - `URL_PUBLICA/u/ana`
4. Apaga el enlace cuando termines:
   - `powershell -ExecutionPolicy Bypass -File scripts/stop-public-link.ps1`

Notas:
- El script levanta `next start` y abre un tunel HTTPS temporal con `localhost.run`.
- El archivo `public-link.txt` guarda `URL_PUBLICA`, `ENLACE_COMPANERO` y `ENVIO_DIRECTO`.
- El equipo debe seguir encendido mientras quieras mantener el enlace activo.

## Instalar la app en el telefono
La ruta correcta para validar instalacion es siempre una URL HTTPS publica o `localhost`.

### Android
1. Abre la app en Chrome o Edge Android.
2. Pulsa el boton `Instalar app` si aparece, o usa `Como instalar`.
3. Si no sale prompt, abre el menu del navegador y usa `Instalar aplicacion` o `Anadir a pantalla principal`.
4. Verifica que abre en modo app y no como pestaña normal.

### iPhone / iPad
1. Abre la app en Safari.
2. Pulsa `Como instalar` para ver la guia si la necesitas.
3. Usa `Compartir > Anadir a pantalla de inicio`.
4. Verifica que el icono queda en la pantalla principal y que la app abre en modo standalone.

## Flujo principal que debe funcionar
1. Crear cuenta desde `/register`.
2. Entrar a `/dashboard`.
3. Compartir `/u/tuusername` o un `inviteUrl`.
4. Abrir el enlace en el telefono.
5. Crear cuenta o iniciar sesion.
6. Enviar mensaje desde `/messages/new`.
7. Abrir `/messages/inbox?view=received` y comprobar que el mensaje queda como `READ`.

## Scripts utiles
- `npm run lint`
- `npm run build`
- `npm run db:push`
- `npm run db:seed`
- `powershell -ExecutionPolicy Bypass -File scripts/start-public-link.ps1 -Username ana`
- `powershell -ExecutionPolicy Bypass -File scripts/show-public-link.ps1`
- `powershell -ExecutionPolicy Bypass -File scripts/stop-public-link.ps1`

## Documentacion
- Guia tecnica: `docs/engineering/guia-tecnica-programadores.md`
- Mapa completo del repo: `docs/engineering/mapa-completo-repo.md`
- Diseno y alcance: `docs/design/initial-design.md`
- Checklist E2E: `tests/e2e/checklist.md`
