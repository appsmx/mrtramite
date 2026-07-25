# Wireframes — Mr. Trámite (baja fidelidad)

Wireframes de baja fidelidad para validar **estructura y flujo** antes de implementar. No representan la apariencia final (sin colores de marca, sin imágenes reales).

## Archivos

| Archivo | Descripción |
|---|---|
| `landing.html` | Landing page mobile-first (375px) — propuesta de valor, trámites, razones de confianza, footer |
| `flujo-tramite.html` | Wizard de 5 pasos + pantalla post-envío (6 pantallas en paralelo) |
| `admin-crm.html` | Panel admin: lista de clientes + ficha de cliente + modal "nuevo cliente externo" (3 vistas) |

## Cómo verlos

Abre cada archivo `.html` en cualquier navegador. Son standalone (CSS embebido, sin dependencias).

En el repositorio: https://github.com/appsmx/mrtramite/tree/main/wireframes

## Decisiones de diseño reflejadas en los wireframes

Estos wireframes implementan las decisiones aprobadas en `[BIBLIA]`:

- **DEC-003 (Pago post-confirmación):** visible en hero ("No pagas hasta tener tu cita confirmada"), en resumen del paso 5, y en pantalla post-envío.
- **DEC-005 (CRM unificado):** el panel admin tiene tabla con columna "Canal" (Web / WhatsApp / Messenger / Instagram) + modal para registrar clientes externos manualmente.
- **DEC-007 (Mercado Pago):** ficha de cliente muestra "Mercado Pago (link)" como método de pago.
- **Sección 4.1 (pasaporte vigente prerequisito):** el paso 2 del wizard valida este prerequisito antes de permitir avanzar con visa.
- **Sección 4.3 (política de cancelación):** visible en el paso 5 (checkbox de términos) y en la ficha de cliente del admin (tarjeta amarilla "Políticas aplicables").
- **Sección 10 (privacidad LFPDPPP):** consentimiento expreso en paso 5, notas de minimización en paso 3, política de retención en paso 4.

## Estados del trámite (admin)

La tabla del admin usa estos badges de estado:

| Estado | Color | Significado |
|---|---|---|
| Nuevo | Azul claro | Solicitud recibida, sin revisar |
| En revisión | Amarillo | Gestor revisando documentos |
| Cita confirmada | Verde claro | Cita generada, listo para enviar link de pago |
| Pago pendiente | Rojo claro | Link enviado, esperando pago del cliente |
| Pagado | Verde fuerte | Pago confirmado, trámite en curso |
| Completado | Gris | Trámite finalizado |

## Pendientes de validar con el gestor

Antes de pasar a alta fidelidad y a construcción, validar:

- [ ] ¿Está completo el wizard de 5 pasos? ¿Falta algún paso?
- [ ] ¿La lista de documentos del paso 4 es correcta para visa? (pasaporte, acta, foto, comprobante opcional)
- [ ] ¿Los estados del admin cubren todos los casos reales?
- [ ] ¿Faltan columnas en la tabla de clientes?
- [ ] ¿El modal de "nuevo cliente externo" captura los campos correctos?
- [ ] ¿Las políticas de cancelación se muestran suficientemente claras al cliente?
- [ ] ¿Hay pantallas faltantes? (ej: página de estado de trámite para cliente, página de pago Mercado Pago, email de confirmación)

## Próximo paso

Una vez aprobados estos wireframes:

1. Pasar a **alta fidelidad** (aplicar paleta `#1A1A1A` / `#FFFFFF` / `#1B4F72` + logo real).
2. Diseñar **schema de base de datos** Prisma.
3. Iniciar **construcción del MVP** (Fase 5 de `[LOGAN]`).
