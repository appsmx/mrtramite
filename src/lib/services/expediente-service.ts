import { db } from '@/lib/db'
import { generarFolio } from './folio'
import { logger } from '@/lib/logger'
import type { ExpedienteEstado } from '@prisma/client'
import type { WizardData } from '@/components/wizard/types'

// ============================================================================
// Matriz de transiciones de estado (DEC-012)
// ============================================================================
// Define qué acciones están permitidas en cada estado y a qué nuevo estado
// llevan. Cualquier transición no listada aquí es inválida.

interface Transicion {
  accion: string
  nuevoEstado: ExpedienteEstado
}

export const TRANSICIONES: Record<ExpedienteEstado, Transicion[]> = {
  NUEVO: [
    { accion: 'ACC-001', nuevoEstado: 'REVISION' },
  ],
  ESPERANDO_DOCS: [
    { accion: 'ACC-001', nuevoEstado: 'REVISION' },
    { accion: 'ACC-003', nuevoEstado: 'DOCS_INCOMPLETOS' },
  ],
  DOCS_INCOMPLETOS: [
    { accion: 'ACC-001', nuevoEstado: 'REVISION' },
  ],
  REVISION: [
    { accion: 'ACC-002', nuevoEstado: 'EN_PROCESO' },
    { accion: 'ACC-003', nuevoEstado: 'DOCS_INCOMPLETOS' },
  ],
  EN_PROCESO: [
    { accion: 'ACC-004', nuevoEstado: 'LISTO_PARA_PAGO' },
  ],
  LISTO_PARA_PAGO: [
    { accion: 'ACC-005', nuevoEstado: 'PAGO_RECIBIDO' },
  ],
  PAGO_RECIBIDO: [
    { accion: 'ACC-006', nuevoEstado: 'FINALIZADO' },
  ],
  FINALIZADO: [],
  CANCELADO: [],
  ARCHIVADO: [],
}

// Catálogo de acciones (DEC-011, Sección 6.4 Biblia)
export const ACCIONES_CATALOGO: Record<string, { descripcion: string; notificacion?: string }> = {
  'ACC-001': { descripcion: 'Documentos recibidos', notificacion: undefined },
  'ACC-002': { descripcion: 'Documentos aprobados', notificacion: 'SOLICITUD_RECIBIDA' },
  'ACC-003': { descripcion: 'Solicitar documentos adicionales', notificacion: 'SOLICITUD_DOCS_ADICIONALES' },
  'ACC-004': { descripcion: 'Cita generada', notificacion: 'CITA_CONFIRMADA' },
  'ACC-005': { descripcion: 'Pago confirmado', notificacion: 'PAGO_CONFIRMADO' },
  'ACC-006': { descripcion: 'Trámite finalizado', notificacion: 'TRAMITE_FINALIZADO' },
}

// ============================================================================
// Crear expediente desde wizard
// ============================================================================

export interface CrearExpedienteInput {
  wizardData: WizardData
  adminUserId?: string // Si fue creado manualmente por admin
}

export async function crearExpedienteDesdeWizard({ wizardData, adminUserId }: CrearExpedienteInput) {
  const folio = await generarFolio()

  // 1. Buscar o crear cliente (por CURP o email)
  let cliente = null
  if (wizardData.curp) {
    cliente = await db.cliente.findUnique({ where: { curp: wizardData.curp } })
  }
  if (!cliente && wizardData.email) {
    cliente = await db.cliente.findFirst({ where: { email: wizardData.email } })
  }
  if (!cliente) {
    cliente = await db.cliente.create({
      data: {
        nombreCompleto: wizardData.nombreCompleto,
        curp: wizardData.curp || null,
        email: wizardData.email || null,
        telefono: wizardData.telefono || null,
        canalPreferido: wizardData.canalPreferido as any,
        canalLlegada: 'WEB',
      },
    })
  } else {
    // Actualizar datos de contacto si el cliente ya existe (puede haber cambiado email/teléfono)
    cliente = await db.cliente.update({
      where: { id: cliente.id },
      data: {
        nombreCompleto: wizardData.nombreCompleto || cliente.nombreCompleto,
        email: wizardData.email || cliente.email,
        telefono: wizardData.telefono || cliente.telefono,
        canalPreferido: (wizardData.canalPreferido as any) || cliente.canalPreferido,
      },
    })
  }

  // 2. Buscar el tipo de trámite (Visa por defecto) — debe estar activo
  const tramiteTipo = await db.tramiteTipo.findFirst({
    where: { codigo: wizardData.tramiteCodigo || 'VISA' },
  })
  if (!tramiteTipo) {
    throw new Error('Tipo de trámite no encontrado: ' + wizardData.tramiteCodigo)
  }
  if (!tramiteTipo.activo) {
    throw new Error('Este tipo de trámite no está disponible actualmente')
  }

  // 3. Crear expediente + acción + notificación en transacción
  const systemUser = adminUserId ? null : await getOrCreateSystemUser()

  const resultado = await db.$transaction(async (tx) => {
    const expediente = await tx.expediente.create({
      data: {
        folio,
        clienteId: cliente.id,
        tramiteTipoId: tramiteTipo.id,
        estado: 'NUEVO',
        ds160Data: JSON.stringify(wizardData),
        asignadoAId: adminUserId,
      },
    })

    // Crear acción de auditoría (SYSTEM-INIT)
    const accionInit = await tx.accion.create({
      data: {
        expedienteId: expediente.id,
        codigo: 'SYSTEM-INIT',
        descripcion: 'Expediente creado vía wizard',
        ejecutadoPorId: adminUserId || (systemUser?.id ?? ''),
        estadoPrevio: 'NUEVO',
        estadoNuevo: 'NUEVO',
        metadataJson: JSON.stringify({ origen: 'wizard', timestamp: new Date().toISOString() }),
      },
    })

    // Crear notificación SOLICITUD_RECIBIDA
    let notificacion = null
    if (cliente.email) {
      notificacion = await tx.notificacion.create({
        data: {
          expedienteId: expediente.id,
          tipo: 'SOLICITUD_RECIBIDA',
          emailDestino: cliente.email,
          asunto: getAsuntoNotificacion('SOLICITUD_RECIBIDA', folio),
        },
      })
    }

    return { expediente, accionInit, notificacion }
  })

  // 4. Enviar email de SOLICITUD_RECIBIDA (fuera de la transacción)
  if (resultado.notificacion && cliente.email) {
    try {
      const { enviarEmail } = await import('./email-service')
      const emailResult = await enviarEmail({
        to: cliente.email,
        tipo: 'SOLICITUD_RECIBIDA',
        folio,
        nombreCliente: cliente.nombreCompleto,
        tramiteNombre: tramiteTipo.nombre,
        precio: tramiteTipo.precio,
      })
      await db.notificacion.update({
        where: { id: resultado.notificacion.id },
        data: {
          enviado: emailResult.success,
          enviadoAt: emailResult.success ? new Date() : null,
          error: emailResult.error || null,
        },
      })
    } catch (emailError) {
      logger.error('Error enviando email de solicitud recibida', { error: emailError instanceof Error ? emailError.message : String(emailError) })
    }
  }

  return {
    expediente: resultado.expediente,
    cliente,
    tramiteTipo,
    accionInit: resultado.accionInit,
    notificacion: resultado.notificacion,
  }
}

// ============================================================================
// Ejecutar acción del Motor de Acciones (DEC-011)
// ============================================================================

export interface EjecutarAccionInput {
  folio: string
  codigoAccion: string
  ejecutadoPorId: string
  metadata?: Record<string, any>
}

export async function ejecutarAccion({ folio, codigoAccion, ejecutadoPorId, metadata }: EjecutarAccionInput) {
  // 1. Cargar expediente
  const expediente = await db.expediente.findUnique({
    where: { folio },
    include: { cliente: true, tramiteTipo: true },
  })
  if (!expediente) {
    throw new Error(`Expediente no encontrado: ${folio}`)
  }

  // 2. Validar que la acción existe en el catálogo
  const accionInfo = ACCIONES_CATALOGO[codigoAccion]
  if (!accionInfo) {
    throw new Error(`Acción no válida: ${codigoAccion}`)
  }

  // 3. Validar transición (DEC-012)
  const transicionesValidas = TRANSICIONES[expediente.estado] || []
  const transicion = transicionesValidas.find((t) => t.accion === codigoAccion)

  if (!transicion) {
    throw new Error(
      `Acción ${codigoAccion} no permitida en estado ${expediente.estado}. ` +
      `Acciones válidas: ${transicionesValidas.map((t) => t.accion).join(', ') || 'ninguna'}`
    )
  }

  // 4. Validar precondiciones específicas por acción
  await validarPrecondiciones(codigoAccion, expediente, metadata)

  // 5. Ejecutar en transacción: actualizar estado + crear acción + crear notificación
  const resultado = await db.$transaction(async (tx) => {
    // Si es ACC-005 manual, crear el registro de pago PAGADO
    let pagoCreado = null
    if (codigoAccion === 'ACC-005' && metadata?.manual) {
      pagoCreado = await tx.pago.create({
        data: {
          expedienteId: expediente.id,
          monto: expediente.tramiteTipo.precio,
          metodo: 'MERCADO_PAGO',
          estado: 'PAGADO',
          fechaConfirmacion: new Date(),
        },
      })
    }

    // Releer el estado actual dentro de la transacción (evita stale state)
    const expedienteActual = await tx.expediente.findUnique({
      where: { id: expediente.id },
      select: { estado: true },
    })
    if (!expedienteActual) {
      throw new Error('Expediente no encontrado durante la transacción')
    }

    // Verificar que el estado no cambió desde que lo cargamos
    if (expedienteActual.estado !== expediente.estado) {
      throw new Error(`El estado del expediente cambió durante la operación. Estado actual: ${expedienteActual.estado}`)
    }

    // Actualizar expediente
    const expedienteActualizado = await tx.expediente.update({
      where: { id: expediente.id },
      data: {
        estado: transicion.nuevoEstado,
        closedAt: ['FINALIZADO', 'CANCELADO', 'ARCHIVADO'].includes(transicion.nuevoEstado)
          ? new Date()
          : null,
        // Si es ACC-004 (cita generada), guardar datos de la cita
        ...(codigoAccion === 'ACC-004' && metadata?.cita
          ? {
              citaFecha: new Date(metadata.cita.fecha),
              citaLugar: metadata.cita.lugar,
              citaDireccion: metadata.cita.direccion,
              citaConfirmada: true,
            }
          : {}),
      },
    })

    // Crear acción de auditoría
    const accion = await tx.accion.create({
      data: {
        expedienteId: expediente.id,
        codigo: codigoAccion,
        descripcion: accionInfo.descripcion,
        ejecutadoPorId,
        estadoPrevio: expedienteActual.estado,
        estadoNuevo: transicion.nuevoEstado,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    })

    // Crear notificación si aplica
    let notificacion = null
    if (accionInfo.notificacion && expediente.cliente.email) {
      notificacion = await tx.notificacion.create({
        data: {
          expedienteId: expediente.id,
          tipo: accionInfo.notificacion as any,
          emailDestino: expediente.cliente.email,
          asunto: getAsuntoNotificacion(accionInfo.notificacion, expediente.folio),
        },
      })
    }

    return {
      expediente: expedienteActualizado,
      accion,
      notificacion,
      // Datos para envío de email fuera de la transacción
      _emailData: notificacion
        ? {
            tipo: notificacion.tipo,
            emailDestino: notificacion.emailDestino,
            folio: expediente.folio,
            nombreCliente: expediente.cliente.nombreCompleto,
            tramiteNombre: expediente.tramiteTipo.nombre,
            precio: expediente.tramiteTipo.precio,
            citaFecha: expedienteActualizado.citaFecha,
            citaLugar: expedienteActualizado.citaLugar,
            citaDireccion: expedienteActualizado.citaDireccion,
          }
        : null,
    }
  })

  // Enviar email fuera de la transacción (no debe bloquear la DB)
  if (resultado._emailData) {
    try {
      const { enviarEmail } = await import('./email-service')
      const emailResult = await enviarEmail({
        to: resultado._emailData.emailDestino,
        tipo: resultado._emailData.tipo,
        folio: resultado._emailData.folio,
        nombreCliente: resultado._emailData.nombreCliente,
        tramiteNombre: resultado._emailData.tramiteNombre,
        precio: resultado._emailData.precio,
        citaFecha: resultado._emailData.citaFecha,
        citaLugar: resultado._emailData.citaLugar,
        citaDireccion: resultado._emailData.citaDireccion,
      })
      // Actualizar notificación con resultado del envío
      if (resultado.notificacion) {
        await db.notificacion.update({
          where: { id: resultado.notificacion.id },
          data: {
            enviado: emailResult.success,
            enviadoAt: emailResult.success ? new Date() : null,
            error: emailResult.error || null,
          },
        })
      }
      if (!emailResult.success) {
        logger.warn('Email no enviado', { tipo: resultado._emailData.tipo, error: emailResult.error })
      }
    } catch (emailError) {
      logger.error('Error enviando email', { error: emailError instanceof Error ? emailError.message : String(emailError) })
    }
  }

  // Limpiar _emailData antes de retornar
  const { _emailData, ...resultadoLimpio } = resultado as any
  return resultadoLimpio
}

// ============================================================================
// Validaciones de precondiciones (DEC-012)
// ============================================================================

async function validarPrecondiciones(
  codigoAccion: string,
  expediente: any,
  metadata?: Record<string, any>
) {
  switch (codigoAccion) {
    case 'ACC-002': {
      // Documentos aprobados: requerir al menos los documentos obligatorios
      const docs = await db.documento.findMany({ where: { expedienteId: expediente.id } })
      const tiposDocs = docs.map((d) => d.tipo)
      const obligatorios = ['PASAPORTE', 'ACTA_NACIMIENTO', 'FOTO_PASAPORTE']
      const faltantes = obligatorios.filter((t) => !tiposDocs.includes(t as any))
      if (faltantes.length > 0) {
        throw new Error(`Faltan documentos obligatorios: ${faltantes.join(', ')}`)
      }
      break
    }
    case 'ACC-004': {
      // Cita generada: requerir datos de la cita
      if (!metadata?.cita?.fecha || !metadata?.cita?.lugar) {
        throw new Error('ACC-004 requiere metadata.cita con fecha y lugar')
      }
      const fechaCita = new Date(metadata.cita.fecha)
      if (fechaCita <= new Date()) {
        throw new Error('La fecha de la cita debe ser posterior a la fecha actual')
      }
      break
    }
    case 'ACC-005': {
      // Pago confirmado: requerir referencia de Mercado Pago
      if (!metadata?.mercadoPagoId && !metadata?.manual) {
        throw new Error('ACC-005 requiere metadata.mercadoPagoId o metadata.manual=true')
      }
      break
    }
    case 'ACC-006': {
      // Trámite finalizado: requerir que esté pagado
      const pagos = await db.pago.findMany({
        where: { expedienteId: expediente.id, estado: 'PAGADO' },
      })
      if (pagos.length === 0) {
        throw new Error('No se puede finalizar un trámite sin pago confirmado')
      }
      break
    }
  }
}

// ============================================================================
// Helpers
// ============================================================================

let systemUserIdCache: string | null = null

export async function getOrCreateSystemUser(): Promise<{ id: string }> {
  if (systemUserIdCache) return { id: systemUserIdCache }

  const systemUser = await db.usuario.upsert({
    where: { email: 'system@mrtramite.mx' },
    update: {},
    create: {
      email: 'system@mrtramite.mx',
      passwordHash: 'SYSTEM_NO_LOGIN',
      nombre: 'Sistema',
      rol: 'ADMIN',
    },
  })
  systemUserIdCache = systemUser.id
  return systemUser
}

function getAsuntoNotificacion(tipo: string, folio: string): string {
  const asuntos: Record<string, string> = {
    SOLICITUD_RECIBIDA: `Hemos recibido tu solicitud ✓ (Folio ${folio})`,
    CITA_CONFIRMADA: `Tu cita consular está lista — procede a pagar (Folio ${folio})`,
    PAGO_CONFIRMADO: `Pago confirmado ✓ (Folio ${folio})`,
    TRAMITE_FINALIZADO: `¡Tu trámite está listo! 🎉 (Folio ${folio})`,
    SOLICITUD_DOCS_ADICIONALES: `Necesitamos documentos adicionales (Folio ${folio})`,
    RECORDATORIO_PAGO: `Recordatorio: tu pago está pendiente (Folio ${folio})`,
  }
  return asuntos[tipo] || `Notificación - ${folio}`
}

// ============================================================================
// Listar expedientes (para admin)
// ============================================================================

export async function listarExpedientes(filtros?: {
  estado?: ExpedienteEstado
  limite?: number
  offset?: number
}) {
  const where: any = {}
  if (filtros?.estado) {
    where.estado = filtros.estado
  }

  const [expedientes, total] = await Promise.all([
    db.expediente.findMany({
      where,
      include: {
        cliente: true,
        tramiteTipo: true,
        asignadoA: { select: { id: true, nombre: true } },
        _count: {
          select: { documentos: true, pagos: true, acciones: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: filtros?.limite ?? 50,
      skip: filtros?.offset ?? 0,
    }),
    db.expediente.count({ where }),
  ])

  return { expedientes, total }
}

// ============================================================================
// Obtener expediente por folio (para portal cliente y admin)
// ============================================================================

export async function obtenerExpedientePorFolio(folio: string) {
  const expediente = await db.expediente.findUnique({
    where: { folio: folio.toUpperCase() },
    include: {
      cliente: true,
      tramiteTipo: true,
      documentos: true,
      pagos: true,
      acciones: {
        include: {
          ejecutadoPor: { select: { id: true, nombre: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      notificaciones: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  return expediente
}
