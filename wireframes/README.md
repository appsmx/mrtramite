# Wireframes — Mr. Trámite

Wireframes de baja fidelidad para validar **estructura y flujo** antes de implementar. No representan la apariencia final (sin colores de marca, sin imágenes reales).

## Versiones

Hay dos versiones de los wireframes:

### v1 (5 pasos) — DEPRECATED
- `landing.html` — landing page (sigue vigente)
- `flujo-tramite.html` — wizard de 5 pasos (reemplazado por v2)
- `admin-crm.html` — panel admin simple (reemplazado por v2)

### v2 (10 pasos) — ACTUAL
- `flujo-tramite-v2.html` — wizard de 10 pasos con captura estructurada DS-160 (DEC-014)
- `admin-crm-v2.html` — panel admin con expedientes (DEC-009) + Motor de Acciones visible (DEC-011)

La versión v2 refleja todas las decisiones aprobadas en `[BIBLIA]` v0.5 (DEC-001 a DEC-017).

## Archivos actuales

| Archivo | Descripción |
|---|---|
| `landing.html` | Landing page mobile-first (375px) — vigente |
| `flujo-tramite-v2.html` | Wizard 10 pasos + pantalla post-envío (11 vistas en paralelo) — DEC-017 aplicada |
| `admin-crm-v2.html` | Panel admin: lista expedientes + ficha + modal confirmar acción (3 vistas) |
| `portal-cliente.html` | **NUEVO** Portal del cliente: login + dashboard por estado (5 vistas) |
| `plantillas-email.html` | **NUEVO** 4 plantillas de email disparadas por Motor de Acciones |
| `admin-modulos.html` | **NUEVO** Admin catálogo de módulos + edición de módulo Visa (2 vistas) |
| `flujo-tramite.html` | (v1, deprecado) Wizard 5 pasos |
| `admin-crm.html` | (v1, deprecado) Panel admin simple |
| `README.md` | Este documento |

## Cómo verlos

Abre cada archivo `.html` en cualquier navegador. Son standalone (CSS embebido, sin dependencias).

En el repositorio: https://github.com/appsmx/mrtramite/tree/main/wireframes

Como GitHub no renderiza HTML, descarga el archivo y ábrelo con doble clic, o usa [htmlpreview.github.io](https://htmlpreview.github.io/?https://github.com/appsmx/mrtramite/blob/main/wireframes/landing.html).

## Decisiones de diseño reflejadas (v2)

| Decisión | Dónde se ve |
|---|---|
| **DEC-003** Pago post-confirmación | Hero de landing, resumen del paso 10, post-envío |
| **DEC-005** CRM unificado | Tabla con columna Canal, modal "+ Cliente externo" |
| **DEC-007** Mercado Pago | Ficha de expediente muestra método |
| **DEC-009** Expediente-centric | Tabla principal lista expedientes (no clientes); ficha muestra cliente + expediente separados |
| **DEC-011** Motor de Acciones | Panel amarillo "Motor de Acciones" en ficha, con ACC-002/ACC-003 disponibles y otras bloqueadas |
| **DEC-012** Validaciones de puertas | Modal "Confirmar acción" muestra advertencia cuando hay documento marcado "Revisar" |
| **DEC-013** Perfiles | Sidebar del admin asume rol Admin (gestor único en MVP) |
| **DEC-014** Wizard 10 pasos | Cada paso del flujo-tramite-v2.html |
| **DEC-015** Catálogo DS-160 | Cada paso del wizard muestra qué categorías DS-160 cubre |
| **DEC-016** Estados estandarizados | Badges de color en tabla de expedientes (10 estados) |
| **Sección 4.1** Pasaporte vigente prerequisito | Paso 2 del wizard |
| **Sección 4.3** Política de cancelación | Tarjeta amarilla en ficha + checkbox términos paso 10 |
| **Sección 10** LFPDPPP | Consentimiento paso 10, minimización paso 3, retención 90 días paso 9 |

## Catálogo de acciones del Motor de Acciones (MVP)

Visible en la ficha de expediente (admin-crm-v2.html, vista 2):

| ID | Acción | Disponible en estado |
|---|---|---|
| `ACC-001` | Documentos recibidos | `NUEVO`, `ESPERANDO_DOCS` |
| `ACC-002` | Documentos aprobados | `REVISION` |
| `ACC-003` | Solicitar documentos adicionales | `REVISION`, `ESPERANDO_DOCS` |
| `ACC-004` | Cita generada | `EN_PROCESO` |
| `ACC-005` | Pago confirmado | `LISTO_PARA_PAGO` (automático vía webhook MP) |
| `ACC-006` | Trámite finalizado | `PAGO_RECIBIDO` |

## Pendientes de validar con el gestor

Antes de pasar a alta fidelidad y a construcción, validar:

- [ ] ¿El wizard de 10 pasos cubre toda la información del DS-160 correctamente?
- [ ] ¿La lista de documentos del paso 9 es correcta? (pasaporte, acta, foto, comprobante, acta matrimonio condicional, recibos sueldo)
- [ ] ¿Los 10 estados del expediente cubren todos los casos reales?
- [ ] ¿Las 6 acciones del MVP son suficientes o falta alguna crítica?
- [ ] ¿El modal "Confirmar acción" con validación de puerta refleja bien el flujo real?
- [ ] ¿Faltan pantallas? (ej: portal del cliente, plantillas de email, configuración de módulos)

## Próximo paso

Una vez aprobados estos wireframes v2:

1. Pasar a **alta fidelidad** (aplicar paleta `#1A1A1A` / `#FFFFFF` / `#1B4F72` + logo real).
2. Diseñar **schema de base de datos** Prisma (Cliente, Expediente, Documento, Pago, Accion, Mensaje, Usuario).
3. Iniciar **construcción del MVP** (Fase 5 de `[LOGAN]`).
