import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { generarUrlFirmada, extraerPublicIdDeUrl, extraerResourceTypeDeUrl } from '@/lib/services/cloudinary-service'

// ============================================================================
// POST /api/expedientes/[folio]/documentos/ver-url
// Genera una URL firmada (válida 1 hora) para ver un documento
// Requiere sesión de admin o cliente dueño del expediente
// ============================================================================

interface VerUrlBody {
  documentoId: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  try {
    const { folio: folioParam } = await params
    const folio = folioParam.toUpperCase()

    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const role = (session.user as any)?.role
    const userFolio = (session.user as any)?.folio

    if (role === 'CLIENTE' && userFolio !== folio) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    if (role !== 'ADMIN' && role !== 'CLIENTE') {
      return NextResponse.json({ error: 'Rol no autorizado' }, { status: 403 })
    }

    const body: VerUrlBody = await request.json()
    const { documentoId } = body

    if (!documentoId) {
      return NextResponse.json({ error: 'documentoId es requerido' }, { status: 400 })
    }

    const documento = await db.documento.findUnique({
      where: { id: documentoId },
    })

    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    // Si el filePath es 'whatsapp' o no es una URL, no hay archivo que ver
    if (!documento.filePath || documento.filePath === 'whatsapp' || !documento.filePath.startsWith('http')) {
      return NextResponse.json({ error: 'Este documento no tiene archivo digital' }, { status: 404 })
    }

    // Extraer publicId y resourceType de la URL almacenada
    const publicId = extraerPublicIdDeUrl(documento.filePath)
    const resourceType = extraerResourceTypeDeUrl(documento.filePath)

    if (!publicId) {
      return NextResponse.json({ error: 'No se pudo procesar la URL del documento' }, { status: 500 })
    }

    // Generar URL firmada válida por 1 hora
    const signedUrl = generarUrlFirmada(publicId, resourceType, 3600)

    if (!signedUrl) {
      return NextResponse.json({ error: 'Error generando URL firmada' }, { status: 500 })
    }

    logger.info('URL firmada generada', { folio, documentoId, publicId })

    return NextResponse.json({
      ok: true,
      url: signedUrl,
      expiresInSeconds: 3600,
    })
  } catch (error) {
    logger.error('Error generando URL firmada', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
