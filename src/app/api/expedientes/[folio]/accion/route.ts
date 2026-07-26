import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ejecutarAccion, getOrCreateSystemUser } from '@/lib/services/expediente-service'
import { logger } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'

// ============================================================================
// POST /api/expedientes/[folio]/accion
// Ejecuta una acción del Motor de Acciones (DEC-011)
// Solo ADMIN puede ejecutar acciones (excepto webhook MP que usa system user)
// ============================================================================

interface AccionRequestBody {
  codigoAccion: string // ej: 'ACC-002'
  ejecutadoPorId?: string // opcional, si no se provee usa system user
  metadata?: Record<string, any>
  // Flag interno para webhook de MP (no requiere sesión admin)
  _internal?: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  let folio = ''
  let codigoAccion = ''
  try {
    // Rate limiting: 30 acciones por minuto por IP
    const rateLimitResponse = applyRateLimit(request, 'EJECUTAR_ACCION')
    if (rateLimitResponse) return rateLimitResponse

    const paramsResolved = await params
    folio = paramsResolved.folio
    const body: AccionRequestBody = await request.json()
    codigoAccion = body.codigoAccion

    if (!codigoAccion) {
      return NextResponse.json(
        { error: 'codigoAccion es requerido' },
        { status: 400 }
      )
    }

    // Verificar sesión de admin (excepto para llamadas internas del webhook MP)
    let ejecutadoPorId = body.ejecutadoPorId
    if (!body._internal) {
      const session = await getServerSession(authOptions)
      if (!session || (session.user as any)?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado — se requiere sesión de administrador' },
          { status: 401 }
        )
      }
      // Usar el ID del usuario autenticado si no se especifica
      if (!ejecutadoPorId) {
        ejecutadoPorId = (session.user as any).id
      }
    }

    // Si sigue sin ejecutadoPorId, usar system user
    if (!ejecutadoPorId) {
      const systemUser = await getOrCreateSystemUser()
      ejecutadoPorId = systemUser.id
    }

    const resultado = await ejecutarAccion({
      folio,
      codigoAccion,
      ejecutadoPorId,
      metadata: body.metadata,
    })

    return NextResponse.json({
      ok: true,
      expediente: {
        id: resultado.expediente.id,
        folio: resultado.expediente.folio,
        estado: resultado.expediente.estado,
      },
      accion: {
        id: resultado.accion.id,
        codigo: resultado.accion.codigo,
        descripcion: resultado.accion.descripcion,
        estadoPrevio: resultado.accion.estadoPrevio,
        estadoNuevo: resultado.accion.estadoNuevo,
      },
      notificacion: resultado.notificacion
        ? {
            id: resultado.notificacion.id,
            tipo: resultado.notificacion.tipo,
            asunto: resultado.notificacion.asunto,
            enviado: resultado.notificacion.enviado,
          }
        : null,
    })
  } catch (error) {
    logger.error('Error ejecutando acción', { folio, codigoAccion, error: error instanceof Error ? error.message : String(error) })

    // Errores de validación (precondiciones, transiciones inválidas)
    if (error instanceof Error) {
      if (error.message.includes('no permitida') || error.message.includes('Faltan') || error.message.includes('requiere')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message.includes('no encontrado')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
