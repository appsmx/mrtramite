import { logger } from '@/lib/logger'

// ============================================================================
// Servicio de alertas Telegram — notificaciones en tiempo real (gratis)
// ============================================================================
// Envía mensajes al teléfono del admin cuando ocurren eventos importantes:
// - Nuevo expediente creado (web o WhatsApp)
// - Pago confirmado
// - Trámite finalizado
//
// Configuración:
// 1. Crear bot en Telegram via @BotFather → obtener TELEGRAM_BOT_TOKEN
// 2. Enviar mensaje al bot desde tu Telegram → obtener TELEGRAM_CHAT_ID
//    (o visitar https://api.telegram.org/bot<TOKEN>/getUpdates)
// 3. Agregar ambas variables al .env

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function enviarAlertaTelegram(mensaje: string): Promise<boolean> {
  if (!BOT_TOKEN || !CHAT_ID) {
    logger.debug('Telegram no configurado — alerta simulada', { mensaje: mensaje.substring(0, 80) })
    return false
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: mensaje,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      logger.error('Error enviando alerta Telegram', { error })
      return false
    }

    logger.info('Alerta Telegram enviada', { mensaje: mensaje.substring(0, 60) })
    return true
  } catch (error) {
    logger.error('Error enviando alerta Telegram', { error: error instanceof Error ? error.message : String(error) })
    return false
  }
}

/**
 * Alerta: Nuevo expediente creado
 */
export async function alertarNuevoExpediente(datos: {
  folio: string
  nombre: string
  telefono: string
  email: string
  origen: 'WEB' | 'WHATSAPP' | 'BOTPRESS'
}): Promise<void> {
  const emoji = datos.origen === 'WEB' ? '🌐' : datos.origen === 'WHATSAPP' ? '💬' : '🤖'
  const mensaje = `${emoji} <b>¡Nuevo cliente registrado en Mr. Trámite!</b>\n\n` +
    `👤 <b>Nombre:</b> ${datos.nombre}\n` +
    `📱 <b>Teléfono:</b> ${datos.telefono}\n` +
    `📧 <b>Email:</b> ${datos.email}\n` +
    `📋 <b>Folio:</b> ${datos.folio}\n` +
    `📍 <b>Origen:</b> ${datos.origen}\n\n` +
    `Revisa el panel admin para gestionar este expediente.`

  await enviarAlertaTelegram(mensaje)
}

/**
 * Alerta: Pago confirmado
 */
export async function alertarPagoConfirmado(datos: {
  folio: string
  nombre: string
  monto: number
}): Promise<void> {
  const mensaje = `💰 <b>¡Pago confirmado!</b>\n\n` +
    `👤 <b>Cliente:</b> ${datos.nombre}\n` +
    `📋 <b>Folio:</b> ${datos.folio}\n` +
    `💵 <b>Monto:</b> $${datos.monto} MXN\n\n` +
    `Procede a finalizar el trámite (ACC-006).`

  await enviarAlertaTelegram(mensaje)
}

/**
 * Alerta: Trámite finalizado
 */
export async function alertarTramiteFinalizado(datos: {
  folio: string
  nombre: string
}): Promise<void> {
  const mensaje = `✅ <b>Trámite finalizado</b>\n\n` +
    `👤 <b>Cliente:</b> ${datos.nombre}\n` +
    `📋 <b>Folio:</b> ${datos.folio}\n\n` +
    `El expediente está completo. Cliente notificado por email.`

  await enviarAlertaTelegram(mensaje)
}
