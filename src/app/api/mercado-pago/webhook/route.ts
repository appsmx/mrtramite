import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ejecutarAccion, getOrCreateSystemUser } from '@/lib/services/expediente-service'
import { verificarPago, validarFirmaWebhook, mapearEstadoPago } from '@/lib/services/mercado-pago-service'
import { logger } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'

// ============================================================================
// POST /api/mercado-pago/webhook
// ============================================================================
// Recibe notificaciones de Mercado Pago cuando un pago cambia de estado.
// Flujo:
//   1. Rate limit básico
//   2. Extraer data.id del payload
//   3. Validar firma x-signature (si hay secreto configurado)
//   4. Consultar la API de MP para verificar el pago (no confiar solo en el webhook)
//   5. Buscar el pago en nuestra DB por external_reference (pagoId)
//   6. Actualizar estado y disparar ACC-005 si fue aprobado
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResponse = applyRateLimit(request, 'WEBHOOK_MP')
    if (rateLimitResponse) return rateLimitResponse

    // 2. Leer headers y body
    const signature = request.headers.get('x-signature') || ''
    const requestId = request.headers.get('x-request-id') || ''
    const body = await request.json()

    logger.debug('Webhook MP recibido', { body, requestId })

    // MP envía: { type: "payment", data: { id: "123456789" } }
    // o en algunos casos: { id, topic, resource }
    const dataId =
      body?.data?.id ||
      body?.resource ||
      body?.id ||
      ''

    if (!dataId) {
      logger.warn('Webhook MP sin ID de pago', { body })
      return NextResponse.json({ error: 'Webhook sin ID de pago' }, { status: 400 })
    }

    // 3. Validar firma (si está configurado el secreto)
    const firmaCheck = validarFirmaWebhook({
      dataId: String(dataId),
      signatureHeader: signature,
    })
    if (!firmaCheck.valido) {
      logger.error('Webhook MP: firma inválida', {
        dataId,
        error: firmaCheck.error,
      })
      return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
    }
    if (firmaCheck.error) {
      // El secreto no estaba configurado — log de advertencia pero se permite
      logger.warn('Webhook MP: ' + firmaCheck.error)
    }

    // 4. Consultar la API de MP para verificar el pago
    const pagoMP = await verificarPago(dataId)
    if (!pagoMP) {
      logger.warn('Webhook MP: no se pudo verificar el pago con la API', { dataId })
      return NextResponse.json({ error: 'No se pudo verificar' }, { status: 502 })
    }

    logger.info('Pago verificado en MP', {
      dataId,
      status: pagoMP.status,
      monto: pagoMP.transactionAmount,
      externalRef: pagoMP.externalReference,
    })

    // 5. Buscar el pago en nuestra DB (usamos external_reference que es nuestro pagoId)
    let pago = null
    if (pagoMP.externalReference) {
      pago = await db.pago.findUnique({
        where: { id: pagoMP.externalReference },
        include: { expediente: true },
      })
    }

    // Fallback: buscar por mercadoPagoId (por si external_reference no llegó)
    if (!pago) {
      pago = await db.pago.findUnique({
        where: { mercadoPagoId: String(dataId) },
        include: { expediente: true },
      })
    }

    if (!pago) {
      logger.warn('Webhook MP: pago no encontrado en DB', {
        dataId,
        externalRef: pagoMP.externalReference,
      })
      // Responder 200 para que MP no reintente indefinidamente
      return NextResponse.json({ ok: true, message: 'Pago no encontrado, ignorado' })
    }

    // 6. Si ya está procesado, no hacer nada
    if (pago.estado === 'PAGADO' && pagoMP.status === 'approved') {
      logger.info('Webhook MP: pago ya procesado', { pagoId: pago.id })
      return NextResponse.json({ ok: true, message: 'Pago ya procesado' })
    }

    // 7. Mapear estado y actualizar DB
    const nuevoEstado = mapearEstadoPago(pagoMP.status)

    await db.pago.update({
      where: { id: pago.id },
      data: {
        estado: nuevoEstado,
        fechaConfirmacion: nuevoEstado === 'PAGADO' ? new Date() : null,
      },
    })

    // 8. Si fue aprobado, disparar ACC-005 (cambiar estado a PAGO_RECIBIDO)
    if (nuevoEstado === 'PAGADO') {
      const systemUser = await getOrCreateSystemUser()
      const resultado = await ejecutarAccion({
        folio: pago.expediente.folio,
        codigoAccion: 'ACC-005',
        ejecutadoPorId: systemUser.id,
        metadata: {
          mercadoPagoId: String(dataId),
          pagoId: pago.id,
          monto: pago.monto,
          paymentMethod: pagoMP.paymentMethod,
          statusDetail: pagoMP.statusDetail,
          origen: 'webhook_mp',
        },
      })

      logger.info('ACC-005 ejecutada vía webhook MP', {
        folio: pago.expediente.folio,
        accion: resultado.accion.descripcion,
        nuevoEstado: resultado.expediente.estado,
      })

      return NextResponse.json({
        ok: true,
        expediente: pago.expediente.folio,
        nuevoEstado: resultado.expediente.estado,
        pago: nuevoEstado,
      })
    }

    // 9. Otros estados (pending, rejected, etc.) — solo actualizamos el pago
    logger.info('Webhook MP: pago actualizado (no aprobado)', {
      pagoId: pago.id,
      estado: nuevoEstado,
      statusDetail: pagoMP.statusDetail,
    })

    return NextResponse.json({
      ok: true,
      pago: nuevoEstado,
      statusDetail: pagoMP.statusDetail,
    })
  } catch (error) {
    logger.error('Error en webhook Mercado Pago', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// MP también hace GET para verificar
export async function GET() {
  return NextResponse.json({ ok: true, service: 'mercado-pago-webhook' })
}
