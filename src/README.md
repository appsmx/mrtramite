# Código fuente del MVP — Mr. Trámite

Código fuente de referencia del MVP implementado en Next.js 16. Este código vive en el proyecto Next.js del sandbox y se copia aquí como referencia documental.

> **Nota:** Este código es referencial. El proyecto Next.js activo está en el sandbox de desarrollo. Cualquier IA o dev que quiera replicar el MVP debe copiar estos archivos a un proyecto Next.js 16 con la stack estándar (Prisma + Tailwind 4 + shadcn/ui + NextAuth v4).

## Estructura

```
src/
├── app/
│   ├── layout.tsx                          # Layout raíz con metadata, PWA, Providers, Toaster
│   ├── page.tsx                            # Wrapper: AdminPanel / ClientePortal / Landing+Wizard
│   ├── globals.css                         # Tailwind 4 + paleta de marca (azul petróleo #1B4F72)
│   └── api/
│       ├── expedientes/
│       │   ├── route.ts                    # POST (crear desde wizard) + GET (listar admin)
│       │   └── [folio]/
│       │       ├── route.ts                # GET (obtener por folio)
│       │       └── accion/route.ts         # POST (ejecutar acción del Motor)
│       ├── mercado-pago/
│       │   └── webhook/route.ts            # Webhook MP → dispara ACC-005
│       └── auth/[...nextauth]/route.ts     # NextAuth handler
├── components/
│   ├── landing.tsx                         # Landing page (hero + trámites + confianza + políticas)
│   ├── admin-panel.tsx                     # Panel admin (lista + ficha + Motor de Acciones)
│   ├── cliente-portal.tsx                  # Portal cliente (dashboard + timeline)
│   ├── login-modal.tsx                     # Modal login con tabs Cliente/Admin
│   ├── providers.tsx                       # SessionProvider wrapper
│   └── wizard/
│       ├── types.ts                        # Tipos WizardData + initialWizardData
│       ├── fields.tsx                      # Campos reutilizables (TextField, SelectField, etc.)
│       └── wizard.tsx                      # Wizard 10 pasos (DS-160)
└── lib/
    ├── db.ts                               # PrismaClient singleton
    ├── auth.ts                             # NextAuth config (admin + cliente)
    └── services/
        ├── folio.ts                        # Generador de folios MRT-YYYY-####
        └── expediente-service.ts           # Servicio principal: crear, ejecutar acción, listar
```

## Stack

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York)
- **DB:** Prisma + SQLite (migración a Postgres en fase 2)
- **Auth:** NextAuth.js v4 (Credentials provider, JWT sessions)
- **Hashing:** bcryptjs
- **Emails:** Resend (pendiente)
- **Pagos:** Mercado Pago (stub, pendiente real)

## Decisiones reflejadas

| Decisión | Archivo(s) |
|---|---|
| DEC-003 Pago post-confirmación | `landing.tsx`, `cliente-portal.tsx` |
| DEC-005 CRM unificado | `admin-panel.tsx` (columna Canal) |
| DEC-007 Mercado Pago | `expediente-service.ts`, `webhook/route.ts` |
| DEC-009 Expediente-centric | `expediente-service.ts`, schema Prisma |
| DEC-010 Arquitectura modular | `expediente-service.ts` (TramiteTipo) |
| DEC-011 Motor de Acciones | `expediente-service.ts` (TRANSICIONES, ACCIONES_CATALOGO), `admin-panel.tsx` (ACCIONES_DISPONIBLES) |
| DEC-012 Validaciones de puertas | `expediente-service.ts` (validarPrecondiciones) |
| DEC-013 4 perfiles | `auth.ts` (UsuarioRol) |
| DEC-014 Wizard 10 pasos | `wizard/wizard.tsx` |
| DEC-015 Catálogo DS-160 | `wizard/types.ts` (WizardData) |
| DEC-016 10 estados | `admin-panel.tsx`, `cliente-portal.tsx` (ESTADO_CONFIG) |
| DEC-017 No-duplicación doc-dato | `wizard/wizard.tsx` (paso 3 sin pasaporte, paso 9 con nota) |

## Credenciales de desarrollo

- **Admin:** admin@mrtramite.mx / admin123
- **Cliente:** cualquier email + folio de expediente existente (ej: ana.flujo@test.com / MRT-2026-0004)

## Pendientes

- [ ] Emails (Resend) — 4 plantillas del Motor de Acciones
- [ ] Mercado Pago real (links de pago + webhook verificado)
- [ ] Aviso de Privacidad completo (LFPDPPP)
- [ ] Subida real de archivos a storage (Cloudinary/S3)
- [ ] OCR de pasaporte (fase 2, con VLM)
