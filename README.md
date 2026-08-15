# Mr. Trámite — Repositorio de documentación

Repositorio oficial de documentación del producto Mr. Trámite — gestoría profesional de trámites.

> **URL producción:** https://mrtramite.mx
> **Nota:** Este repo contiene documentación + código fuente. Cualquier IA o developer que quiera entender el sistema debe leer los documentos de este repo.

## Documentos

| Documento | Propósito |
|---|---|
| [`Biblia_MrTramite.md`](./Biblia_MrTramite.md) | Autoridad del producto: visión, reglas, decisiones (DEC-001 a DEC-017), MVP, stack, identidad, privacidad |
| [`DS-160_campos.md`](./DS-160_campos.md) | Catálogo completo de campos del formulario DS-160 (Visa Americana) |
| [`schema/`](./schema/) | Schema Prisma canónico + seed + README con modelo ER |
| [`branding/`](./branding/) | Logos oficiales (vertical, horizontal, icono) + guía de uso |
| [`wireframes/`](./wireframes/) | Wireframes de baja fidelidad (landing, wizard, admin, portal cliente, emails, módulos) |

## Stack tecnológica

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York)
- **DB:** Prisma + SQLite (migración a Postgres en fase 2)
- **Auth:** NextAuth.js v4 (JWT, Credentials provider)
- **Emails:** Resend (6 plantillas HTML)
- **Pagos:** Mercado Pago (webhook listo, integración real pendiente)

## Cómo trabajar con este proyecto

1. **Para entender el sistema:** lee `Biblia_MrTramite.md` primero. Es la autoridad del producto.
2. **Para entender el modelo de datos:** lee `schema/schema.prisma` y `schema/README.md`.
3. **Para entender el flujo del cliente:** revisa `wireframes/flujo-tramite-v2.html` (wizard 10 pasos).
4. **Para entender el panel admin:** revisa `wireframes/admin-crm-v2.html`.
5. **Para ver el código:** consulta el proyecto Next.js activo en el entorno de desarrollo.

## Metodología

Este proyecto sigue **LOGAN** (Learning, Organization, Governance, Architecture & Navigation) — metodología para desarrollo de productos digitales asistidos por IA.

- Repo de LOGAN: https://github.com/appsmx/logan
- La Biblia es el documento de Nivel Proyecto bajo `[LOGAN]`.

## Estado del MVP

| Componente | Estado |
|---|---|
| Landing page PWA | ✅ Completo |
| Wizard 10 pasos (DS-160) | ✅ Completo |
| APIs backend (Motor de Acciones) | ✅ Completo |
| Auth (admin + cliente) | ✅ Completo |
| Panel admin | ✅ Completo |
| Portal cliente | ✅ Completo |
| Emails (Resend, 6 plantillas) | ✅ Completo |
| Aviso de Privacidad (LFPDPPP) | ✅ Completo |
| Términos y Condiciones | ✅ Completo |
| Rate limiting | ✅ Completo |
| Logger estructurado | ✅ Completo |
| Mercado Pago (real) | ⏳ Pendiente (requiere credenciales) |

## Credenciales de desarrollo

- **Admin:** admin@mrtramite.mx / admin123
- **Cliente:** cualquier email + folio de expediente existente

---

*Mr. Trámite © 2026 — Gestoría profesional de trámites*

## Deploy 2026-08-13

Cambios activos en este deploy:
- DEC-018: Cambio de contraseña desde panel admin (vista Ajustes)
- DEC-019: Chat widget LOGAN OS (burbuja flotante)
- DEC-020: Mercado Pago real integrado
- DEC-021: Cambio de email y nombre desde panel admin

Variables de entorno requeridas en Vercel:
- MERCADO_PAGO_ACCESS_TOKEN (pagos)
- MERCADO_PAGO_WEBHOOK_SECRET (validar firma webhook)
- NEXTAUTH_URL (https://mrtramite.mx)
