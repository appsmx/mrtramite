import { NextRequest, NextResponse } from 'next/server'
import { obtenerExpedientePorFolio, ejecutarAccion } from '@/lib/services/expediente-service'

// ============================================================================
// GET /api/expedientes/[folio]
// Obtiene un expediente por folio (para portal cliente y admin)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  try {
    const { folio } = await params
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
