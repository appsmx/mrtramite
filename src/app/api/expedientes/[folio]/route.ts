import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { obtenerExpedientePorFolio, ejecutarAccion } from '@/lib/services/expediente-service'

// ============================================================================
// GET /api/expedientes/[folio]
// Obtiene un expediente por folio (para portal cliente y admin)
// - Admin: puede ver cualquier expediente
// - Cliente: solo puede ver el expediente de su folio
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  try {
    const { folio } = await params

    // Verificar sesión
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado — inicia sesión' },
        { status: 401 }
      )
    }

    const role = (session.user as any)?.role
    const userFolio = (session.user as any)?.folio

    // Cliente solo puede ver su propio expediente
    if (role === 'CLIENTE' && userFolio !== folio.toUpperCase()) {
      return NextResponse.json(
        { error: 'No autorizado — solo puedes ver tu propio expediente' },
        { status: 403 }
      )
    }

    // Solo ADMIN o CLIENTE pueden acceder
    if (role !== 'ADMIN' && role !== 'CLIENTE') {
      return NextResponse.json(
        { error: 'Rol no autorizado' },
        { status: 403 }
      )
    }

    const expediente = await obtenerExpedientePorFolio(folio)

    if (!expediente) {
      return NextResponse.json(
        { error: `Expediente no encontrado: ${folio}` },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      expediente: {
        id: expediente.id,
        folio: expediente.folio,
        estado: expediente.estado,
        createdAt: expediente.createdAt,
        updatedAt: expediente.updatedAt,
        closedAt: expediente.closedAt,
        citaFecha: expediente.citaFecha,
        citaLugar: expediente.citaLugar,
        citaDireccion: expediente.citaDireccion,
        citaConfirmada: expediente.citaConfirmada,
        ds160Data: expediente.ds160Data,
        datosPasaporte: expediente.datosPasaporte,
        cliente: expediente.cliente,
        tramiteTipo: {
          codigo: expediente.tramiteTipo.codigo,
          nombre: expediente.tramiteTipo.nombre,
          precio: expediente.tramiteTipo.precio,
        },
        documentos: expediente.documentos.map((d) => ({
          id: d.id,
          tipo: d.tipo,
          fileName: d.fileName,
          fileSize: d.fileSize,
          valido: d.valido,
          notaValidacion: d.notaValidacion,
          createdAt: d.createdAt,
        })),
        pagos: expediente.pagos,
        acciones: expediente.acciones.map((a) => ({
          id: a.id,
          codigo: a.codigo,
          descripcion: a.descripcion,
          estadoPrevio: a.estadoPrevio,
          estadoNuevo: a.estadoNuevo,
          ejecutadoPor: a.ejecutadoPor,
          createdAt: a.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Error obteniendo expediente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
