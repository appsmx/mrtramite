import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { v2 as cloudinary } from 'cloudinary'

// Configurar Cloudinary si hay credenciales
const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

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

    const documento = await db.documento.findUnique({ where: { id: documentoId } })
    if (!documento) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    if (!documento.filePath || documento.filePath === 'whatsapp' || !documento.filePath.startsWith('http')) {
      return NextResponse.json({ error: 'Este documento no tiene archivo digital' }, { status: 404 })
    }

    // Extraer publicId de la URL
    const url = documento.filePath
    const match = url.match(/\/(?:upload|authenticated)\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
    const publicId = match ? match[1] : ''
    const resourceType = url.includes('/image/') ? 'image' : url.includes('/raw/') ? 'raw' : 'image'

    if (!publicId) {
      return NextResponse.json({ error: 'No se pudo procesar la URL' }, { status: 500 })
    }

    if (!isConfigured) {
      return NextResponse.json({ url: documento.filePath })
    }

    // Intentar generar URL firmada como authenticated primero
    // Si falla (porque el recurso es public), intentar como public con sign_url
    let signedUrl = ''

    try {
      // Intentar como authenticated
      signedUrl = cloudinary.url(publicId, {
        type: 'authenticated',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        resource_type: resourceType,
      })
      // Verificar si realmente funciona haciendo una petición HEAD
      const checkResponse = await fetch(signedUrl, { method: 'HEAD', redirect: 'follow' })
      if (checkResponse.ok) {
        logger.info('URL firmada (authenticated) generada', { folio, documentoId })
        return NextResponse.json({ ok: true, url: signedUrl, expiresInSeconds: 3600 })
      }
    } catch {
      // Continuar al fallback
    }

    // Fallback: generar URL firmada como public (para documentos subidos antes de la migración)
    try {
      signedUrl = cloudinary.url(publicId, {
        type: 'public',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        resource_type: resourceType,
      })
      logger.info('URL firmada (public) generada', { folio, documentoId })
      return NextResponse.json({ ok: true, url: signedUrl, expiresInSeconds: 3600 })
    } catch (error) {
      logger.error('Error generando URL firmada', { publicId, error: error instanceof Error ? error.message : String(error) })
      return NextResponse.json({ error: 'Error generando URL firmada' }, { status: 500 })
    }
  } catch (error) {
    logger.error('Error en ver-url', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
