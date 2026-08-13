import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generarFolio } from '@/lib/services/folio'
import { getOrCreateSystemUser } from '@/lib/services/expediente-service'
import { subirArchivoDesdeUrl } from '@/lib/services/cloudinary-service'
import { alertarNuevoExpediente } from '@/lib/services/telegram-service'
import { logger } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'

// ============================================================================
// POST /api/webhook-botpress
// Recibe datos del chatbot de WhatsApp (Botpress) y crea un expediente.
// ============================================================================
//
// Botpress envía un JSON con las variables capturadas en el flujo del chat:
//   {
//     "nombre": "Juan Pérez",
//     "telefono": "5512345678",
//     "correo": "juan@email.com",
//     "curp": "PEJJ900101HDFXXX01",
//     "archivo_url": "https://tmp.botpress.com/...",  // URL temporal del archivo
//     "tipo_archivo": "pasaporte"  // pasaporte, acta, foto
//   }
//
// El endpoint:
//   1. Crea o busca cliente por teléfono/email
//   2. Si hay archivo_url, lo sube a Cloudinary
//   3. Crea el expediente
//   4. Crea el documento asociado
//   5. Envía alerta por Telegram
//   6. Retorna el folio

interface BotpressWebhookBody {
  nombre?: string
  telefono?: string
  correo?: string
  email?: string
  curp?: string
  // Archivos (puede ser uno o varios)
  archivo_url?: string
  archivo_nombre?: string
  tipo_archivo?: string
  archivos?: Array<{
    url: string
    nombre: string
    tipo: string // pasaporte, acta_nacimiento, foto_pasaporte
  }>
}

export async function POST(request: NextRequest) {
  try {
    // Validar API key compartida con Botpress
    const botpressKey = request.headers.get('x-botpress-key')
    const expectedKey = process.env.BOTPRESS_WEBHOOK_KEY
    if (!expectedKey || botpressKey !== expectedKey) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Rate limiting
    const rateLimitResponse = applyRateLimit(request, 'WEBHOOK_MP')
    if (rateLimitResponse) return rateLimitResponse

    const body: BotpressWebhookBody = await request.json()
    logger.info('Webhook Botpress recibido', { telefono: body.telefono })

    // Validar campos mínimos
    if (!body.nombre || !body.telefono) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, telefono' },
        { status: 400 }
      )
    }

    // Validar formato de email si se proporciona
    const email = body.correo || body.email || null
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'El formato del email no es válido' },
          { status: 400 }
        )
      }
    }

    // Validar formato de CURP si se proporciona
    if (body.curp && !/^[A-Z0-9]{18}$/i.test(body.curp)) {
      return NextResponse.json(
        { error: 'El CURP debe tener exactamente 18 caracteres alfanuméricos' },
        { status: 400 }
      )
    }

    // 1. Buscar o crear cliente
    let cliente: Awaited<ReturnType<typeof db.cliente.findFirst>> = null
    if (email) {
      cliente = await db.cliente.findFirst({ where: { email } })
    }
    if (!cliente && body.telefono) {
      cliente = await db.cliente.findFirst({ where: { telefono: body.telefono } })
    }
    if (!cliente) {
      cliente = await db.cliente.create({
        data: {
          nombreCompleto: body.nombre,
          curp: body.curp || null,
          email: email,
          telefono: body.telefono,
          canalPreferido: 'WHATSAPP',
          canalLlegada: 'WHATSAPP',
        },
      })
    } else {
      // Actualizar datos si el cliente ya existe
      cliente = await db.cliente.update({
        where: { id: cliente.id },
        data: {
          nombreCompleto: body.nombre || cliente.nombreCompleto,
          email: email || cliente.email,
          telefono: body.telefono || cliente.telefono,
        },
      })
    }

    // TypeScript no hace narrowing automático al reasignar — afirmamos que no es null
    if (!cliente) {
      throw new Error('No se pudo crear ni actualizar el cliente')
    }

    // 2. Buscar tipo de trámite (Visa por defecto)
    const tramiteTipo = await db.tramiteTipo.findFirst({
      where: { codigo: 'VISA' },
    })
    if (!tramiteTipo) {
      throw new Error('Tipo de trámite VISA no encontrado')
    }

    // 3. Generar folio
    const folio = await generarFolio()

    // 4. Crear expediente
    const systemUser = await getOrCreateSystemUser()
    const expediente = await db.expediente.create({
      data: {
        folio,
        clienteId: cliente.id,
        tramiteTipoId: tramiteTipo.id,
        estado: 'NUEVO',
        ds160Data: JSON.stringify({
          origen: 'botpress',
          nombreCompleto: body.nombre,
          telefono: body.telefono,
          email: email,
          curp: body.curp || null,
          capturadoPor: 'Botpress WhatsApp',
        }),
        asignadoAId: systemUser.id,
      },
    })

    // 5. Crear acción de auditoría
    await db.accion.create({
      data: {
        expedienteId: expediente.id,
        codigo: 'SYSTEM-INIT',
        descripcion: 'Expediente creado vía Botpress (WhatsApp)',
        ejecutadoPorId: systemUser.id,
        estadoPrevio: 'NUEVO',
        estadoNuevo: 'NUEVO',
        metadataJson: JSON.stringify({ origen: 'botpress', timestamp: new Date().toISOString() }),
      },
    })

    // 6. Si hay archivos, subirlos a Cloudinary y crear registros de documentos
    const archivosAProcesar: Array<{ url: string; nombre: string; tipo: string }> = []

    if (body.archivos && Array.isArray(body.archivos)) {
      archivosAProcesar.push(...body.archivos)
    } else if (body.archivo_url) {
      archivosAProcesar.push({
        url: body.archivo_url,
        nombre: body.archivo_nombre || 'archivo',
        tipo: body.tipo_archivo || 'OTRO',
      })
    }

    // Mapear tipos de Botpress a nuestros tipos de documento
    const mapeoTipos: Record<string, string> = {
      'pasaporte': 'PASAPORTE',
      'acta': 'ACTA_NACIMIENTO',
      'acta_nacimiento': 'ACTA_NACIMIENTO',
      'foto': 'FOTO_PASAPORTE',
      'foto_pasaporte': 'FOTO_PASAPORTE',
      'comprobante': 'COMPROBANTE_DOMICILIO',
      'comprobante_domicilio': 'COMPROBANTE_DOMICILIO',
      'matrimonio': 'ACTA_MATRIMONIO',
      'acta_matrimonio': 'ACTA_MATRIMONIO',
      'ingresos': 'RECIBOS_INGRESOS',
      'recibos_ingresos': 'RECIBOS_INGRESOS',
    }

    for (const archivo of archivosAProcesar) {
      try {
        const tipoDocumento = mapeoTipos[archivo.tipo.toLowerCase()] || 'OTRO'
        const folderCloudinary = `mrtramite/${folio}`
        const fileName = `${archivo.tipo}_${Date.now()}`

        // Subir a Cloudinary
        const result = await subirArchivoDesdeUrl(archivo.url, folderCloudinary, fileName)

        // Crear registro en DB
        await db.documento.create({
          data: {
            expedienteId: expediente.id,
            tipo: tipoDocumento as any,
            fileName: archivo.nombre || fileName,
            filePath: result.url, // URL permanente de Cloudinary
            fileSize: result.bytes,
            mimeType: 'application/octet-stream',
            subidoPorCliente: true,
            valido: null, // Pendiente de revisión por el admin
          },
        })

        logger.info('Documento subido vía Botpress', { folio, tipo: tipoDocumento, url: result.url })
      } catch (uploadError) {
        logger.error('Error subiendo archivo de Botpress', { folio, url: archivo.url, error: uploadError instanceof Error ? uploadError.message : String(uploadError) })
        // Continuar con el siguiente archivo
      }
    }

    // 7. Enviar alerta por Telegram
    try {
      await alertarNuevoExpediente({
        folio,
        nombre: cliente.nombreCompleto,
        telefono: cliente.telefono || 'No proporcionado',
        email: cliente.email || 'No proporcionado',
        origen: 'BOTPRESS',
      })
    } catch (telegramError) {
      logger.error('Error enviando alerta Telegram', { error: telegramError instanceof Error ? telegramError.message : String(telegramError) })
    }

    logger.info('Expediente creado vía Botpress', { folio, cliente: cliente.nombreCompleto })

    return NextResponse.json({
      ok: true,
      folio,
      expedienteId: expediente.id,
      clienteId: cliente.id,
      estado: 'NUEVO',
      mensaje: `Expediente creado exitosamente. Folio: ${folio}`,
    }, { status: 201 })
  } catch (error) {
    logger.error('Error en webhook Botpress', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET para verificar que el endpoint está activo
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'webhook-botpress',
    description: 'Endpoint para recibir datos del chatbot de WhatsApp (Botpress)',
  })
}
