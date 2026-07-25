# DS-160_campos.md

**Versión:** 1.0
**Estado:** Oficial
**Propósito:** Catálogo completo de campos requeridos para llenar el formulario DS-160 (Visa Americana de turista). Autoridad del catálogo del módulo Visa bajo `[BIBLIA]` DEC-015. Cualquier IA o desarrollador que implemente el wizard de Visa debe derivar los campos desde este documento.
**Fecha:** 2026-07-25

> Referencia: `[BIBLIA]` DEC-014 (wizard 10 pasos), DEC-015 (este catálogo), DEC-010 (arquitectura modular).

---

## Mapeo a pasos del wizard

| Paso del wizard | Categorías DS-160 cubiertas |
|---|---|
| Paso 1 | Selección de trámite (no aplica a DS-160) |
| Paso 2 | Validación prerequisito: pasaporte vigente |
| Paso 3 | Categorías 1, 2, 3, 4 (datos básicos + contacto) |
| Paso 4 | Categorías 6, 7, 8 (domicilio, estado civil, familia cercana, padres) |
| Paso 5 | Categorías 9, 10 (familiares en EE.UU.) |
| Paso 6 | Categoría 11 (información laboral) |
| Paso 7 | Categoría 12 (información académica) |
| Paso 8 | Categoría 13 (viajes y visas previas) |
| Paso 9 | Carga de archivos (pasaporte, acta, foto, comprobante) |
| Paso 10 | Revisión + consentimiento + envío |

---

## Catálogo completo de campos

### Categoría 1 — Pasaporte (documento)

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Número de pasaporte | texto | Sí | |
| Fecha de emisión | fecha | Sí | |
| Fecha de expiración | fecha | Sí | Debe tener vigencia mínima 6 meses |
| País emisor | texto | Sí | Default: México |
| Archivo PDF/JPG | file | Sí | Página de datos del pasaporte |

### Categoría 2 — Teléfono

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Teléfono principal | texto | Sí | Formato +52 |
| Teléfono secundario | texto | No | |

### Categoría 3 — Correo electrónico

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Email principal | email | Sí | |
| Email secundario | email | No | |

### Categoría 4 — Redes sociales (últimos 5 años)

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Plataforma | select | No | Facebook, Instagram, Twitter/X, LinkedIn, TikTok, YouTube, etc. |
| Usuario/Handle | texto | No | Sin contraseña |
| Agregar otra red | repeat | No | Repetir par plataforma+usuario |

### Categoría 5 — Datos personales (capturados en paso 3, junto con pasaporte)

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Nombre completo (como en pasaporte) | texto | Sí | |
| Otros nombres usados | texto | No | Apodos, nombres anteriores |
| Sexo | select | Sí | Masculino / Femenino / Otro |
| Fecha de nacimiento | fecha | Sí | |
| Lugar de nacimiento (ciudad) | texto | Sí | |
| País de nacimiento | texto | Sí | Default: México |
| Nacionalidad actual | texto | Sí | Default: Mexicana |
| Otras nacionalidades | texto | No | |
| CURP | texto | Sí | 18 caracteres |

### Categoría 6 — Domicilio

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Calle y número | texto | Sí | |
| Colonia / Delegación | texto | Sí | |
| Ciudad | texto | Sí | |
| Estado | select | Sí | Catálogo de estados mexicanos |
| Código postal | texto | Sí | 5 dígitos |
| País | texto | Sí | Default: México |
| ¿Domicilio postal igual al físico? | boolean | Sí | Si false, mostrar campos postales adicionales |

### Categoría 7 — Estado civil y familia cercana

#### 7a. Estado civil

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Estado civil | select | Sí | Soltero, Casado, Viudo, Divorciado, Unión libre |

#### 7b. Esposo/a (si aplica)

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Nombre completo del cónyuge | texto | Condicional | Si estado civil = Casado/Unión libre |
| Fecha de nacimiento del cónyuge | fecha | Condicional | |
| Nacionalidad del cónyuge | texto | Condicional | |
| ¿Vive en EE.UU.? | boolean | Condicional | Si sí: estatus migratorio |

#### 7c. Hijos (lista repetible)

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Nombre completo del hijo | texto | No | |
| Fecha de nacimiento del hijo | fecha | No | |
| ¿Vive en EE.UU.? | boolean | No | |
| Agregar otro hijo | repeat | No | Botón "Añadir hijo" |

### Categoría 8 — Padres

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Nombre completo del padre | texto | Sí | |
| Fecha de nacimiento del padre | fecha | Sí | |
| ¿Vive en EE.UU.? | boolean | Sí | |
| Nombre completo de la madre | texto | Sí | |
| Fecha de nacimiento de la madre | fecha | Sí | |
| ¿Vive en EE.UU.? | boolean | Sí | |

### Categoría 9 — Familiares directos en EE.UU.

> Familiar directo: padre, madre, hijo/a, hermano/a, esposo/a, prometido/a.

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| ¿Tiene familiares directos en EE.UU.? | boolean | Sí | |
| Nombre completo | texto | Condicional | Si sí, repetible |
| Parentesco | select | Condicional | |
| Estatus migratorio | select | Condicional | Ciudadano, Residente, No inmigrante, Indocumentado |
| Agregar otro familiar directo | repeat | No | |

### Categoría 10 — Familiares indirectos en EE.UU.

> Familiar indirecto: cualquier otro pariente (tíos, primos, abuelos, etc.).

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| ¿Tiene otros parientes en EE.UU.? | boolean | Sí | |
| Nombre completo | texto | Condicional | Si sí, repetible |
| Parentesco | texto | Condicional | |
| Estatus migratorio | select | Condicional | |
| Agregar otro pariente | repeat | No | |

### Categoría 11 — Información laboral

#### 11a-e. Datos del empleo actual

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Situación laboral | select | Sí | Empleado, Independiente, Estudiante, Desempleado, Jubilado |
| Nombre de la empresa | texto | Condicional | Si Empleado o Independiente |
| Teléfono de la empresa | texto | Condicional | |
| Dirección de la empresa | texto | Condicional | |
| Fecha de ingreso | fecha | Condicional | |
| Ingreso mensual | texto | Condicional | En MXN |
| Descripción de actividades/funciones | textarea | Condicional | |

#### Si Estudiante (alternativa)

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Nombre de la escuela | texto | Condicional | Si Estudiante |
| Curso / grado | texto | Condicional | |

### Categoría 12 — Información académica

#### Educación secundaria

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| ¿Estudió secundaria? | boolean | Sí | |
| Nombre de la escuela | texto | Condicional | |
| Fecha de ingreso | fecha | Condicional | |
| Fecha de terminación | fecha | Condicional | |
| Domicilio de la escuela | texto | Condicional | |
| Teléfono de la escuela | texto | Condicional | |

#### Educación preparatoria / bachillerato

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| ¿Estudió preparatoria? | boolean | Sí | |
| Nombre de la escuela | texto | Condicional | |
| Fecha de ingreso | fecha | Condicional | |
| Fecha de terminación | fecha | Condicional | |
| Domicilio de la escuela | texto | Condicional | |
| Teléfono de la escuela | texto | Condicional | |

#### Educación universitaria / técnica

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| ¿Estudió universidad o técnico? | boolean | Sí | |
| Nombre de la escuela | texto | Condicional | |
| Fecha de ingreso | fecha | Condicional | |
| Fecha de terminación | fecha | Condicional | |
| Domicilio de la escuela | texto | Condicional | |
| Teléfono de la escuela | texto | Condicional | |

> Si el cliente estudió más niveles (maestría, doctorado), agregarlos como bloques repetibles.

### Categoría 13 — Información adicional

#### 13a. Viajes en los últimos 5 años

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| ¿Ha visitado otros países en los últimos 5 años? | boolean | Sí | |
| País visitado | select | Condicional | Repetible |
| Fecha del viaje | fecha | Condicional | |
| Duración (días) | número | Condicional | |
| Agregar otro país | repeat | No | |

#### 13b. Visa americana anterior

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| ¿Ha tenido visa americana anteriormente? | boolean | Sí | |
| Tipo de visa | select | Condicional | B1/B2, F1, etc. |
| Número de visa anterior | texto | Condicional | |
| Fecha de emisión | fecha | Condicional | |
| Fecha de expiración | fecha | Condicional | |
| ¿La visa fue cancelada o revocada? | boolean | Condicional | |

#### 13c. Negación de visa

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| ¿Le han negado una visa antes? | boolean | Sí | |
| Fecha de negación | fecha | Condicional | |
| Tipo de visa | select | Condicional | |
| Motivo de negación | textarea | Condicional | |
| ¿Fue negado ingreso a EE.UU.? | boolean | Sí | |
| ¿Ha trabajado ilegalmente en EE.UU.? | boolean | Sí | |

---

## Documentos a subir (paso 9)

| Documento | Formato | Tamaño máx | Obligatorio |
|---|---|---|---|
| Pasaporte vigente (página de datos) | PDF/JPG/PNG | 10 MB | Sí |
| Acta de nacimiento | PDF/JPG/PNG | 10 MB | Sí |
| Foto tipo pasaporte (reciente, 5x5 cm) | JPG/PNG | 5 MB | Sí |
| Comprobante de domicilio | PDF/JPG/PNG | 10 MB | No |
| Acta de matrimonio (si casado) | PDF/JPG/PNG | 10 MB | Condicional |
| Comprobantes de estudios | PDF/JPG/PNG | 10 MB | No |
| Comprobantes de ingresos (últimos 3 meses) | PDF/JPG/PNG | 10 MB | No |

---

## Implementación técnica (referencia)

Cuando se implemente el módulo Visa en código (`modules/visa.config.ts`), este catálogo se traduce a:

- Definición de campos del formulario (tipos, validaciones, condicionalidad).
- Schema Prisma para almacenar las respuestas (probablemente como JSON estructurado por paso, o como tablas normalizadas).
- Reglas de validación del frontend (zod schemas).
- Reglas de puertas de calidad (DEC-012) — qué campos son obligatorios antes de `ACC-002 Documentos aprobados`.

> Pendiente de decisión (cuando se implemente): ¿los campos del DS-160 se almacenan como JSON en una sola columna `Expediente.ds160_data`, o se normalizan en tablas separadas (`Ds160DatosPersonales`, `Ds160Familia`, `Ds160Laboral`, etc.)? Recomendación inicial: JSON por simplicidad en MVP, normalización en fase 2 si se requiere reportes por campo.

---

## Historial de cambios

- 2026-07-25: Versión inicial 1.0 basada en la lista proporcionada por el gestor.
