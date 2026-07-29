# SESSION_CONTEXT.md

Proyecto: Mr. Trámite
Metodología: LOGAN v1.0
Estado: `[estado:construcción]` — MVP funcional verificado
Avance: MVP completo con 17 decisiones aprobadas, flujo end-to-end verificado

## Objetivo completado en esta sesión

Construcción completa del MVP de Mr. Trámite — gestoría profesional de trámites. El sistema permite a clientes solicitar trámites de Visa Americana (con captura estructurada DS-160), y a administradores gestionar expedientes mediante un Motor de Acciones con validación de transiciones y audit log.

## Decisiones tomadas

17 decisiones aprobadas (DEC-001 a DEC-017), todas registradas en la Biblia:
- DEC-001 a DEC-008: stack, diseño, pagos, identidad visual
- DEC-009 a DEC-016: arquitectura expediente-centric, modular, Motor de Acciones, 10 estados
- DEC-017: principio no-duplicación documento-dato (no pedir datos que ya están en documentos subidos)

## Documentos actualizados

- `Biblia_MrTramite.md` v0.8 — 17 decisiones, MVP completo documentado
- `DS-160_campos.md` v1.1 — catálogo de 13 categorías con DEC-017 aplicada
- `schema/schema.prisma` — 9 tablas, 8 enums, constraint único en Documento
- `schema/seed.ts` — seed inicial (módulo Visa, admin, cliente de prueba)
- `branding/` — 3 logos (vertical, horizontal, icono) con corbata azul petróleo
- `wireframes/` — 6 wireframes v2 (landing, wizard, admin, portal, emails, módulos)
- `README.md` raíz — explica que el repo es documentación-only

## Pendientes

1. **Mercado Pago real** — requiere credenciales de MP Business (access token + public key). El webhook ya está implementado y funciona con stub. Falta crear preferencia de pago real en ACC-004.
2. **Migración a Postgres** — SQLite para MVP, migrar a Neon Postgres Free para producción.
3. **Despliegue en Vercel** — configurar variables de entorno (DATABASE_URL, NEXTAUTH_SECRET, RESEND_API_KEY, MP_ACCESS_TOKEN).
4. **Rate limiting con Upstash** — el rate limiter actual es en memoria (single instance). Para producción multi-instancia, migrar a Upstash Redis.
5. **Subida real de archivos** — actualmente los documentos se registran en DB pero los archivos no se suben a storage. Falta integrar Cloudinary o S3.
6. **OCR de pasaporte (fase 2)** — extraer datos del pasaporte automáticamente con VLM en ACC-002.
7. **Bot conversacional (fase 2)** — usar z-ai-web-dev-sdk para chat en web y WhatsApp.

## Riesgos identificados

- **Password de admin débil:** `admin123` es de desarrollo. Cambiar antes de producción.
- **NEXTAUTH_SECRET:** debe ser único y secreto en producción (no usar el de desarrollo).
- **Webhook MP sin validación de firma:** en producción, validar `x-signature` con HMAC.
- **SQLite:** no soporta concurrencia alta. Migrar a Postgres antes de tener clientes reales.

## Próximo objetivo

Depende del usuario. Opciones:
1. Integrar Mercado Pago real (requiere que el usuario proporcione credenciales)
2. Desplegar en Vercel (requiere cuenta de Vercel + variables de entorno)
3. Agregar subida real de archivos (Cloudinary)
4. Implementar bot conversacional (fase 2 del roadmap)
5. Agregar más módulos de trámite (Pasaporte, INE, Licencia)

## Observaciones

- **Credenciales admin:** admin@mrtramite.mx / admin123 (desarrollo)
- **Proyecto Next.js:** vive en el sandbox de desarrollo, no en el repo de GitHub
- **Repo de GitHub:** es documentación-only (Biblia, schema, wireframes, branding) — NO contiene código fuente
- **LOGAN.md:** repositorio separado en github.com/appsmx/logan
- **El Motor de Acciones (DEC-011)** es el corazón del sistema: 6 acciones (ACC-001 a ACC-006) con validación de transiciones (DEC-012) y audit log
- **Logger estructurado** reemplaza console.log con niveles y filtrado de datos sensibles
- **Rate limiting** aplicado a APIs críticas (5 creaciones/min, 30 acciones/min, 60 webhooks/min)
