import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'
import { subirArchivo } from '@/lib/services/cloudinary-service'

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

// ============================================================================
// PUT /api/expedientes/[folio]/documentos
// Cliente sube un documento directamente (se sube a Cloudinary)
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ folio: string }> }
) {
  let folio = ''
  try {
    const { folio: folioParam } = await params
    folio = folioParam.toUpperCase()

    // Verificar sesión (admin o cliente)
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const tipo = formData.get('tipo') as string
    const folioForm = formData.get('folio') as string

    if (!file || !tipo) {
      return NextResponse.json(
        { error: 'Faltan campos: file, tipo' },
        { status: 400 }
      )
    }

    // Validar tamaño (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Archivo demasiado grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    // Validar tipo
    const extPermitidas = ['.pdf', '.jpg', '.jpeg', '.png']
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!extPermitidas.includes(ext)) {
      return NextResponse.json(
        { error: 'Tipo no permitido. Solo PDF, JPG, PNG.' },
        { status: 400 }
      )
    }

    const expediente = await db.expediente.findUnique({ where: { folio } })
    if (!expediente) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 })
    }

    // Leer archivo
    const buffer = Buffer.from(await file.arrayBuffer())
    const mimeType = file.type || 'application/octet-stream'
    const folder = `mrtramite/${folio}`
    const fileName = `${tipo}_${Date.now()}`

    // Subir a Cloudinary
    const cloudinaryResult = await subirArchivo(buffer, folder, fileName, mimeType)

    // Crear o actualizar documento en DB
    const existing = await db.documento.findFirst({
      where: { expedienteId: expediente.id, tipo: tipo as any },
    })

    if (existing) {
      await db.documento.update({
        where: { id: existing.id },
        data: {
          fileName: file.name,
          filePath: cloudinaryResult.url,
          fileSize: file.size,
          mimeType,
          subidoPorCliente: true,
          valido: null, // Pendiente de revisión
        },
      })
    } else {
      await db.documento.create({
        data: {
          expedienteId: expediente.id,
          tipo: tipo as any,
          fileName: file.name,
          filePath: cloudinaryResult.url,
          fileSize: file.size,
          mimeType,
          subidoPorCliente: true,
          valido: null,
        },
      })
    }

    logger.info('Documento subido por cliente', { folio, tipo, url: cloudinaryResult.url })

    return NextResponse.json({
      ok: true,
      folio,
      tipo,
      fileName: file.name,
      url: cloudinaryResult.url,
    })
  } catch (error) {
    logger.error('Error subiendo documento', { folio, error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Error al subir documento' },
      { status: 500 }
    )
  }
}
