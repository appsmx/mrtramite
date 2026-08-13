// ============================================================================
// Mr. Trámite — Servicio de Mercado Pago
// ============================================================================
// Integra la API de Mercado Pago para generar preferencias de pago y verificar
// pagos recibidos vía webhook.
//
// Variables de entorno requeridas:
//   MERCADO_PAGO_ACCESS_TOKEN — token de acceso (producción o sandbox)
//   MERCADO_PAGO_WEBHOOK_SECRET — (opcional) secreto compartido para validar firma
//   NEXTAUTH_URL — URL base del sitio (ej: https://mrtramite.vercel.app)
//
// Documentación:
//   https://www.mercadopago.com.mx/developers/es/docs/checkout-api/integration-configuration/integrate-with-pix
//   https://www.mercadopago.com.mx/developers/es/docs/checkout-api/webhooks
// ============================================================================

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

const MP_API_BASE = 'https://api.mercadopago.com'

function getAccessToken(): string {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN
  if (!token) {
    throw new Error('MERCADO_PAGO_ACCESS_TOKEN no configurado en variables de entorno')
  }
  return token
}

function getBaseUrl(): string {
  // NEXTAUTH_URL suele ser https://mrtramite.vercel.app en producción
  const url = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (!url) {
    throw new Error('NEXTAUTH_URL no configurado')
  }
  return url.replace(/\/$/, '')
}

// ---------------------------------------------------------------------------
// Crear preferencia de pago
// ---------------------------------------------------------------------------

export interface CrearPreferenciaInput {
  folio: string
  monto: number
  descripcion: string
  emailCliente?: string | null
  nombreCliente?: string | null
}

export interface CrearPreferenciaResult {
  preferenceId: string
  initPoint: string // URL de checkout (producción)
  sandboxInitPoint: string // URL de checkout (sandbox)
}

/**
 * Crea una preferencia de pago en Mercado Pago y la asocia al pago en nuestra DB.
 * El cliente será redirigido a `initPoint` para completar el pago.
 */
export async function crearPreferencia(
  input: CrearPreferenciaInput
): Promise<{ preference: CrearPreferenciaResult; pagoId: string }> {
  const accessToken = getAccessToken()
  const baseUrl = getBaseUrl()

  // 1. Buscar el expediente y validar que esté en estado LISTO_PARA_PAGO
  const expediente = await db.expediente.findUnique({
    where: { folio: input.folio },
    include: {
      cliente: true,
      tramiteTipo: true,
      pagos: {
        where: { estado: 'PENDIENTE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!expediente) {
    throw new Error(`Expediente no encontrado: ${input.folio}`)
  }

  if (expediente.estado !== 'LISTO_PARA_PAGO') {
    throw new Error(
      `El expediente ${input.folio} no está listo para pago (estado actual: ${expediente.estado})`
    )
  }

  // 2. Crear o reutilizar el registro de Pago en nuestra DB
  let pago = expediente.pagos[0]
  if (!pago) {
    pago = await db.pago.create({
      data: {
        expedienteId: expediente.id,
        monto: expediente.tramiteTipo.precio,
        metodo: 'MERCADO_PAGO',
        estado: 'PENDIENTE',
      },
    })
  }

  // Si ya tenemos un mercadoPagoId y link, validar si todavía es válido
  // (MP permite reutilizar la preferencia hasta 60 días)
  if (pago.mercadoPagoId && pago.linkPago) {
    try {
      const validacion = await consultarPreferencia(pago.mercadoPagoId)
      if (validacion && validacion.initPoint) {
        return {
          preference: {
            preferenceId: pago.mercadoPagoId,
            initPoint: validacion.initPoint,
            sandboxInitPoint: validacion.sandboxInitPoint || validacion.initPoint,
          },
          pagoId: pago.id,
        }
      }
    } catch (e) {
      // Si la preferencia anterior ya expiró o falló, creamos una nueva
      logger.warn('Preferencia anterior inválida, creando nueva', {
        folio: input.folio,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  // 3. Construir el body para crear la preferencia en MP
  const backUrls = {
    success: `${baseUrl}/?pago=success&folio=${input.folio}`,
    pending: `${baseUrl}/?pago=pending&folio=${input.folio}`,
    failure: `${baseUrl}/?pago=failure&folio=${input.folio}`,
  }

  const body = {
    items: [
      {
        id: input.folio,
        title: input.descripcion || `${expediente.tramiteTipo.nombre} — Folio ${input.folio}`,
        description: `Trámite ${expediente.tramiteTipo.nombre} para ${expediente.cliente.nombreCompleto}`,
        category_id: 'services',
        quantity: 1,
        currency_id: 'MXN',
        unit_price: Number(expediente.tramiteTipo.precio.toFixed(2)),
      },
    ],
    payer: input.emailCliente
      ? {
          name: input.nombreCliente?.split(' ')[0] || undefined,
          surname: input.nombreCliente?.split(' ').slice(1).join(' ') || undefined,
          email: input.emailCliente,
        }
      : undefined,
    external_reference: pago.id, // Para vincular el webhook con nuestro pago
    notification_url: `${baseUrl}/api/mercado-pago/webhook`,
    back_urls: backUrls,
    auto_return: 'approved',
    statement_descriptor: 'MR TRAMITE',
    metadata: {
      folio: input.folio,
      pagoId: pago.id,
      expedienteId: expediente.id,
      tramiteTipo: expediente.tramiteTipo.codigo,
    },
    payment_methods: {
      // Excluir pagos que no aplican (ej: transferencia bancaria si queremos forzar tarjeta)
      // Para MVP aceptamos todos los métodos disponibles
      installments: 12, // hasta 12 meses sin intereses si el método lo soporta
    },
  }

  // 4. Llamar a la API de Mercado Pago
  const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `mrt-${pago.id}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text()
    logger.error('Mercado Pago: error al crear preferencia', {
      status: res.status,
      error: errorText,
      folio: input.folio,
    })
    throw new Error(`Mercado Pago devolvió ${res.status}: ${errorText}`)
  }

  const data = await res.json()

  // 5. Guardar preferenceId y link en la DB
  await db.pago.update({
    where: { id: pago.id },
    data: {
      mercadoPagoId: data.id,
      linkPago: data.init_point,
    },
  })

  logger.info('Preferencia de MP creada', {
    folio: input.folio,
    preferenceId: data.id,
    monto: expediente.tramiteTipo.precio,
  })

  return {
    preference: {
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point || data.init_point,
    },
    pagoId: pago.id,
  }
}

// ---------------------------------------------------------------------------
// Consultar preferencia existente
// ---------------------------------------------------------------------------

export async function consultarPreferencia(
  preferenceId: string
): Promise<{ initPoint: string; sandboxInitPoint: string } | null> {
  const accessToken = getAccessToken()
  const res = await fetch(`${MP_API_BASE}/checkout/preferences/${preferenceId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  return {
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point || data.init_point,
  }
}

// ---------------------------------------------------------------------------
// Verificar pago por ID (consultando la API de MP)
// ---------------------------------------------------------------------------

export interface VerificarPagoResult {
  status: 'approved' | 'pending' | 'in_process' | 'rejected' | 'cancelled' | 'refunded'
  statusDetail: string
  transactionAmount: number
  paymentMethod: string
  externalReference: string | null
  dateApproved: string | null
}

export async function verificarPago(paymentId: string | number): Promise<VerificarPagoResult | null> {
  const accessToken = getAccessToken()
  const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    logger.error('Mercado Pago: error al verificar pago', {
      paymentId,
      status: res.status,
    })
    return null
  }
  const data = await res.json()
  return {
    status: data.status,
    statusDetail: data.status_detail,
    transactionAmount: data.transaction_amount,
    paymentMethod: data.payment_method_id,
    externalReference: data.external_reference,
    dateApproved: data.date_approved,
  }
}

// ---------------------------------------------------------------------------
// Validar firma del webhook (HMAC)
// ---------------------------------------------------------------------------

/**
 * Valida la firma `x-signature` del webhook de Mercado Pago.
 *
 * MP envía:
 *   x-signature: ts=...,v1=...
 *   x-request-id: <uuid>
 *
 * Firma esperada (HMAC-SHA256):
 *   HMAC(secret, "id:<data.id>;ts:<ts>")
 *
 * Documentación:
 *   https://www.mercadopago.com.mx/developers/es/docs/checkout-api/webhooks/security
 */
export function validarFirmaWebhook(opts: {
  dataId: string
  signatureHeader: string
  secret?: string
}): { valido: boolean; ts?: string; error?: string } {
  const secret = opts.secret || process.env.MERCADO_PAGO_WEBHOOK_SECRET
  if (!secret) {
    // Si no hay secreto configurado, no validamos (modo desarrollo)
    // En producción ESTO DEBE configurarse
    return { valido: true, error: 'MERCADO_PAGO_WEBHOOK_SECRET no configurado' }
  }

  // Parsear header: "ts=...,v1=..."
  const parts = opts.signatureHeader.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=')
    acc[key.trim()] = value.trim()
    return acc
  }, {} as Record<string, string>)

  const ts = parts.ts
  const v1 = parts.v1

  if (!ts || !v1) {
    return { valido: false, error: 'Header de firma malformado' }
  }

  // Construir manifest
  const manifest = `id:${opts.dataId};ts:${ts}`

  // HMAC-SHA256 con Web Crypto API (disponible en Node 18+ / Vercel serverless)
  // Nota: en el servidor usamos node:crypto
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(manifest)
    const calculated = hmac.digest('hex')

    if (calculated === v1) {
      return { valido: true, ts }
    }
    return { valido: false, error: 'Firma no coincide' }
  } catch (e) {
    return { valido: false, error: 'Error al calcular HMAC' }
  }
}

// ---------------------------------------------------------------------------
// Mapear estado de MP a estado interno
// ---------------------------------------------------------------------------

export function mapearEstadoPago(estadoMP: VerificarPagoResult['status']): 'PAGADO' | 'PENDIENTE' | 'CANCELADO' | 'REEMBOLSADO' {
  switch (estadoMP) {
    case 'approved':
      return 'PAGADO'
    case 'pending':
    case 'in_process':
      return 'PENDIENTE'
    case 'rejected':
    case 'cancelled':
      return 'CANCELADO'
    case 'refunded':
      return 'REEMBOLSADO'
    default:
      return 'PENDIENTE'
  }
}
