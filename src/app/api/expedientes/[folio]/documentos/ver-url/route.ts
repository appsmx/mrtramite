import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

// ============================================================================
// POST /api/expedientes/[folio]/documentos/ver-url
// Retorna el documento como proxy (la URL de Cloudinary nunca se expone)
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

    const documento = await db.documento.findUnique({ where: { id: documentoId } })
    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    if (!documento.filePath || documento.filePath === 'whatsapp' || !documento.filePath.startsWith('http')) {
      return NextResponse.json({ error: 'Este documento no tiene archivo digital' }, { status: 404 })
    }

    // Descargar el archivo de Cloudinary y servirlo como proxy
    const fileResponse = await fetch(documento.filePath)
    if (!fileResponse.ok) {
      logger.error('Error descargando documento de Cloudinary', { status: fileResponse.status, url: documento.filePath })
      return NextResponse.json({ error: 'No se pudo cargar el documento' }, { status: 500 })
    }

    const contentType = documento.mimeType || fileResponse.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await fileResponse.arrayBuffer()

    logger.info('Documento servido via proxy', { folio, documentoId, contentType })

    // Retornar el archivo directamente
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${documento.fileName}"`,
        'Cache-Control': 'private, no-store, max-age=0',
      },
    })
  } catch (error) {
    logger.error('Error en ver-url', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
