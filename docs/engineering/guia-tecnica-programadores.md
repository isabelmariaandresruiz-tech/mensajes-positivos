# Guia Tecnica para Programadores - AnimoCerca

Ultima actualizacion: 2026-03-10

## 1. Objetivo del sistema
AnimoCerca es una app web instalable (PWA) para enviar mensajes positivos, felicitaciones y apoyo emocional.

Objetivos funcionales actuales:
- Registro y login por email + contrasena.
- Envio de mensajes en-app (inmediato o programado).
- Bandejas de recibidos y enviados.
- Plantillas positivas clasificadas por categoria.
- Importacion de contactos del telefono (si el navegador lo soporta).
- Enlaces virales de invitacion por token (`/i/[token]`) y por username (`/u/[username]`).
- Medidor de felicidad con ranking global/pais/ciudad.
- Modo PWA con install prompt y soporte offline basico.

## 2. Stack y versiones
- Next.js `16.1.6` (App Router)
- React `19.2.3`
- TypeScript `5`
- Prisma `6.19.2`
- SQLite (desarrollo/local)
- Autenticacion con JWT (`jose`) + cookie httpOnly
- Hash de contrasena con `bcryptjs`

Scripts principales (`package.json`):
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run db:push`
- `npm run db:seed`
- `npm run db:studio`

## 3. Arquitectura de alto nivel
1. Frontend y backend viven en el mismo proyecto Next.js.
2. UI server-rendered y client components segun necesidad.
3. APIs en `src/app/api/**/route.ts`.
4. Capa de acceso a datos via Prisma (`src/lib/db/prisma.ts`).
5. Servicios de dominio en `src/server/services/*`.
6. Validacion de payloads con Zod (`src/server/validators/*`).
7. Sesion en cookie `animocerca_session` (JWT firmado HS256).

## 4. Estructura de carpetas (relevante)
```text
mensajes-positivos/
  docs/
    design/
      initial-design.md
    engineering/
      guia-tecnica-programadores.md
  prisma/
    schema.prisma
    seed.ts
    dev.db
  public/
    manifest.webmanifest
    sw.js
    icons/
  scripts/
    start-public-link.ps1
    stop-public-link.ps1
    install-autostart-public-link.ps1
    uninstall-autostart-public-link.ps1
    show-public-link.ps1
  src/
    app/
      (public)/
        login/page.tsx
        register/page.tsx
      (app)/
        layout.tsx
        dashboard/page.tsx
        messages/
          new/page.tsx
          inbox/page.tsx
      api/
        auth/login/route.ts
        auth/register/route.ts
        messages/route.ts
        messages/inbox/route.ts
        messages/sent/route.ts
        templates/route.ts
        users/search/route.ts
        contacts/route.ts
        invites/[token]/route.ts
        happiness/me/route.ts
        happiness/leaderboard/route.ts
        profile/location/route.ts
      i/[token]/page.tsx
      u/[username]/page.tsx
      offline/page.tsx
      layout.tsx
      page.tsx
      not-found.tsx
      globals.css
    components/
      app-shell.tsx
      auth-form.tsx
      install-app-button.tsx
      location-settings-form.tsx
      message-card.tsx
      pwa-provider.tsx
    features/messages/
      new-message-form.tsx
    lib/
      auth/password.ts
      auth/session.ts
      db/prisma.ts
    server/
      services/contacts.ts
      services/happiness.ts
      services/invites.ts
      services/usernames.ts
      validators/auth.ts
      validators/message.ts
    styles/
      tokens.css
  tests/
    e2e/checklist.md
```

## 5. Variables de entorno
Archivo `.env.example`:
```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="change-me-in-production"
```

Notas:
- En local se usa SQLite.
- `SESSION_SECRET` debe ser fuerte en entornos reales.

## 6. Modelo de datos (Prisma)
Enums:
- `MessageStatus`: `SCHEDULED | SENT | CANCELED | READ`
- `DeliveryChannel`: `IN_APP | WHATSAPP`
- `DeliveryStatus`: `QUEUED | SENT | DELIVERED | FAILED`

Modelos principales:
- `User`: perfil, auth, ubicacion, preferencias, relaciones de mensajes/contactos.
- `Template`: mensajes predefinidos por categoria.
- `Message`: mensaje entre usuarios, opcional plantilla, opcional reply, estado.
- `InviteLink`: token de invitacion asociado a mensaje.
- `MessageDelivery`: tracking de entrega por canal.
- `BlockedUser`: bloqueo de remitentes.
- `AbuseReport`: reportes de abuso.
- `Contact`: libreta importada por usuario, con posible vinculo a usuario de la app.

Indices relevantes:
- `Message(recipientId, status, createdAt)`
- `Message(senderId, createdAt)`
- `User(country)` y `User(country, city)`
- `Contact(ownerId, createdAt)`
- `InviteLink(token)`

## 7. Seed y datos demo
`prisma/seed.ts` crea:
- Usuarios demo:
  - `ana@animocerca.local` / `Animo1234` / `@ana`
  - `luis@animocerca.local` / `Animo1234` / `@luis`
- Plantillas mindfulness/positivo por categorias:
  - `mindfulness-respiracion`
  - `animo-diario`
  - `refuerzo-emocional`
  - `gratitud`
  - `autocompasion`
  - `enfoque-y-calma`
- Mensajes demo, deliveries demo, invite demo y contactos cruzados demo.

## 8. Autenticacion y sesion
Archivo clave: `src/lib/auth/session.ts`

- Cookie: `animocerca_session`
- Tipo: JWT firmado HS256
- Expiracion: 7 dias
- Flags: `httpOnly`, `sameSite=lax`, `secure` en produccion

Claims:
- `sub = userId`
- `email`
- `name`
- `username` (opcional)

## 9. Contratos API
### 9.1 Auth
`POST /api/auth/register`
- Request:
```json
{
  "name": "Ana",
  "email": "ana@example.com",
  "password": "Animo1234",
  "country": "Espana",
  "city": "Madrid"
}
```
- Valida con Zod (`registerSchema`).
- Genera `username` unico automaticamente.
- Respuesta 200 con `user` + cookie de sesion.
- Errores: 400, 409, 500.

`POST /api/auth/login`
- Request:
```json
{
  "email": "ana@example.com",
  "password": "Animo1234"
}
```
- Verifica hash bcrypt.
- Respuesta 200 con `user` + cookie de sesion.
- Errores: 400, 401, 500.

### 9.2 Mensajes
`POST /api/messages`
- Requiere sesion.
- Request:
```json
{
  "recipientId": "cuid...",
  "body": "Mensaje positivo...",
  "templateId": "cuid-opcional",
  "inReplyToId": "cuid-opcional",
  "scheduledFor": "2026-03-10T17:30:00.000Z"
}
```
- Reglas:
  - No auto-envio a si mismo.
  - Respeta `allowIncomingMessages` del destinatario.
  - Bloquea si destinatario tiene al remitente bloqueado.
  - Si `inReplyToId`, valida que sea reply correcto.
  - Si `scheduledFor > now` crea `SCHEDULED`, si no envia `SENT`.
- Crea en transaccion:
  - `Message`
  - `MessageDelivery` (IN_APP)
  - `InviteLink` (expira en 14 dias)
- Response 201:
```json
{
  "message": { "id": "...", "status": "SENT" },
  "inviteUrl": "https://host/i/token"
}
```

`GET /api/messages/inbox`
- Requiere sesion.
- Devuelve max 50 mensajes recibidos (`SENT|READ`).

`GET /api/messages/sent`
- Requiere sesion.
- Devuelve max 50 mensajes enviados.

### 9.3 Plantillas y busqueda
`GET /api/templates?category=...`
- Requiere sesion.
- Devuelve `categories` + `items` activas.

`GET /api/users/search?q=...`
- Requiere sesion.
- Minimo 2 caracteres.
- Busca por `name|email|username` (excluye usuario actual).

### 9.4 Contactos
`GET /api/contacts`
- Requiere sesion.
- Devuelve contactos del usuario con posible `linkedUser`.

`POST /api/contacts`
- Requiere sesion.
- Request:
```json
{
  "contacts": [
    { "name": "Luis", "email": "...", "phone": "+34..." }
  ]
}
```
- Normaliza email/telefono, deduplica por fingerprint.
- Vincula con usuarios existentes por email/telefono.
- Upsert max 500 contactos.

### 9.5 Invitaciones
`GET /api/invites/[token]`
- Publico.
- 404 si no existe.
- 410 si expirada.
- 200 con preview:
  - token, senderId, senderName, senderUsername, messageExcerpt, createdAt, expiresAt, isExpired.

### 9.6 Felicidad y ranking
`GET /api/happiness/me`
- Requiere sesion.
- Devuelve score + breakdown + progreso.

`GET /api/happiness/leaderboard?scope=global|country|city&limit=...&country=...&city=...`
- Requiere sesion.
- Si faltan country/city para scope local, usa perfil del usuario.
- Devuelve: `scope, country, city, totalUsers, userRank, items[]`.

### 9.7 Perfil
`PATCH /api/profile/location`
- Requiere sesion.
- Request:
```json
{
  "country": "Espana",
  "city": "Madrid"
}
```
- Actualiza ubicacion para rankings.

## 10. Frontend: rutas principales
Rutas publicas:
- `/login`
- `/register`
- `/i/[token]` (landing de invitacion de mensaje)
- `/u/[username]` (landing de enlace publico de companero)
- `/offline`

Rutas autenticadas:
- `/dashboard`
- `/messages/new`
- `/messages/inbox?view=received`
- `/messages/inbox?view=sent`

Comportamientos clave:
- Home (`/`) redirige a `login` o `dashboard` segun sesion.
- Layout protegido en `src/app/(app)/layout.tsx`.
- `NewMessageForm` soporta:
  - seleccion de usuario por buscador
  - seleccion por contacto vinculado
  - plantillas por categoria
  - envio inmediato y programado
  - reply directo (`inReplyToId`)
  - importacion de contactos (si API del navegador disponible)

## 11. Flujo viral implementado
### 11.1 Token de invitacion (`/i/[token]`)
- Muestra preview del mensaje.
- `?open=1`:
  - sin sesion -> register con `returnTo`
  - con sesion y no remitente -> redirige a `messages/new` pre-rellenado
  - si es remitente -> redirige a enviados

### 11.2 Enlace publico por username (`/u/[username]`)
- Landing para companeros.
- `?open=1`:
  - sin sesion -> register con `returnTo`
  - con sesion y no target -> redirige a `messages/new` pre-rellenado
  - si es el propio usuario -> dashboard

## 12. Medidor de felicidad: algoritmo
Servicio: `src/server/services/happiness.ts`

Senales positivas:
- Puntos base por mensajes enviados con factor de calidad de contenido.
- Bonus por mensajes leidos por destinatario.
- Bonus por diversidad (personas distintas alcanzadas).
- Bonus por respuestas recibidas (con peso decreciente por repeticion).

Anti-spam:
- Penalizacion por volumen diario alto.
- Penalizacion por saturar al mismo destinatario.
- Penalizacion por repetir el mismo texto en masa.

Ranking:
- Scope global, por pais y por ciudad.
- Empate resuelto por nombre (locale `es`).

## 13. PWA y offline
Manifest: `public/manifest.webmanifest`
- `display: standalone`
- `start_url: /dashboard?source=pwa`
- shortcuts a nuevo mensaje y recibidos

Service Worker: `public/sw.js`
- Cache de recursos estaticos + offline page.
- Navegacion: network-first con fallback `/offline`.
- API calls (`/api/*`) no cacheadas por SW.

Provider cliente: `src/components/pwa-provider.tsx`
- Registra SW en secure context o localhost.
- Gestiona `beforeinstallprompt` para UX de instalacion.

## 14. Scripts operativos (modo sin cuentas externas)
### Arranque de enlace publico temporal
- `scripts/start-public-link.ps1`
  - Arranca servidor `next start` en puerto configurable.
  - Crea tunel HTTPS con `localhost.run`.
  - Genera:
    - `.public-link.json`
    - `public-link.txt`
  - Copia enlace al portapapeles opcionalmente.

### Parada y limpieza
- `scripts/stop-public-link.ps1`
  - Mata procesos relacionados (ssh/node/cmd).
  - Limpia archivos de estado.

### Autostart Windows
- `scripts/install-autostart-public-link.ps1`
  - Crea `AnimoCerca-PublicLink.cmd` en Startup.
  - Puede iniciar el enlace al instalar.
- `scripts/uninstall-autostart-public-link.ps1`
  - Elimina launcher de startup.

### Consulta rapida
- `scripts/show-public-link.ps1`
  - Muestra URL activa desde `.public-link.json` o `public-link.txt`.

## 15. QA y validacion
Checklist base en `tests/e2e/checklist.md`.

Verificaciones recomendadas en cada entrega:
- `npm run lint`
- `npm run build`
- Flujo auth: register/login.
- Flujo envio: now/scheduled.
- Flujo viral: `/u/[username]` y `/i/[token]`.
- Instalacion PWA en Android/iOS.

## 16. Limitaciones actuales
- DB SQLite local (no multi-instancia distribuida para produccion real).
- Integracion WhatsApp automatica no implementada (solo flujo manual por enlace).
- Importacion de contactos depende de soporte del navegador/dispositivo.
- No existe job worker dedicado para despachar mensajes `SCHEDULED` (quedan registrados pero no hay scheduler separado en este MVP).

## 17. Recomendaciones para siguiente fase tecnica
1. Migrar datasource a Postgres gestionado para produccion.
2. Crear worker/cron para mensajes programados.
3. Anadir observabilidad (logs estructurados + metricas).
4. Anadir tests de integracion API (Playwright o Vitest + supertest).
5. Versionar contrato API (OpenAPI) para integraciones externas.
6. Evaluar integracion WhatsApp Business API (coste y compliance).

## 18. Convenciones y notas de mantenimiento
- Alias TS: `@/* -> src/*`.
- Evitar logica de negocio en rutas: priorizar `src/server/services`.
- Mantener validacion de input en `src/server/validators`.
- Mantener estilos basados en tokens (`src/styles/tokens.css`).
- Mantener mensajes de error orientados a usuario final (espanol claro).

