# Guia Tecnica para Programadores - AnimoCerca

Ultima actualizacion: 2026-03-25

## 1. Objetivo del sistema
AnimoCerca es una app mobile-first para enviar mensajes positivos y apoyo emocional. El flujo principal esta pensado para ejecutarse desde el telefono, tanto en navegador como desde instalacion PWA en la pantalla principal cuando la URL se abre con HTTPS o en `localhost`.

Objetivos funcionales vigentes:
- Registro y login por email y contrasena.
- Campo `phone` opcional en registro.
- Envio inmediato de mensajes entre usuarios.
- Bandejas separadas de recibidos y enviados.
- Plantillas por categoria.
- Importacion de contactos del telefono si el navegador lo soporta.
- Enlace publico por username y enlace de invitacion por token.
- Respuestas por token conservando `replyTo`.
- Medidor de felicidad con ranking global, por pais y por ciudad.
- Soporte PWA ligero para instalacion y fallback de navegacion a `/offline`.

Fuera de alcance hoy:
- Mensajes programados. El esquema Prisma conserva `scheduledFor` y `SCHEDULED`, pero la UI y la API los rechazan para no exponer una feature incompleta.

## 2. Stack y scripts
Versiones base:
- Next.js `16.1.6`
- React `19.2.3`
- TypeScript `5`
- Prisma `6.19.2`
- SQLite para desarrollo local
- `jose` para JWT de sesion
- `bcryptjs` para hashing de contrasenas

Scripts:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run db:push`
- `npm run db:seed`
- `npm run db:studio`

## 3. Variables de entorno
`.env.example`:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="change-me-before-production"
```

Reglas:
- `SESSION_SECRET` es obligatorio. `src/lib/auth/session.ts` lanza error si no existe.
- `DATABASE_URL` apunta a SQLite en local.

## 4. Arranque recomendado
Local:
1. `npm install`
2. `copy .env.example .env`
3. Sustituir `SESSION_SECRET`
4. `npm run db:push`
5. `npm run db:seed`
6. `npm run dev -- --hostname 0.0.0.0 --port 3000`

Compartible con HTTPS:
1. `npm run build`
2. `powershell -ExecutionPolicy Bypass -File scripts/start-public-link.ps1 -Username ana`
3. Compartir el enlace `/u/ana`
4. `powershell -ExecutionPolicy Bypass -File scripts/show-public-link.ps1`
5. `powershell -ExecutionPolicy Bypass -File scripts/stop-public-link.ps1`

## 5. Arquitectura de alto nivel
1. Frontend y backend viven en el mismo proyecto Next.js.
2. App Router separa rutas publicas, privadas y API.
3. Prisma centraliza acceso a datos desde `src/lib/db/prisma.ts`.
4. Validaciones de entrada viven en `src/server/validators`.
5. Logica de dominio se reparte entre `src/server/services/*` y las rutas API.
6. La sesion viaja en una cookie `animocerca_session`.
7. La capa PWA minima se implementa con `src/components/pwa-provider.tsx`, `src/components/install-app-button.tsx`, `public/manifest.webmanifest` y `public/sw.js`.

Referencia practica del repo:
- `docs/engineering/mapa-completo-repo.md`

## 6. Modelo de datos
Enums:
- `MessageStatus`: `SCHEDULED | SENT | CANCELED | READ`
- `DeliveryChannel`: `IN_APP | WHATSAPP`
- `DeliveryStatus`: `QUEUED | SENT | DELIVERED | FAILED`

Modelos principales:
- `User`: identidad, auth, ubicacion y preferencias.
- `Template`: biblioteca de mensajes predefinidos.
- `Message`: mensaje enviado entre usuarios, con soporte de replies.
- `InviteLink`: token publico asociado a un mensaje.
- `MessageDelivery`: tracking por canal.
- `Contact`: libreta importada por usuario.
- `BlockedUser` y `AbuseReport`: preparados para moderacion futura.

Observaciones:
- `User.phone` puede poblarse desde el registro.
- `Message.scheduledFor` sigue en el esquema, pero el backend no lo usa en el flujo actual.

## 7. Sesion y autenticacion
Archivo clave: `src/lib/auth/session.ts`

Comportamiento:
- Cookie: `animocerca_session`
- JWT HS256
- `maxAge`: 7 dias
- `httpOnly`, `sameSite=lax`, `secure` en produccion

Claims:
- `sub`: `userId`
- `email`
- `name`
- `username` opcional

Registro:
- Endpoint: `POST /api/auth/register`
- Valida `name`, `email`, `password`, `phone?`, `country?`, `city?`
- Genera `username` unico automaticamente

Login:
- Endpoint: `POST /api/auth/login`
- Verifica email + password y emite cookie

## 8. Contratos API actualizados
### 8.1 Auth
`POST /api/auth/register`

Ejemplo:

```json
{
  "name": "Ana",
  "email": "ana@example.com",
  "password": "Animo1234",
  "phone": "+34600111222",
  "country": "Espana",
  "city": "Madrid"
}
```

Respuesta:
- `200` con `user` y cookie de sesion
- `400`, `409`, `500` en error

`POST /api/auth/login`

Ejemplo:

```json
{
  "email": "ana@example.com",
  "password": "Animo1234"
}
```

### 8.2 Mensajes
`POST /api/messages`

Ejemplo:

```json
{
  "recipientId": "cuid...",
  "body": "Mensaje positivo",
  "templateId": "cuid-opcional",
  "inReplyToId": "cuid-opcional"
}
```

Reglas actuales:
- Requiere sesion
- No permite autoenvio
- Respeta `allowIncomingMessages`
- Respeta bloqueos
- Si llega `inReplyToId`, valida que el usuario este respondiendo a un mensaje recibido y al remitente correcto
- Si llega `scheduledFor`, responde `400` con error funcional
- Crea `Message`, `MessageDelivery(IN_APP)` e `InviteLink`

`GET /api/messages/inbox`
- Requiere sesion
- Antes de devolver la bandeja, marca `SENT -> READ` para el usuario receptor
- Devuelve max 50 mensajes

`GET /api/messages/sent`
- Requiere sesion
- Devuelve max 50 enviados con datos del destinatario

### 8.3 Busqueda y plantillas
`GET /api/users/search?q=...`
- Requiere sesion
- Busca por `name`, `email` y `username`
- Minimo 2 caracteres

`GET /api/templates?category=...`
- Requiere sesion
- Devuelve `categories` e `items`

### 8.4 Contactos
`GET /api/contacts`
- Requiere sesion
- Lista contactos importados con `linkedUser` si hay coincidencia

`POST /api/contacts`
- Requiere sesion
- Recibe `contacts[]`
- Normaliza email y telefono
- Vincula por email o por telefono cuando coincide con un `User`

### 8.5 Invitaciones
`GET /api/invites/[token]`
- Publico
- Responde `404` si no existe
- Responde `410` si expiro
- Devuelve preview del mensaje

Flujo UI:
- `/i/[token]` muestra preview
- `/i/[token]?open=1` redirige a registro o a `messages/new`
- El `replyTo` se conserva y acaba en `inReplyToId`

### 8.6 Felicidad y ranking
`GET /api/happiness/me`
- Requiere sesion
- Devuelve `score`, `breakdown`, `progress`

`GET /api/happiness/leaderboard?scope=global|country|city`
- Requiere sesion
- Usa pais y ciudad del perfil si faltan en query

### 8.7 Perfil
`PATCH /api/profile/location`
- Requiere sesion
- Actualiza `country` y `city`

## 9. Rutas de UI
Publicas:
- `/login`
- `/register`
- `/u/[username]`
- `/i/[token]`
- `/offline`

Protegidas:
- `/dashboard`
- `/messages/new`
- `/messages/inbox?view=received`
- `/messages/inbox?view=sent`

Comportamiento importante:
- `/` redirige a `login` o `dashboard`
- `src/app/(app)/layout.tsx` protege las rutas privadas
- `src/components/app-shell.tsx` renderiza header y navegacion inferior

## 10. Flujo principal de producto
### 10.1 Enlace por username
1. Usuario autenticado comparte `/u/tuusername`
2. Otra persona abre el enlace
3. Si no tiene sesion, entra a registro con `returnTo`
4. Tras autenticarse, aterriza en `messages/new` con destinatario preseleccionado

### 10.2 Invitacion por token
1. Al crear un mensaje se genera `inviteUrl`
2. Otra persona abre `/i/[token]`
3. `?open=1` la lleva a registro o al formulario
4. La respuesta conserva el hilo mediante `replyTo`

### 10.3 Lectura y ranking
1. Abrir la bandeja de recibidos marca mensajes como `READ`
2. `computeHappinessForUser()` premia mensajes leidos y respuestas reales
3. El dashboard muestra enviados, recibidos y leidos

## 11. Telefono, navegador y PWA
Estado cierto del repo:
- La UX principal es telefono-first.
- `public/manifest.webmanifest` declara la app como instalable en `standalone`.
- `src/components/pwa-provider.tsx` registra `sw.js`, gestiona actualizaciones y captura `beforeinstallprompt`.
- `src/components/install-app-button.tsx` usa el prompt real cuando existe y, si no, explica el flujo manual para Android e iOS.
- `public/sw.js` hace precache minimo y fallback de navegacion a `/offline`.

Reglas operativas:
1. La instalacion real debe probarse con HTTPS o `localhost`.
2. La red local por IP sirve para validar UX, pero no garantiza prompt de instalacion.
3. iOS sigue dependiendo de `Safari > Compartir > Anadir a pantalla de inicio`.

## 12. Scripts operativos
### `scripts/start-public-link.ps1`
- Inicia `next start` en `127.0.0.1:$Port`
- Abre tunel HTTPS temporal con `localhost.run`
- Guarda estado en `.public-link.json`
- Escribe accesos en `public-link.txt`

### `scripts/show-public-link.ps1`
- Lee `.public-link.json`
- Si puede, refresca la URL a partir del log del tunel

### `scripts/stop-public-link.ps1`
- Mata procesos `ssh`, `node` y `cmd` asociados al puerto
- Borra `.public-link.json` y `public-link.txt`

### `scripts/install-autostart-public-link.ps1`
- Helper opcional para Windows
- Requiere revisar la ruta hardcodeada del proyecto antes de depender de el

## 13. QA recomendada
Minimo por entrega:
- `npm run lint`
- `npm run build`
- Registro
- Login
- Envio inmediato
- Lectura y cambio a `READ`
- Flujo `/u/[username]`
- Flujo `/i/[token]` con `replyTo`
- Importacion de contactos si el dispositivo la soporta
- Ranking global / pais / ciudad
- Validacion en telefono por IP
- Validacion de instalacion PWA por HTTPS

## 14. Limitaciones y deuda conocida
- SQLite local no es la opcion final para produccion compartida
- La programacion de mensajes sigue desactivada
- El ranking calcula puntuaciones usuario a usuario y puede encarecerse con mas volumen
- La importacion de contactos depende del soporte del navegador
- `WHATSAPP`, `BlockedUser` y `AbuseReport` estan modelados pero no tienen flujo completo de producto
- El `service worker` no cachea `/api/*`, asi que el offline es de navegacion, no de datos
