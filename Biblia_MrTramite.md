# Biblia_MrTramite.md

**Versión:** 0.4
**Estado:** En revisión
**Propósito:** Capturar el conocimiento específico del producto Mr. Trámite —visión, usuarios, reglas de negocio, decisiones aprobadas, MVP, stack tecnológica, identidad visual e implicaciones de privacidad. Autoridad del producto (Nivel Proyecto bajo `[LOGAN]`). Cualquier IA que se incorpore al proyecto debe leer este documento antes de producir resultados.
**Fecha:** 2026-07-25

---

## 1. Visión del producto

**Mr. Trámite** es una gestoría personal que gestiona trámites burocráticos a nombre del cliente, con una promesa diferenciadora: **el cliente paga únicamente después de tener la cita confirmada**. La marca transmite confianza a través de transparencia total: el cliente ve la cita confirmada antes de pagar.

La operación inicia digitalmente (campañas en redes sociales, Messenger, WhatsApp, Instagram) y se complementa con una plataforma web (PWA) que:
- Presenta el servicio al público y transmite confianza.
- Recibe solicitudes de trámite y documentos del cliente.
- Sirve como **CRM ligero** para que el gestor (Mr. Trámite) controle todos los clientes —independientemente del canal por el que llegaron.
- Dispara el cobro una vez la cita está confirmada.

---

## 2. Usuarios objetivo

| Atributo | Descripción |
|---|---|
| Rango de edad | 20 a 60 años |
| Necesidad | Gestionar trámites burocráticos sin perder tiempo ni cometer errores |
| Dolor actual | Trámites confusos, sistemas lentos, miedo a perder dinero en gestores no confiables |
| Canal de llegada | Campañas publicitarias → Messenger / WhatsApp / Instagram |
| Momento de pago | Posterior a la confirmación de cita (transferencia o tarjeta) |

---

## 3. Catálogo de trámites y precios

| Trámite | Precio base | Notas |
|---|---|---|
| Visa Americana de turista | $800 MXN | Incluye DS-160 + creación de cita |
| Avance de cita (reagendamiento a fecha más próxima) | Por definir (servicio aparte) | Se cobra de forma independiente a la creación de cita |
| Pasaporte mexicano | Por definir | |
| Licencia de conducir | Por definir | |
| INE | Por definir | |

> **Pendiente:** definir precios para los trámites secundarios y para el servicio de "avance de cita".

---

## 4. Reglas de negocio

### 4.1 Regla crítica de prerequisitos

> ⚠️ **REGLA FUNDACIONAL:** Para tramitar la Visa Americana de turista, el cliente **debe contar con pasaporte vigente al momento de realizar la cita de visa**. La plataforma debe validar este prerequisito antes de aceptar el trámite de visa.

### 4.2 Flujo del trámite (validado con el usuario)

```
1. Cliente contacta (cualquier canal: web/Messenger/WhatsApp/Instagram)
2. Selecciona tipo de trámite
3. Sube documentos requeridos
4. Mr. Trámite revisa documentos y prepara vista previa del trámite
5. Cliente confirma que los documentos son correctos
6. Cliente paga (transferencia o tarjeta)
7. Mr. Trámite genera la cita
8. Cliente recibe confirmación de cita
```

### 4.3 Política de pago y cancelación

| Situación | Política |
|---|---|
| Cliente no paga después de confirmar documentos | La cita se cancela |
| Cliente confirma y paga, pero después detecta errores en sus documentos | $300 MXN de cuota por cancelación + realización de nueva cita. Debe pagar antes de que se realice la cancelación |
| Trámite ya realizado | No hay reembolso |
| Cita cancelada por causa externa (consulado, SAT, etc.) | No es responsabilidad de Mr. Trámite. Como cortesía, se cobra 50% del costo por la gestión de la nueva cita |

### 4.4 Identidad del cliente vs. documentos

El gestor necesita **asociar cada documento recibido a un cliente específico**, sin importar el canal por el que llegó. Los clientes pueden llegar desde:
- Campaña de Facebook (→ Messenger)
- WhatsApp directo
- Instagram
- Web form (futuro)

Esto exige un **CRM unificado** que registre a todo cliente desde el primer contacto, aunque no haya pasado por la web.

---

## 5. Decisiones aprobadas

### DEC-001: Web-first con PWA, mobile-first

- **Problema:** Definir el canal digital primario de la marca.
- **Alternativas:** (a) Web-first PWA, (b) App nativa desde el inicio, (c) Solo redes sociales.
- **Decisión:** Web-first con PWA, optimizado para móviles.
- **Justificación:** Los clientes llegan desde campañas en redes; un link es lo más simple. PWA da experiencia tipo app sin pasar por stores. Cumple `[LOGAN]` Artículo III (simplicidad).
- **Consecuencias:** Stack basada en Next.js 16 + PWA. App nativa queda descartada para MVP.
- **Fecha:** 2026-07-25

### DEC-002: Bot de IA complementario, no sustitutivo

- **Problema:** Rol del bot de IA en el ecosistema.
- **Alternativas:** (a) Bot como canal principal sustituyendo a Messenger, (b) Bot complementario manteniendo Messenger actual.
- **Decisión:** Bot complementario. Messenger/WhatsApp siguen como canales vivos; la web tendrá su propio chat.
- **Justificación:** No romper los canales actuales mientras madura el nuevo. Permite migración progresiva de usuarios.
- **Consecuencias:** MVP no incluye bot de IA. Bot queda para fase 2 del roadmap.
- **Fecha:** 2026-07-25

### DEC-003: Pago post-confirmación como propuesta de valor central

- **Problema:** Cómo diferenciar a Mr. Trámite de gestores no confiables.
- **Alternativas:** (a) Cobro anticipado con reembolso, (b) Cobro post-confirmación de cita, (c) Cobro parcial anticipado + saldo post-confirmación.
- **Decisión:** Cobro post-confirmación de cita.
- **Justificación:** Transmite confianza inmediata; elimina el principal dolor del cliente (miedo a perder dinero). Es la propuesta diferenciadora.
- **Consecuencias:** El diseño del producto debe hacer visible este compromiso en cada paso del flujo. Políticas de cancelación estrictas (Sección 4.3) compensan el riesgo financiero para el gestor.
- **Fecha:** 2026-07-25

### DEC-004: Stack tecnológica del MVP

- **Problema:** Definir stack para construir el MVP.
- **Alternativas:** (a) WordPress + plugins, (b) Next.js 16 + Prisma + SQLite/Postgres, (c) No-code (Glide/Bubble).
- **Decisión:** Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui + Prisma + SQLite en MVP (migración a Postgres en producción).
- **Justificación:** Escalable, mantén control total, integra naturalmente con PWA, y este sandbox ya dispone del stack listo. El costo inicial es nulo (Vercel Free).
- **Consecuencias:** Requiere developer con conocimiento de Next.js. No hay lock-in a no-code.
- **Fecha:** 2026-07-25

### DEC-005: CRM unificado desde el día 1

- **Problema:** Clientes que llegan por canales externos (Messenger/WhatsApp/Instagram) no pasan por la web, pero el gestor necesita controlarlos a todos.
- **Alternativas:** (a) Solo registrar clientes web y llevar externos en Excel, (b) CRM unificado donde el gestor registra a todo cliente sin importar el canal, (c) Integración automática con cada red social.
- **Decisión:** CRM unificado. La web tendrá un panel de administración donde el gestor registra manualmente a clientes externos y captura sus documentos. La integración automática con WhatsApp/Messenger/Instagram queda fuera del MVP.
- **Justificación:** Garantiza trazabilidad (Sección 4.4) sin complejidad de integraciones de APIs sociales en el MVP (Artículo III). El esfuerzo de registro manual es aceptable mientras el volumen es bajo.
- **Consecuencias:** El panel admin es parte del MVP, no opcional. La integración automática va al backlog.
- **Fecha:** 2026-07-25

### DEC-006: Identidad visual — preservar guantes, bigote, lentes; añadir corbata

- **Problema:** El logo actual no incluye corbata, que es uno de los 4 elementos de identidad declarados por el gestor.
- **Alternativas:** (a) Mantener logo actual sin corbata, (b) Añadir corbata y refinar ejecución, (c) Rediseño total.
- **Decisión:** Añadir corbata y refinar la ejecución. Mantener los 4 elementos: guantes, bigote, corbata, lentes.
- **Justificación:** La corbata completa la metáfora "Mr. = ejecutivo/experto". El análisis visual actual muestra estética algo clipart; el refuerzo eleva la percepción de profesionalismo, alineado con la promesa de confianza.
- **Consecuencias:** Se debe producir versión actualizada del logo (varias resoluciones: favicon, avatar de app, header web, versión horizontal, versión monocromática). Detalle en Sección 9.
- **Fecha:** 2026-07-25

### DEC-007: Pasarela de pago inicial — Mercado Pago

- **Problema:** Definir la pasarela de pago para el MVP, considerando que el cliente paga únicamente después de tener la cita confirmada.
- **Alternativas:** (a) Mercado Pago, (b) Stripe, (c) Ambas desde el inicio.
- **Decisión:** Mercado Pago como pasarela inicial del MVP.
- **Justificación:** Mejor adopción en México (Mercado Pago es estándar de facto), permite pago con tarjeta y transferencia SPEI desde una sola integración, sin mensualidad (solo comisión por transacción 3.49% + IVA). Stripe queda como backlog para clientes internacionales o fase 2.
- **Consecuencias:** Integración con Mercado Pago SDK + Webhooks para confirmar pagos automáticamente. Stripe queda fuera del MVP (backlog). El cliente puede pagar por link generado desde el panel admin cuando la cita está confirmada.
- **Fecha:** 2026-07-25

### DEC-008: Color de la corbata — azul petróleo

- **Problema:** Definir el color de la corbata que se añadirá al logo (pendiente por DEC-006).
- **Alternativas:** (a) Azul petróleo `#1B4F72`, (b) Rojo ladrillo `#C0392B`.
- **Decisión:** Azul petróleo `#1B4F72`.
- **Justificación:** Transmite confianza profesional, autoridad y estabilidad — alineado con la promesa central de Mr. Trámite ("no pagas hasta tener la cita"). Menos agresivo que el rojo, mejor encaje con un gestor ejecutivo. Funciona bien sobre fondo blanco de la "camisa".
- **Consecuencias:** La corbata será de color `#1B4F72`. Este color se convierte en acento secundario de la paleta de marca (botones primarios, llamadas a la acción, elementos de confianza).
- **Fecha:** 2026-07-25

### DEC-009: Modelo de datos Expediente-centric

- **Problema:** Un cliente puede solicitar múltiples trámites a lo largo del tiempo (visa hoy, pasaporte mañana, INE el próximo año). Modelar "cliente → trámite" rompe el sistema al segundo trámite.
- **Alternativas:** (a) Cliente → Trámite (1 a muchos, sin abstracción intermedia), (b) Cliente → Expediente → Trámite (con expediente como unidad de trabajo), (c) Cliente → N Trámites sin relación entre sí.
- **Decisión:** Modelo Expediente-centric. Cada cliente puede tener N expedientes; cada expediente corresponde a un trámite específico y contiene sus documentos, estados, mensajes, pagos y timeline.
- **Justificación:** Permite trazabilidad histórica por cliente, reutilización de datos (un cliente que ya tramitó pasaporte no vuelve a subir acta), y prepara el sistema para módulos futuros. Cambiar el modelo después sería costoso.
- **Consecuencias:** El schema de DB tiene tablas `Cliente`, `Expediente`, `TramiteTipo`, `Documento`, `Pago`, `Mensaje`, `Accion`. La UI del admin muestra clientes con sus expedientes anidados.
- **Fecha:** 2026-07-25

### DEC-010: Arquitectura modular por tipo de trámite

- **Problema:** Cada trámite tiene requisitos, documentos y flujo distintos. Construirlos como casos separados produce código no reutilizable.
- **Alternativas:** (a) Un solo flujo genérico para todos los trámites, (b) Código específico por trámite, (c) Arquitectura modular (plugin pattern) con flujo base común + configuración por módulo.
- **Decisión:** Arquitectura modular. Existe un flujo base común (expediente → documentos → revisión → pago → entrega) y cada tipo de trámite es un "módulo" que define: campos requeridos, documentos requeridos, prerequisitos, precio, mensajes automatizados.
- **Justificación:** Permite agregar nuevos trámites (INE, licencia, CURP, RFC, actas, apostillas) sin reescribir el sistema. Alineado con la filosofía "Sistema Operativo para Gestión de Trámites" — los trámites son plugins.
- **Consecuencias:** En MVP solo se implementa el módulo Visa, pero el schema y la arquitectura soportan módulos desde el día 1. Cada módulo se define como un archivo de configuración (TS/JSON).
- **Fecha:** 2026-07-25

### DEC-011: Motor de Acciones — la IA no ejecuta trámites

- **Problema:** Distinguir qué hace la IA vs qué hace el humano en el sistema. Riesgo de asumir que la IA "adivina" el estado del trámite.
- **Alternativas:** (a) IA que detecta automáticamente el estado del trámite, (b) Motor de Acciones explícitas donde cada cambio de estado lo dispara un humano, (c) Híbrido.
- **Decisión:** Motor de Acciones. La IA nunca ejecuta trámites gubernamentales ni infiere estados. Las automatizaciones (cambiar estado, enviar email, registrar fecha) las dispara una **acción humana explícita** (un botón que pulsa el gestor).
- **Justificación:** Hace el sistema auditable, predecible y confiable. La IA observa, organiza, valida, sugiere — pero no decide. Cada acción queda registrada con autor, fecha y consecuencia. Alineado con `[LOGAN]` Artículo IX (IA como arquitecto colaborador, no sustituto del criterio humano).
- **Consecuencias:** Cada cambio de estado en el expediente requiere una acción explícita del gestor. Las acciones se definen en un catálogo (Sección 6.4). El bot conversacional (fase 2) también opera bajo este principio: puede responder preguntas pero no cambiar estados.
- **Fecha:** 2026-07-25

### DEC-012: Sistema de validaciones / puertas obligatorias

- **Problema:** Los humanos olvidan pasos. Un gestor puede intentar finalizar un expediente sin haber confirmado el pago o sin haber marcado el DS-160 como completado.
- **Alternativas:** (a) Permitir cualquier transición de estado (libertad total), (b) Bloquear transiciones inválidas con advertencias, (c) Bloquear transiciones inválidas sin excepciones.
- **Decisión:** Bloquear transiciones inválidas con advertencias claras. El sistema no permite avanzar un expediente al estado "En proceso" si no tiene documentos aprobados; no permite "Finalizar" sin pago confirmado; etc.
- **Justificación:** Reduce errores, mantiene procesos consistentes, protege al gestor de omisiones costosas. Alineado con `[LOGAN]` Sección 6.2 (puertas de calidad).
- **Consecuencias:** Cada acción del Motor de Acciones tiene precondiciones validadas. Si no se cumplen, el sistema muestra qué falta. Las precondiciones se definen en el catálogo de acciones (Sección 6.4).
- **Fecha:** 2026-07-25

### DEC-013: Perfiles de usuario — 4 definidos, 2 habilitados en MVP

- **Problema:** Definir el modelo de permisos del sistema.
- **Alternativas:** (a) Solo Cliente y Admin, (b) 4 perfiles (Cliente, Asesor, Gestor, Admin) desde el inicio, (c) 4 perfiles definidos en modelo, 2 habilitados en MVP.
- **Decisión:** Modelo de datos soporta 4 perfiles desde el día 1, pero MVP habilita solo 2: Admin (combina asesor+gestor+admin, para el gestor único que es el usuario hoy) y Cliente. Asesor y Gestor como perfiles separados se habilitan cuando se contrate personal.
- **Justificación:** Cumple `[LOGAN]` Artículo III (simplicidad). Implementar 4 perfiles sin usuarios reales para cada uno agrega complejidad innecesaria al MVP. La migración de 2 a 4 perfiles es trivial (cambio de rol en DB).
- **Consecuencias:** Tabla `Usuario` con campo `rol` enum: `CLIENTE`, `ASESOR`, `GESTOR`, `ADMIN`. En MVP solo se asignan `ADMIN` (al gestor) y `CLIENTE`. El schema Prisma define los 4 valores desde el inicio.
- **Fecha:** 2026-07-25

### DEC-014: Wizard reorganizado en 10 pasos para captura DS-160 estructurada

- **Problema:** El formulario DS-160 requiere capturar 13 categorías de información (datos personales, familiares, laborales, académicas, viajes, visas previas). El wizard original de 5 pasos era insuficiente.
- **Alternativas:** (a) Un solo formulario largo, (b) Wizard de 5 pasos solo con uploads (cliente sube todo y gestor captura DS-160 manualmente), (c) Wizard de 10 pasos que captura la información estructurada por categorías + uploads.
- **Decisión:** Wizard de 10 pasos con captura estructurada por categorías. El cliente captura toda la información del DS-160 directamente en la web; el gestor solo revisa y valida.
- **Justificación:** Reduce el trabajo manual del gestor (ya no captura el DS-160 desde cero). Mejora trazabilidad. Permite al cliente guardar y continuar después (sesión persistente). El catálogo completo de campos está en `DS-160_campos.md` (DEC-015).
- **Consecuencias:** El wizard pasa de 5 a 10 pasos. Cada paso es una categoría lógica. Se implementa guardado progresivo (el cliente puede salir y volver). El gestor puede editar cualquier campo desde el admin.
- **Fecha:** 2026-07-25

### DEC-015: Catálogo de campos DS-160 como documento separado

- **Problema:** La lista completa de campos del DS-160 (13 categorías con subcampos) es extensa y detallada. No cabe cómodamente en la Biblia sin abrumar.
- **Alternativas:** (a) Incluir todo en la Biblia, (b) Crear documento separado `DS-160_campos.md` referenciado desde la Biblia, (c) Definir como archivo de configuración del módulo Visa.
- **Decisión:** Documento separado `DS-160_campos.md` (autoridad del catálogo Visa) + futura configuración del módulo Visa (`modules/visa.config.ts`) derivada de ese documento.
- **Justificación:** Respeta `[LOGAN]` Artículo IV (única fuente de verdad). El catálogo es específico del módulo Visa, no del producto entero.
- **Consecuencias:** El archivo `DS-160_campos.md` vive en el repo y referencia esta decisión. Cuando se implemente el módulo Visa en código, su configuración se derivará de ese catálogo.
- **Fecha:** 2026-07-25

### DEC-016: Estados estandarizados del expediente (10 estados)

- **Problema:** Los estados libres (texto manual) impiden estadísticas, automatizaciones y reportes.
- **Alternativas:** (a) Estados libres, (b) Estados estandarizados con enum, (c) Estados estandarizados + sub-estados opcionales.
- **Decisión:** 10 estados estandarizados con enum: `NUEVO`, `ESPERANDO_DOCS`, `DOCS_INCOMPLETOS`, `REVISION`, `LISTO_PARA_PAGO`, `PAGO_RECIBIDO`, `EN_PROCESO`, `FINALIZADO`, `CANCELADO`, `ARCHIVADO`.
- **Justificación:** Permite automatizaciones confiables (cada estado dispara acciones distintas), reportes, filtros, y estadísticas. Alineado con el Motor de Acciones (DEC-011) — cada acción cambia el estado a uno de estos 10.
- **Consecuencias:** El campo `Expediente.estado` es un enum con estos 10 valores. La UI muestra badges de color por estado. Las transiciones válidas se definen en una matriz (DEC-012).
- **Fecha:** 2026-07-25

---

## 6. Filosofía del producto

**No construimos una aplicación. Construimos un Sistema Operativo para la Gestión de Trámites.**

### 6.1 Principio rector

La aplicación es una herramienta. El verdadero producto es el sistema. La Visa Americana es simplemente el primer módulo; la arquitectura está preparada para que cualquier trámite futuro (INE, pasaporte, licencia, CURP, RFC, actas, apostillas, regularización vehicular, traducciones) se agregue como plugin sin reescribir la plataforma.

### 6.2 Arquitectura conceptual

```
Sistema Principal
│
├── Usuarios (4 perfiles: Cliente, Asesor, Gestor, Admin)
├── Clientes (catálogo maestro de personas)
├── Expedientes (unidad de trabajo — DEC-009)
├── Documentos (asociados a expedientes)
├── Pagos (asociados a expedientes)
├── Mensajes (historial por expediente)
├── Acciones (audit log + motor de automatizaciones — DEC-011)
├── Automatizaciones (disparadas por acciones)
│
└── Módulos (DEC-010)
    ├── Visa Americana (MVP)
    ├── Pasaporte Mexicano (fase 2)
    ├── INE (fase 2)
    ├── Licencia (fase 2)
    └── ... futuros módulos
```

### 6.3 Flujo universal del expediente

Todos los módulos usan prácticamente el mismo flujo base:

```
1. Nuevo cliente
2. Crear expediente
3. Seleccionar tipo de trámite
4. Solicitar documentos / información
5. Esperar documentos
6. Revisión por gestor
7. Documentos completos
8. Generar trámite (gestor realiza el trámite gubernamental)
9. Enviar revisión al cliente (vista previa)
10. Cliente aprueba
11. Esperar pago
12. Pago confirmado
13. Ejecutar trámite final
14. Entregar resultados
15. Cerrar expediente
```

Cada paso puede requerir acción humana explícita (DEC-011) y validar prerrequisitos (DEC-012).

### 6.4 Catálogo de acciones del Motor de Acciones (MVP)

Cada acción es explícita (la pulsa un humano) y dispara automatizaciones. Lista de acciones del MVP:

| ID | Acción | Precondiciones | Dispara |
|---|---|---|---|
| `ACC-001` | Documentos recibidos | Expediente en `NUEVO` o `ESPERANDO_DOCS` | Cambio de estado a `REVISION` + email al gestor |
| `ACC-002` | Documentos aprobados | Expediente en `REVISION`, todos los docs requeridos presentes | Cambio de estado a `EN_PROCESO` + notificación al cliente |
| `ACC-003` | Solicitar documentos adicionales | Expediente en `REVISION` | Cambio de estado a `DOCS_INCOMPLETOS` + email al cliente con lista de faltantes |
| `ACC-004` | Cita generada | Expediente en `EN_PROCESO`, DS-160 completado | Cambio de estado a `LISTO_PARA_PAGO` + email al cliente con detalles de cita + link de pago |
| `ACC-005` | Pago confirmado | Expediente en `LISTO_PARA_PAGO`, pago registrado en Mercado Pago | Cambio de estado a `PAGO_RECIBIDO` + email de confirmación |
| `ACC-006` | Trámite finalizado | Expediente en `PAGO_RECIBIDO`, todos los entregables listos | Cambio de estado a `FINALIZADO` + email al cliente con resultados + solicitud de testimonio |

Acciones fuera del MVP (backlog): `ACC-007` Expediente archivado, `ACC-008` Cancelar expediente, `ACC-009` Reagendar cita, `ACC-010` Reenviar link de pago.

### 6.5 Matriz de transiciones de estado (DEC-012)

| Estado actual | Acciones permitidas | Estado resultante |
|---|---|---|
| `NUEVO` | `ACC-001` | `REVISION` |
| `ESPERANDO_DOCS` | `ACC-001`, `ACC-003` | `REVISION`, `DOCS_INCOMPLETOS` |
| `DOCS_INCOMPLETOS` | `ACC-001` | `REVISION` |
| `REVISION` | `ACC-002`, `ACC-003` | `EN_PROCESO`, `DOCS_INCOMPLETOS` |
| `EN_PROCESO` | `ACC-004` | `LISTO_PARA_PAGO` |
| `LISTO_PARA_PAGO` | `ACC-005` (automático vía webhook Mercado Pago) | `PAGO_RECIBIDO` |
| `PAGO_RECIBIDO` | `ACC-006` | `FINALIZADO` |
| `FINALIZADO` | `ACC-007` (futuro) | `ARCHIVADO` |
| `CANCELADO` | — (terminal) | — |
| `ARCHIVADO` | — (terminal) | — |

Cualquier transición no listada es inválida y el sistema la bloquea con advertencia (DEC-012).

---

## 7. MVP definido

### 7.1 Alcance del MVP

La primera iteración del ciclo metodológico (`[LOGAN]` Sección 4.2) debe producir:

1. **Landing page PWA, mobile-first** que:
   - Explique servicios y precios de forma clara.
   - Transmita confianza (mostrar explícitamente "no pagas hasta tener la cita confirmada").
   - Muestre elementos de identidad visual mejorados (Sección 10).
   - Tenga aviso de privacidad visible (Sección 11).

2. **Wizard de solicitud de trámite (cliente)** — 10 pasos (DEC-014):
   - Paso 1: Selección de tipo de trámite (solo Visa habilitada en MVP).
   - Paso 2: Validación de prerequisitos (pasaporte vigente).
   - Paso 3: Datos personales básicos (nombre, CURP, contacto).
   - Paso 4: Información personal extendida (domicilio, estado civil, familia cercana).
   - Paso 5: Familiares en EE.UU. (directos e indirectos).
   - Paso 6: Información laboral.
   - Paso 7: Información académica.
   - Paso 8: Viajes y visas previas.
   - Paso 9: Carga de documentos (pasaporte, acta, foto, comprobante).
   - Paso 10: Revisión + consentimiento + envío.
   - Guardado progresivo (el cliente puede salir y volver).
   - Catálogo completo de campos en `DS-160_campos.md` (DEC-015).

3. **Panel de administración / CRM** (gestor, rol `ADMIN` en MVP — DEC-013):
   - **Vista de clientes** con expedientes anidados (DEC-009).
   - **Vista de expedientes** con estado, documentos, pagos, timeline, mensajes.
   - **Motor de Acciones** visible: botones explícitos para cada `ACC-00X` (Sección 6.4).
   - Validaciones de puertas: el sistema bloquea acciones inválidas (DEC-012).
   - Registro manual de clientes externos (los que llegan por Messenger/WhatsApp/Instagram).
   - Edición de cualquier campo del wizard desde el admin.
   - Generación de link de pago Mercado Pago al ejecutar `ACC-004`.

4. **Motor de Acciones** (DEC-011) — implementación de las 6 acciones del MVP (`ACC-001` a `ACC-006`).

5. **Pago post-confirmación** (DEC-003 + DEC-007):
   - Cliente recibe link de Mercado Pago tras `ACC-004`.
   - Webhook de Mercado Pago dispara `ACC-005` automáticamente.
   - Estado del expediente cambia a `PAGO_RECIBIDO`.

6. **Notificaciones por email** (Resend Free):
   - Plantilla de "solicitud recibida".
   - Plantilla de "cita confirmada, procede a pagar".
   - Plantilla de "pago confirmado".
   - Plantilla de "trámite finalizado".

7. **Portal de cliente** (básico):
   - Login con email + folio.
   - Ver estado de su expediente.
   - Ver detalles de la cita.
   - Acceder al link de pago.
   - Descargar comprobantes y resultados tras `ACC-006`.

8. **Aviso de Privacidad** completo (Sección 11) con consentimiento expreso.

### 7.2 Fuera del MVP (backlog)

- Bot de IA conversacional (fase 2). Operará bajo DEC-011: responde preguntas pero no cambia estados.
- Integración automática con WhatsApp Business API / Messenger / Instagram DM.
- Avance de cita automático (reagendamiento).
- App nativa (iOS/Android).
- Múltiples gestores / cuentas de equipo (habilitar perfiles `ASESOR` y `GESTOR` — DEC-013).
- Módulos adicionales: Pasaporte, INE, Licencia, CURP, RFC, Actas, Apostillas (DEC-010).
- Multi-idioma.
- Acciones avanzadas del Motor: `ACC-007` a `ACC-010`.
- Reportes y dashboards avanzados para Admin.
- Programas de referidos.
- Notificaciones SMS.

---

## 8. Stack tecnológica (detalle)

| Capa | Tecnología | Estado |
|---|---|---|
| Framework | Next.js 16 (App Router) | Aprobado (DEC-004) |
| Lenguaje | TypeScript 5 | Aprobado |
| Estilos | Tailwind CSS 4 + shadcn/ui (New York) | Aprobado |
| ORM | Prisma | Aprobado |
| DB (MVP) | SQLite | Aprobado (migración a Postgres tras los primeros clientes) |
| DB (prod) | Postgres (Neon) | Pendiente de decisión |
| Auth | NextAuth.js v4 | Pendiente de decisión |
| Pagos | Transferencia + Mercado Pago | Aprobado (DEC-007) — Stripe en backlog |
| Hosting | Vercel Free en MVP | Pendiente de decisión |
| Storage de documentos | Local en MVP → Cloudinary/S3 tras clientes | Pendiente de decisión |
| Bot de IA | z-ai-web-dev-sdk (fase 2) | Pendiente |
| WhatsApp (fase 2) | WhatsApp Cloud API o Twilio | Pendiente |

---

## 9. Herramientas recomendadas con precios

> Estrategia: costos casi cero en MVP. Tras los primeros 5 clientes pagados (~$4,000 MXN), se justifican las herramientas Pro.

### 9.1 MVP (casi gratis)

| Herramienta | Plan | Costo | Para qué |
|---|---|---|---|
| **Vercel** | Free | $0 | Hosting del Next.js + dominio gratis *.vercel.app |
| **Dominio propio** | .mx o .com | ~$200-500 MXN/año | mrtramite.com.mx / mrtramite.mx |
| **Neon Postgres** | Free | $0 | DB Postgres 0.5 GB suficiente para MVP |
| **Cloudinary** | Free | $0 | Storage de documentos (25 GB, 25 credits/mes) |
| **Resend** | Free | $0 | Emails transaccionales (3,000/mes) |
| **Mercado Pago** | Pay-per-use | 3.49% + IVA por transacción | Cobro con tarjeta. Sin mensualidad |
| **NextAuth.js** | Open source | $0 | Autenticación (admin + cliente futuro) |
| **Vercel Analytics** | Free | $0 | Analytics básico de tráfico |

**Costo total MVP:** ~$200-500 MXN/año (solo dominio).

### 9.2 Tras primeros 5 clientes (fase 2)

| Herramienta | Plan | Costo aprox MXN/mes | Para qué |
|---|---|---|---|
| **Vercel Pro** | Pro | ~$350 ($20 USD) | Más ancho de banda, dominios, analytics avanzado |
| **Neon Pro** | Pro | ~$330 ($19 USD) | DB Postgres 10 GB, branches |
| **Cloudinary Pro** | Pro | ~$125 ($89 USD/año) | Más storage, transformaciones |
| **WhatsApp Business Cloud API** | Free tier | $0 (1000 conversaciones/mes) | Bot por WhatsApp |
| **OpenAI / Anthropic API** | Pay-per-use | ~$200-500 MXN/mes según uso | Bot conversacional IA |
| **Stripe** | Pay-per-use | 2.9% + $0.30 USD por transacción | Alternativa a Mercado Pago (si se desea internacional) |

**Costo estimado fase 2:** ~$1,000-1,500 MXN/mes + comisiones por transacción.

> **Pendiente de decisión (DEC-007):** Confirmar qué pasarela de pago usar. Recomendación: empezar con Mercado Pago (mejor adopción en México) y añadir Stripe solo si hay clientes internacionales.

---

## 10. Identidad visual

### 10.1 Estado del logo

**Logo actualizado y publicado** el 2026-07-25 (commit posterior). 3 versiones disponibles en `/branding/` del repo:

| Archivo | Uso | Tamaño |
|---|---|---|
| `logo_vertical.png` | Versión principal — landing, redes sociales, perfil FB/IG | 864×1152 |
| `logo_horizontal.png` | Headers de web, firmas de email | 1344×768 |
| `logo_icon.png` | Favicon, avatar de app PWA, navbar | 1024×1024 |

### 10.1.1 Análisis del logo original (referencia histórica)

Análisis del logo original (realizado con VLM el 2026-07-25):

- **Composición:** Vertical asimétrica — rostro (lentes + bigote) sobre rectángulo blanco con brazos flexibles y guantes.
- **Elementos presentes:** ✅ Lentes (aviador, negros con reflejos), ✅ Bigote (handlebar, victoriano), ✅ Guantes (cartoon vintage, blanco con sombreado cross-hatching).
- **Elemento faltante:** ❌ **Corbata** (declarada como parte de identidad pero no presente en el archivo actual).
- **Tipografía:** Slab serif bold (estilo Clarendon/Egyptienne) para "Mr. Trámite". Script cursiva informal para eslogan "Si quieres solución…".
- **Colores actuales:** Negro `#000000`, blanco `#FFFFFF`, degradado gris `#E8E8E8 → #A0A0A0`.
- **Estado profesional:** Parcialmente — concepto sólido pero ejecución con estética clipart. Contraste entre tipografía serif seria y guantes cartoon crea disonancia.

### 10.2 Paleta de marca

| Color | Hex | Uso |
|---|---|---|
| Negro principal | `#1A1A1A` | Contornos, texto (menos agresivo que `#000`) |
| Blanco | `#FFFFFF` | Fondos, camisa, guantes |
| Azul petróleo | `#1B4F72` | Aprobado (DEC-008) — corbata, botones primarios, CTAs, elementos de confianza |
| Gris neutro | `#F5F5F5` | Fondos secundarios |

### 10.3 Mejoras ejecutadas (2026-07-25)

1. ✅ **Añadida corbata** azul petróleo `#1B4F72` (DEC-006 + DEC-008).
2. ✅ **Guantes refinados:** estilo flat, con puño visible, sin sombreado cartoon.
3. ✅ **Estilo pictograma minimalista:** sin rostro realista, sin cabello, sin rasgos faciales — solo los accesorios + vestimenta flotando sobre fondo blanco.
4. ✅ **Eliminado el degradado gris** del fondo — ahora blanco puro.
5. ✅ **3 versiones producidas:** vertical, horizontal, icono.

### 10.4 Pendientes de identidad visual

- [ ] Versión monocromática (solo negro) para sellos y facturas.
- [ ] Versión vectorial (.svg) para impresión de alta calidad — encargar a diseñador basándose en las versiones PNG publicadas.
- [ ] Confirmar si el eslogan actual ("Si quieres solución…") se mantiene — no incluido en los logos nuevos.

> Histórico: la decisión de color de corbata (DEC-008) fue resuelta el 2026-07-25 → azul petróleo `#1B4F72`.

---

## 11. Privacidad y manejo de datos sensibles

### 11.1 Marco legal aplicable (México)

- **Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)**.
- Datos personales sensibles que maneja Mr. Trámite: CURP, pasaporte, datos financieros, datos del DS-160 (que incluyen información familiar, laboral, viajes previos).

### 11.2 Obligaciones del proyecto

1. **Aviso de Privacidad visible** en la web desde el día 1.
2. **Consentimiento expreso** del cliente para tratar datos sensibles (casilla obligatoria antes de subir documentos).
3. **Derechos ARCO** (Acceso, Rectificación, Cancelación, Oposición) — canal de contacto para ejercerlos.
4. **Minimización:** solo solicitar los datos estrictamente necesarios para cada trámite.
5. **Retención:** definir cuánto tiempo se conservan los documentos después del trámite (recomendación: 90 días, luego eliminación segura).
6. **Seguridad:** documentos cifrados en tránsito (HTTPS) y en reposo (storage encriptado).

### 11.3 Pendientes de privacidad

- [ ] Redactar Aviso de Privacidad completo (pendiente hasta tener dominio y datos de contacto finales).
- [ ] Definir política de retención y eliminación de documentos.
- [ ] Casilla de consentimiento expreso en el flujo de carga de documentos.
- [ ] Registro en el listado de responsables de datos personales (recomendado por la LFPDPPP, no obligatorio).

---

## 12. Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Cliente sube documentos incorrectos después de pagar | Media | Medio | Política de $300 MXN por cancelación + nueva cita (Sección 4.3) |
| Cancelación externa de cita (consulado, SAT) | Baja | Medio | Política de 50% por gestión de nueva cita (Sección 4.3) |
| Fuga de datos sensibles | Baja | Alto | HTTPS, storage encriptado, minimización, retención corta (Sección 10) |
| Volumen de clientes excede capacidad manual de CRM | Media | Medio | La integración automática con WhatsApp/Messenger (backlog) escalona la operación |
| Logo sin corbata diluye identidad | Alta | Bajo | DEC-006 prioriza la inclusión de corbata antes del lanzamiento |
| Cliente no respeta prerequisito de pasaporte vigente | Media | Alto | Validación obligatoria en el flujo antes de aceptar trámite de visa (Sección 4.1) |

---

## 13. Backlog (fuera del MVP)

- Bot de IA conversacional ("el secretario") para web y WhatsApp.
- Integración automática WhatsApp Business API / Messenger / Instagram DM.
- Avance de cita automático (reagendamiento a fecha más próxima, como servicio aparte).
- Portal de cliente con historial y seguimiento en tiempo real.
- App nativa iOS/Android (si la PWA no satisface).
- Soporte multi-gestor (cuando se contrate personal).
- Multi-idioma (inglés).
- Programa de referidos.
- Pasarela de pago Stripe (además de Mercado Pago).
- Integración con calendario del gestor (Google Calendar).
- Notificaciones SMS (además de email y WhatsApp).

---

## 14. Estado del proyecto

- `[estado:exploración]` → próximos pasos a `[estado:arquitectura]`.
- **Avance real actual:** 0% en código. Solo existe: logo, redes sociales, bot de Messenger.
- **Repo:** https://github.com/appsmx/mrtramite (vacío — esta Biblia será el primer commit).

### Próximos pasos inmediatos

1. ✅ Aprobar esta Biblia (v0.1 → v0.2 → v0.3 "En revisión").
2. ✅ Resolver decisiones pendientes (DEC-007 Mercado Pago, DEC-008 corbata azul petróleo).
3. ✅ Subir Biblia al repo `appsmx/mrtramite`.
4. ✅ Producir versión actualizada del logo (con corbata azul petróleo) — 3 versiones publicadas en `/branding/`.
5. → Pendiente: Pasar a `[estado:arquitectura]`: diseñar la estructura de la web + CRM, schema de base de datos, y wireframes.
6. → En progreso: Construir MVP (Fase 5 de `[LOGAN]`).

---

## 15. Pendientes (preguntas abiertas)

- [ ] Definir precios de trámites secundarios (pasaporte, licencia, INE).
- [ ] Definir precio del servicio de "avance de cita".
- [x] DEC-007: Pasarela de pago inicial → **Mercado Pago** (aprobado 2026-07-25).
- [x] DEC-008: Color de corbata → **Azul petróleo `#1B4F72`** (aprobado 2026-07-25).
- [ ] Definir datos de contacto oficiales (teléfono, email, dirección si aplica).
- [ ] Confirmar si el eslogan actual ("Si quieres solución…") se mantiene.

---

## 16. Glosario del proyecto

| Término | Definición |
|---|---|
| Gestor | Mr. Trámite (la persona) — operador del negocio. |
| Cliente | Usuario que contrata un trámite. |
| Trámite | Cualquier gestión burocrática del catálogo (visa, pasaporte, etc.). |
| Avance de cita | Servicio de reagendamiento a fecha más próxima. Se cobra aparte. |
| Vista previa | Estado del flujo donde el cliente revisa los documentos preparados antes de pagar. |
| CRM unificado | Panel de administración que registra a todo cliente sin importar el canal de llegada. |
| PWA | Progressive Web App. Web con capacidades tipo app nativa. |

---

## 17. Referencias

- `[LOGAN]` — Metodología aplicada. Fuente: https://github.com/appsmx/logan
- `[LOGAN]` Sección 4 — Ciclo metodológico de 8 fases.
- `[LOGAN]` Sección 5 — Sistema de Decisiones (formato usado en Sección 5 de este documento).
- `[LOGAN]` Sección 9.2 — Metadatos obligatorios (encabezado de este documento).
