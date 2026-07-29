import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'

// ============================================================================
// POST /api/expedientes/[folio]/documentos
// Marca un documento como recibido (admin lo recibió por WhatsApp)
// ============================================================================

interface MarcarDocumentoBody {
  tipo: string
  recibido: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  let folio = ''
  try {
    const rateLimitResponse = applyRateLimit(request, 'EJECUTAR_ACCION')
    if (rateLimitResponse) return rateLimitResponse

    const { folio: folioParam } = await params
    folio = folioParam.toUpperCase()

    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body: MarcarDocumentoBody = await request.json()
    const { tipo, recibido } = body

    if (!tipo) {
      return NextResponse.json(
        { error: 'tipo es requerido' },
        { status: 400 }
      )
    }

    const expediente = await db.expediente.findUnique({ where: { folio } })
    if (!expediente) {
      return NextResponse.json(
        { error: `Expediente no encontrado: ${folio}` },
        { status: 404 }
      )
    }

    if (recibido) {
      const existing = await db.documento.findFirst({
        where: { expedienteId: expediente.id, tipo: tipo as any },
      })

      if (existing) {
        await db.documento.update({
          where: { id: existing.id },
          data: { valido: true, fileName: 'Recibido por WhatsApp', filePath: 'whatsapp' },
        })
      } else {
        await db.documento.create({
          data: {
            expedienteId: expediente.id,
            tipo: tipo as any,
            fileName: 'Recibido por WhatsApp',
            filePath: 'whatsapp',
            fileSize: 0,
            mimeType: 'application/octet-stream',
            subidoPorCliente: false,
            valido: true,
          },
        })
      }

      logger.info('Documento marcado como recibido', { folio, tipo })
    } else {
      await db.documento.deleteMany({
        where: { expedienteId: expediente.id, tipo: tipo as any },
      })
      logger.info('Documento desmarcado', { folio, tipo })
    }

    return NextResponse.json({ ok: true, folio, tipo, recibido })
  } catch (error) {
    logger.error('Error marcando documento', { folio, error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
