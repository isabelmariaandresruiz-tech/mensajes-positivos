# Diseno Inicial - AnimoCerca

## Objetivo
Construir una app de mensajes positivos con onboarding corto, estilo calido y flujo viral de compartir por WhatsApp de forma manual.

## Sistema Visual
- Paleta base:
  - `--color-primary`: #e65c2f
  - `--color-secondary`: #ff9b54
  - `--color-ink`: #1f1f25
  - `--color-soft`: #fff7ee
  - `--color-card`: #ffffff
- Tipografia:
  - Titulos: Sora
  - Texto: Nunito Sans
- Estilo de interfaz: tarjetas redondeadas, sombras suaves, CTA fuerte y legible.

## Pantallas MVP
1. Login / Registro.
2. Dashboard.
3. Nuevo mensaje.
4. Recibidos.
5. Landing de invitacion (`/i/{token}`).

## Reglas UX
- CTA principal visible sin hacer scroll en movil.
- Errores claros y cortos.
- Estados vacios con accion sugerida.
- Contraste AA y foco visible para accesibilidad.

## Estado Actual (2026-03-25)
El planteamiento visual inicial sigue vigente, pero el producto ha evolucionado asi:
- Landing publica por usuario para companeros: `/u/[username]`.
- Flujo de invitacion por token con retorno a registro/login: `/i/[token]`.
- Envio de mensajes solo inmediato. La programacion se retiro del flujo para no exponer una feature incompleta.
- Bandejas separadas de enviados y recibidos.
- Importacion de contactos cuando el navegador/dispositivo lo permite.
- Medidor de felicidad con ranking global, por pais y por ciudad.
- Soporte PWA ligero activo para instalacion en telefono, con `manifest`, `service worker`, pagina offline e instrucciones de instalacion en UI.
- Navegacion inferior y decisiones de layout claramente orientadas a telefono.

## Nota de Alcance
- Este archivo conserva la referencia de diseno base.
- El detalle tecnico actualizado vive en:
  - `docs/engineering/guia-tecnica-programadores.md`
  - `docs/engineering/mapa-completo-repo.md`
  - `README.md`
