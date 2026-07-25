# Biblia_MrTramite.md

**Versión:** 0.1
**Estado:** En construcción
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

---

## 6. MVP definido

### 6.1 Alcance del MVP

La primera iteración del ciclo metodológico (`[LOGAN]` Sección 4.2) debe producir:

1. **Landing page PWA, mobile-first** que:
   - Explique servicios y precios de forma clara.
   - Transmita confianza (mostrar explícitamente "no pagas hasta tener la cita confirmada").
   - Muestre elementos de identidad visual mejorados (Sección 9).
   - Tenga aviso de privacidad visible (Sección 11).

2. **Flujo de solicitud de trámite** (cliente):
   - Selección de trámite.
   - Validación de prerequisitos (ej: pasaporte vigente para visa).
   - Carga de documentos requeridos.
   - Confirmación de que los documentos son correctos.

3. **Panel de administración / CRM** (gestor):
   - Registro manual de clientes externos (los que llegan por Messenger/WhatsApp/Instagram).
   - Lista única de clientes con estado de trámite.
   - Asociación de documentos a cada cliente.
   - Marcar cita como confirmada → dispara notificación de pago al cliente.
   - Registrar pago recibido.

4. **Pago post-confirmación**:
   - Cliente recibe link de pago (transferencia o tarjeta).
   - Estado del trámite cambia a "pagado" al confirmar.

### 6.2 Fuera del MVP (backlog)

- Bot de IA conversacional (fase 2).
- Integración automática con WhatsApp Business API / Messenger / Instagram DM.
- Avance de cita automático (reagendamiento).
- App nativa (iOS/Android).
- Portal de cliente con historial de trámites.
- Múltiples gestores / cuentas de equipo.
- Multi-idioma.

---

## 7. Stack tecnológica (detalle)

| Capa | Tecnología | Estado |
|---|---|---|
| Framework | Next.js 16 (App Router) | Aprobado (DEC-004) |
| Lenguaje | TypeScript 5 | Aprobado |
| Estilos | Tailwind CSS 4 + shadcn/ui (New York) | Aprobado |
| ORM | Prisma | Aprobado |
| DB (MVP) | SQLite | Aprobado (migración a Postgres tras los primeros clientes) |
| DB (prod) | Postgres (Neon) | Pendiente de decisión |
| Auth | NextAuth.js v4 | Pendiente de decisión |
| Pagos | Transferencia + Mercado Pago / Stripe | Pendiente de decisión (Sección 8) |
| Hosting | Vercel Free en MVP | Pendiente de decisión |
| Storage de documentos | Local en MVP → Cloudinary/S3 tras clientes | Pendiente de decisión |
| Bot de IA | z-ai-web-dev-sdk (fase 2) | Pendiente |
| WhatsApp (fase 2) | WhatsApp Cloud API o Twilio | Pendiente |

---

## 8. Herramientas recomendadas con precios

> Estrategia: costos casi cero en MVP. Tras los primeros 5 clientes pagados (~$4,000 MXN), se justifican las herramientas Pro.

### 8.1 MVP (casi gratis)

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

### 8.2 Tras primeros 5 clientes (fase 2)

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

## 9. Identidad visual

### 9.1 Estado actual del logo

Análisis del logo actual (realizado con VLM):

- **Composición:** Vertical asimétrica — rostro (lentes + bigote) sobre rectángulo blanco con brazos flexibles y guantes.
- **Elementos presentes:** ✅ Lentes (aviador, negros con reflejos), ✅ Bigote (handlebar, victoriano), ✅ Guantes (cartoon vintage, blanco con sombreado cross-hatching).
- **Elemento faltante:** ❌ **Corbata** (declarada como parte de identidad pero no presente en el archivo actual).
- **Tipografía:** Slab serif bold (estilo Clarendon/Egyptienne) para "Mr. Trámite". Script cursiva informal para eslogan "Si quieres solución…".
- **Colores actuales:** Negro `#000000`, blanco `#FFFFFF`, degradado gris `#E8E8E8 → #A0A0A0`.
- **Estado profesional:** Parcialmente — concepto sólido pero ejecución con estética clipart. Contraste entre tipografía serif seria y guantes cartoon crea disonancia.

### 9.2 Paleta propuesta

| Color | Hex | Uso |
|---|---|---|
| Negro principal | `#1A1A1A` | Contornos, texto (menos agresivo que `#000`) |
| Blanco | `#FFFFFF` | Fondos, camisa |
| Acento corbata | `#1B4F72` (azul petróleo) o `#C0392B` (rojo ladrillo) | Pendiente de decisión (DEC-008) |
| Gris neutro | `#F5F5F5` | Fondos secundarios |

### 9.3 Mejoras a ejecutar

1. **Añadir corbata** colgando del rectángulo-blanco (DEC-006).
2. **Refinar guantes:** eliminar sombreado cartoon; pasar a estilo flat o minimalista.
3. **Limpiar bigote:** curvas bezier más elegantes.
4. **Estilizar lentes:** quitar reflejos plásticos o reducirlos.
5. **Mejorar integración del rectángulo** con los brazos (que parezcan surgir orgánicamente).
6. **Eliminar degradado gris** del fondo para uso oficial; transparente o blanco.

### 9.4 Versiones del logo a producir

1. **Versión principal:** Color completo, vertical (la actual).
2. **Versión horizontal:** Texto a la derecha del personaje, para headers de web y firmas.
3. **Versión monocromática:** Solo negro, para sellos/facturas.
4. **Versión icono:** Solo rostro (lentes + bigote) para favicon y avatar de app.
5. **Versión PWA:** 512x512 y 192x192 con maskable.

> **Pendiente de decisión (DEC-008):** Color de la corbata (azul petróleo vs rojo ladrillo). Recomendación: azul petróleo `#1B4F72` (confianza profesional, menos agresivo).

---

## 10. Privacidad y manejo de datos sensibles

### 10.1 Marco legal aplicable (México)

- **Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)**.
- Datos personales sensibles que maneja Mr. Trámite: CURP, pasaporte, datos financieros, datos del DS-160 (que incluyen información familiar, laboral, viajes previos).

### 10.2 Obligaciones del proyecto

1. **Aviso de Privacidad visible** en la web desde el día 1.
2. **Consentimiento expreso** del cliente para tratar datos sensibles (casilla obligatoria antes de subir documentos).
3. **Derechos ARCO** (Acceso, Rectificación, Cancelación, Oposición) — canal de contacto para ejercerlos.
4. **Minimización:** solo solicitar los datos estrictamente necesarios para cada trámite.
5. **Retención:** definir cuánto tiempo se conservan los documentos después del trámite (recomendación: 90 días, luego eliminación segura).
6. **Seguridad:** documentos cifrados en tránsito (HTTPS) y en reposo (storage encriptado).

### 10.3 Pendientes de privacidad

- [ ] Redactar Aviso de Privacidad completo (pendiente hasta tener dominio y datos de contacto finales).
- [ ] Definir política de retención y eliminación de documentos.
- [ ] Casilla de consentimiento expreso en el flujo de carga de documentos.
- [ ] Registro en el listado de responsables de datos personales (recomendado por la LFPDPPP, no obligatorio).

---

## 11. Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Cliente sube documentos incorrectos después de pagar | Media | Medio | Política de $300 MXN por cancelación + nueva cita (Sección 4.3) |
| Cancelación externa de cita (consulado, SAT) | Baja | Medio | Política de 50% por gestión de nueva cita (Sección 4.3) |
| Fuga de datos sensibles | Baja | Alto | HTTPS, storage encriptado, minimización, retención corta (Sección 10) |
| Volumen de clientes excede capacidad manual de CRM | Media | Medio | La integración automática con WhatsApp/Messenger (backlog) escalona la operación |
| Logo sin corbata diluye identidad | Alta | Bajo | DEC-006 prioriza la inclusión de corbata antes del lanzamiento |
| Cliente no respeta prerequisito de pasaporte vigente | Media | Alto | Validación obligatoria en el flujo antes de aceptar trámite de visa (Sección 4.1) |

---

## 12. Backlog (fuera del MVP)

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

## 13. Estado del proyecto

- `[estado:exploración]` → próximos pasos a `[estado:arquitectura]`.
- **Avance real actual:** 0% en código. Solo existe: logo, redes sociales, bot de Messenger.
- **Repo:** https://github.com/appsmx/mrtramite (vacío — esta Biblia será el primer commit).

### Próximos pasos inmediatos

1. Aprobar esta Biblia (v0.1 → v0.2 "En revisión").
2. Resolver decisiones pendientes (DEC-007 pasarela de pago, DEC-008 color de corbata).
3. Subir Biblia al repo `appsmx/mrtramite`.
4. Pasar a `[estado:arquitectura]`: diseñar la estructura de la web + CRM y el schema de base de datos.
5. Producir versión actualizada del logo (con corbata).
6. Construir MVP (Fase 5 de `[LOGAN]`).

---

## 14. Pendientes (preguntas abiertas)

- [ ] Definir precios de trámites secundarios (pasaporte, licencia, INE).
- [ ] Definir precio del servicio de "avance de cita".
- [ ] DEC-007: Confirmar pasarela de pago (recomendación: Mercado Pago primero).
- [ ] DEC-008: Color de corbata (recomendación: azul petróleo `#1B4F72`).
- [ ] Definir datos de contacto oficiales (teléfono, email, dirección si aplica).
- [ ] Confirmar si el eslogan actual ("Si quieres solución…") se mantiene.

---

## 15. Glosario del proyecto

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

## 16. Referencias

- `[LOGAN]` — Metodología aplicada. Fuente: https://github.com/appsmx/logan
- `[LOGAN]` Sección 4 — Ciclo metodológico de 8 fases.
- `[LOGAN]` Sección 5 — Sistema de Decisiones (formato usado en Sección 5 de este documento).
- `[LOGAN]` Sección 9.2 — Metadatos obligatorios (encabezado de este documento).
