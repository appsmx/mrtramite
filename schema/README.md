# Schema Prisma — Mr. Trámite

Schema de la base de datos para el MVP de Mr. Trámite. Diseñado bajo `[BIBLIA]` v0.6 con 17 decisiones aprobadas (DEC-001 a DEC-017).

## Archivos

| Archivo | Descripción |
|---|---|
| `schema.prisma` | Schema Prisma canónico. Autoridad técnica del modelo de datos. |
| `seed.ts` | Seed inicial: crea módulo Visa, usuario admin, cliente/expediente de prueba. |

## Cómo usar

Este schema es referencial. En producción vive en el proyecto Next.js del repo `appsmx/mrtramite` (en `prisma/schema.prisma`). Este archivo es la copia canónica que cualquier IA o dev puede leer para entender el modelo de datos.

Para aplicarlo en un proyecto Next.js:

```bash
# 1. Copiar a prisma/schema.prisma
# 2. Configurar DATABASE_URL en .env (SQLite para MVP, Postgres para prod)
# 3. Generar cliente y sincronizar DB
bun run db:push
# 4. Ejecutar seed
bun run prisma/seed.ts
```

## Decisiones reflejadas

| Decisión | Implementación en el schema |
|---|---|
| **DEC-009** Expediente-centric | `Cliente → N Expediente` (1:N). Expediente es la unidad de trabajo. |
| **DEC-010** Arquitectura modular | Tabla `TramiteTipo` con `codigo`, `activo`, `configJson`. Cada trámite es un registro. |
| **DEC-011** Motor de Acciones | Tabla `Accion` como audit log: código, ejecutadoPor, estadoPrevio, estadoNuevo. |
| **DEC-012** Validaciones de puertas | Implementadas en código (servicio de transiciones), no en DB. Schema solo define el enum. |
| **DEC-013** 4 perfiles | Enum `UsuarioRol` con CLIENTE, ASESOR, GESTOR, ADMIN. |
| **DEC-014** Wizard 10 pasos | Campo `Expediente.ds160Data` (JSON) almacena las categorías 2-13 del DS-160. |
| **DEC-015** Catálogo DS-160 separado | Referenciado en `TramiteTipo.configJson` para el módulo Visa. |
| **DEC-016** 10 estados | Enum `ExpedienteEstado` con los 10 valores. |
| **DEC-017** No-duplicación documento-dato | Campo `Expediente.datosPasaporte` (JSON) separado — capturado por gestor en ACC-002. |

## Modelo ER (resumen)

```
Usuario (1) ─── (0..1) Cliente
                  │
                  └── (1..N) Expediente ── (1) TramiteTipo
                              │
                              ├── (1..N) Documento
                              ├── (1..N) Pago
                              ├── (1..N) Accion ←── (N) Usuario
                              ├── (1..N) Mensaje
                              └── (1..N) Notificacion
```

## Notas técnicas

- **DB en MVP**: SQLite (file-based). Migración a Postgres (Neon Free) en fase 2 — solo cambia `datasource.provider` y `DATABASE_URL`.
- **Enums**: SQLite no soporta enums nativos; Prisma los serializa como String con validación en aplicación.
- **JSON**: SQLite no tiene tipo JSON nativo; usamos String y serializamos con `JSON.stringify/parse` en código.
- **IDs**: `cuid()` para IDs únicos sin secuencia.
- **Folios**: `Expediente.folio` es único y generado por aplicación (formato `MRT-YYYY-####`).

## Pendientes de implementación (no en schema, en código)

- [ ] Servicio de transiciones de estado (matriz DEC-012).
- [ ] Servicio de generación de folios.
- [ ] Servicio de hash de passwords (bcrypt).
- [ ] Webhooks de Mercado Pago (disparan ACC-005).
- [ ] Servicio de envío de emails (Resend) — plantillas en `wireframes/plantillas-email.html`.
- [ ] Servicio de OCR para datos del pasaporte (fase 2).
