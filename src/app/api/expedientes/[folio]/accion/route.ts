import { NextRequest, NextResponse } from 'next/server'
import { ejecutarAccion, getOrCreateSystemUser } from '@/lib/services/expediente-service'

// ============================================================================
// POST /api/expedientes/[folio]/accion
// Ejecuta una acción del Motor de Acciones (DEC-011)
// ============================================================================

interface AccionRequestBody {
  codigoAccion: string // ej: 'ACC-002'
  ejecutadoPorId?: string // opcional, si no se provee usa system user
  metadata?: Record<string, any>
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  try {
    const { folio } = await params
    const body: AccionRequestBody = await request.json()

    if (!body.codigoAccion) {
      return NextResponse.json(
        { error: 'codigoAccion es requerido' },
        { status: 400 }
      )
    }

    // En MVP sin auth, usamos system user si no se especifica
    let ejecutadoPorId = body.ejecutadoPorId
    if (!ejecutadoPorId) {
      const systemUser = await getOrCreateSystemUser()
      ejecutadoPorId = systemUser.id
    }

    const resultado = await ejecutarAccion({
      folio,
      codigoAccion: body.codigoAccion,
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
    console.error('Error ejecutando acción:', error)

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
