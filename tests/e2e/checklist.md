# Checklist de validacion (Actualizado 2026-03-25)

## 1) Acceso movil
- Abrir la app en el navegador del telefono y confirmar que carga sin overflow horizontal.
- Verificar que la cabecera es compacta y que la navegacion inferior queda accesible con el pulgar.
- Confirmar que los botones principales tienen area tactil amplia.

## 2) Instalacion PWA
- Abrir la app con HTTPS y verificar que `manifest.webmanifest` responde `200`.
- Verificar que `sw.js` responde `200`.
- En Android Chrome, validar que aparece el CTA `Instalar app` o que el navegador ofrece instalar desde el menu.
- Completar la instalacion y comprobar que la app abre en modo standalone.
- En iPhone Safari, validar el flujo manual `Compartir > Anadir a pantalla de inicio`.

## 3) Flujo companero por username
- Abrir `/u/ana` sin sesion y validar la landing publica.
- Abrir `/u/ana?open=1` sin sesion y validar la redireccion a registro con retorno.
- Crear cuenta nueva y confirmar la apertura de `/messages/new` con destinatario preseleccionado.
- Enviar mensaje y validar que aparece en recibidos de `@ana`.

## 4) Flujo invitacion por token
- Crear un mensaje nuevo y copiar `inviteUrl` devuelto por la API.
- Abrir `inviteUrl` sin sesion y verificar la pantalla de invitacion.
- Pulsar la accion principal y confirmar la redireccion al registro con retorno.
- Tras autenticacion, confirmar la apertura de `messages/new` con remitente preseleccionado y `replyTo` activo.

## 5) Auth y bandejas
- Registrar usuario y validar cookie de sesion.
- Confirmar que el campo `Telefono` aparece en registro y se acepta como opcional.
- Iniciar sesion con usuario existente.
- Consultar `/api/messages/inbox` y `/api/messages/sent` (200/401 segun sesion).
- Verificar las tabs de recibidos y enviados en `/messages/inbox`.
- Abrir recibidos y confirmar que los mensajes pasan a `READ`.

## 6) Mensajes y plantillas
- Buscar destinatario por nombre, email o `@username`.
- Probar envio inmediato.
- Verificar que la programacion ya no aparece como opcion de envio.
- Cargar plantillas de `/api/templates` y filtrar por categoria.
- Probar respuesta directa desde el boton `Responder` en recibidos.

## 7) Contactos
- Consultar `/api/contacts` autenticado.
- Si el dispositivo lo permite, importar contactos y validar la vinculacion a usuarios existentes.

## 8) Felicidad y ranking
- Consultar `/api/happiness/me` y validar `score`, `breakdown` y `progress`.
- Consultar `/api/happiness/leaderboard?scope=global|country|city`.
- Actualizar ubicacion con `PATCH /api/profile/location` y validar el ranking local.

## 9) Calidad tecnica
- Ejecutar `npm run lint`.
- Ejecutar `npm run build`.

## 10) Operacion
- Ejecutar `scripts/start-public-link.ps1` y validar `public-link.txt`.
- Ejecutar `scripts/show-public-link.ps1` y validar la URL activa.
- Ejecutar `scripts/stop-public-link.ps1` y validar la limpieza de estado.
- Revisar `scripts/install-autostart-public-link.ps1` antes de usarlo, porque la ruta del proyecto esta hardcodeada para un path concreto de Windows.
