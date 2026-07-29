import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ejecutarAccion } from '@/lib/services/expediente-service'
import { logger } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'

// ============================================================================
// POST /api/mercado-pago/webhook
// Webhook de Mercado Pago — dispara ACC-005 automáticamente (DEC-011)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 60 webhooks por minuto
    const rateLimitResponse = applyRateLimit(request, 'WEBHOOK_MP')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    logger.debug('Webhook Mercado Pago recibido', { body })

    // Mercado Pago envía notificaciones con type=data.id y data.id=ID del pago
    // En producción, aquí se consultaría la API de MP para verificar el pago.
    // Para MVP, aceptamos el webhook y buscamos el pago por mercadoPagoId.

    const mercadoPagoId =
      body?.data?.id ||
      body?.resource ||
      body?.id

    if (!mercadoPagoId) {
      logger.warn('Webhook MP sin ID de pago')
      return NextResponse.json(
        { error: 'Webhook sin ID de pago' },
        { status: 400 }
      )
    }

    // Buscar el pago en nuestra DB
    const pago = await db.pago.findUnique({
      where: { mercadoPagoId: String(mercadoPagoId) },
      include: { expediente: true },
    })

    if (!pago) {
      logger.warn('Pago no encontrado para mercadoPagoId', { mercadoPagoId })
      // Responder 200 para que MP no reintente indefinidamente
      return NextResponse.json({ ok: true, message: 'Pago no encontrado, ignorado' })
    }

    if (pago.estado === 'PAGADO') {
      logger.info('Webhook MP: pago ya procesado', { pagoId: pago.id })
      return NextResponse.json({ ok: true, message: 'Pago ya procesado' })
    }

    // En producción: verificar el pago con la API de MP antes de confirmar
    // Para MVP: asumimos que si MP nos notifica, el pago fue confirmado

    // Actualizar el pago en nuestra DB
    await db.pago.update({
      where: { id: pago.id },
      data: {
        estado: 'PAGADO',
        fechaConfirmacion: new Date(),
      },
    })

    // Ejecutar ACC-005 (Pago confirmado) que cambia estado a PAGO_RECIBIDO
    const { getOrCreateSystemUser } = await import('@/lib/services/expediente-service')
    const systemUser = await getOrCreateSystemUser()
    const resultado = await ejecutarAccion({
      folio: pago.expediente.folio,
      codigoAccion: 'ACC-005',
      ejecutadoPorId: systemUser.id,
      metadata: {
        mercadoPagoId: String(mercadoPagoId),
        pagoId: pago.id,
        monto: pago.monto,
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
    })
  } catch (error) {
    logger.error('Error en webhook Mercado Pago', { error: error instanceof Error ? error.message : String(error) })
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
