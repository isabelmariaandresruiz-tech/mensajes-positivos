# Checklist de validacion (Actualizado 2026-03-10)

## 1) PWA
- Abrir la app en Chrome/Edge con HTTPS y verificar opcion de instalacion.
- Instalar y confirmar apertura en modo standalone.
- Verificar que `/manifest.webmanifest` y `/sw.js` responden 200.

## 2) Flujo companero por username
- Abrir `/u/ana` sin sesion y validar landing publica.
- Abrir `/u/ana?open=1` sin sesion y validar redireccion a `/register?returnTo=...`.
- Crear cuenta nueva y confirmar redireccion a `/messages/new` con destinatario preseleccionado.
- Enviar mensaje y validar que aparece en recibidos de `@ana`.

## 3) Flujo invitacion por token
- Crear mensaje nuevo y copiar `inviteUrl` devuelto por API.
- Abrir `inviteUrl` sin sesion y verificar pantalla de invitacion.
- Pulsar CTA principal y confirmar redireccion a registro/login con retorno.
- Tras autenticacion, confirmar apertura de `messages/new` pre-rellenado al remitente.

## 4) Auth y bandejas
- Registrar usuario y validar cookie de sesion.
- Iniciar sesion con usuario existente.
- Consultar `/api/messages/inbox` y `/api/messages/sent` (200/401 segun sesion).
- Verificar tabs de recibidos y enviados en `/messages/inbox`.

## 5) Mensajes y plantillas
- Buscar destinatario por nombre/email/@username.
- Probar envio inmediato y envio programado.
- Cargar plantillas de `/api/templates` y filtrar por categoria.
- Probar respuesta directa desde boton "Responder" en recibidos.

## 6) Contactos
- Consultar `/api/contacts` autenticado.
- Si el dispositivo lo permite, importar contactos y validar vinculacion a usuarios existentes.

## 7) Felicidad y ranking
- Consultar `/api/happiness/me` y validar `score`, `breakdown` y `progress`.
- Consultar `/api/happiness/leaderboard?scope=global|country|city`.
- Actualizar ubicacion con `PATCH /api/profile/location` y validar ranking local.

## 8) Calidad tecnica
- Ejecutar `npm run lint`.
- Ejecutar `npm run build`.

## 9) Operacion (modo sin cuentas externas)
- Ejecutar `scripts/start-public-link.ps1` y validar `public-link.txt`.
- Ejecutar `scripts/show-public-link.ps1` y validar URL activa.
- Ejecutar `scripts/stop-public-link.ps1` y validar limpieza de estado.
- (Opcional) instalar autostart con `scripts/install-autostart-public-link.ps1`.
