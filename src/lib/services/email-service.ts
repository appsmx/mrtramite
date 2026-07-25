import { Resend } from 'resend'
import type { NotificacionTipo } from '@prisma/client'

// ============================================================================
// Servicio de emails con Resend
// ============================================================================
// 4 plantillas del Motor de Acciones (DEC-011):
//   - SOLICITUD_RECIBIDA (disparada por ACC-001 o creación de expediente)
//   - CITA_CONFIRMADA (disparada por ACC-004)
//   - PAGO_CONFIRMADO (disparada por ACC-005)
//   - TRAMITE_FINALIZADO (disparada por ACC-006)

const resend = process.env.RESEND_API_KEY
  ? new Resend.Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const FROM_NAME = 'Mr. Trámite'

export interface EmailData {
  to: string
  tipo: NotificacionTipo
  folio: string
  nombreCliente: string
  tramiteNombre: string
  precio: number
  citaFecha?: string | null
  citaLugar?: string | null
  citaDireccion?: string | null
}

// ============================================================================
// Enviar email
// ============================================================================

export async function enviarEmail(data: EmailData): Promise<{ success: boolean; id?: string; error?: string }> {
  // Si no hay API key (desarrollo), simular envío
  if (!resend) {
    console.log(`📧 [EMAIL SIMULADO] ${data.tipo} → ${data.to}`)
    console.log(`   Asunto: ${getAsunto(data.tipo, data.folio)}`)
    return { success: true, id: 'simulated-' + Date.now() }
  }

  try {
    const html = renderEmailHtml(data)
    const asunto = getAsunto(data.tipo, data.folio)

    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: data.to,
      subject: asunto,
      html,
    })

    if (result.error) {
      console.error('Error Resend:', result.error)
      return { success: false, error: result.error.message }
    }

    return { success: true, id: result.data?.id }
  } catch (error) {
    console.error('Error enviando email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  }
}

// ============================================================================
// Asuntos por tipo
// ============================================================================

function getAsunto(tipo: NotificacionTipo, folio: string): string {
  const asuntos: Record<NotificacionTipo, string> = {
    SOLICITUD_RECIBIDA: `Hemos recibido tu solicitud ✓ (Folio ${folio})`,
    CITA_CONFIRMADA: `Tu cita consular está lista — procede a pagar (Folio ${folio})`,
    PAGO_CONFIRMADO: `Pago confirmado ✓ (Folio ${folio})`,
    TRAMITE_FINALIZADO: `¡Tu trámite está listo! 🎉 (Folio ${folio})`,
    SOLICITUD_DOCS_ADICIONALES: `Necesitamos documentos adicionales (Folio ${folio})`,
    RECORDATORIO_PAGO: `Recordatorio: tu pago está pendiente (Folio ${folio})`,
  }
  return asuntos[tipo] || `Notificación Mr. Trámite (${folio})`
}

// ============================================================================
// Renderizado de plantillas HTML
// ============================================================================

function renderEmailHtml(data: EmailData): string {
  const base = getBaseTemplate(data)

  switch (data.tipo) {
    case 'SOLICITUD_RECIBIDA':
      return renderSolicitudRecibida(data, base)
    case 'CITA_CONFIRMADA':
      return renderCitaConfirmada(data, base)
    case 'PAGO_CONFIRMADO':
      return renderPagoConfirmado(data, base)
    case 'TRAMITE_FINALIZADO':
      return renderTramiteFinalizado(data, base)
    case 'SOLICITUD_DOCS_ADICIONALES':
      return renderSolicitudDocsAdicionales(data, base)
    case 'RECORDATORIO_PAGO':
      return renderRecordatorioPago(data, base)
    default:
      return base.replace('{{CONTENT}}', '<p>Notificación de Mr. Trámite.</p>')
  }
}

// ============================================================================
// Base template
// ============================================================================

function getBaseTemplate(data: EmailData): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mr. Trámite</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1B4F72;padding:20px 28px;text-align:center;">
              <div style="color:#ffffff;font-size:18px;font-weight:bold;">Mr. Trámite</div>
              <div style="color:rgba(255,255,255,0.7);font-size:11px;margin-top:2px;">Gestoría profesional</div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:28px;">
              {{CONTENT}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 28px;background:#f9fafb;border-top:1px solid #e4e4e7;">
              <p style="margin:0 0 8px;font-size:11px;color:#71717a;line-height:1.5;">
                Mr. Trámite · Gestoría profesional de trámites<br>
                WhatsApp · Messenger · Instagram · contacto@mrtramite.mx
              </p>
              <p style="margin:0;font-size:10px;color:#a1a1aa;">
                © 2026 Mr. Trámite. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ============================================================================
// Plantillas individuales
// ============================================================================

function renderSolicitudRecibida(data: EmailData, base: string): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">Hemos recibido tu solicitud ✓</h1>
    <p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Hola <strong>${data.nombreCliente}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Hemos recibido tu solicitud de <strong>${data.tramiteNombre}</strong>. Mr. Trámite revisará tus documentos y la información en las próximas 24-48 horas.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:6px;padding:14px;margin:16px 0;">
      <tr><td style="font-size:12px;color:#71717a;">Folio</td><td style="font-size:12px;color:#18181b;font-weight:bold;text-align:right;">${data.folio}</td></tr>
      <tr><td style="font-size:12px;color:#71717a;padding-top:6px;">Trámite</td><td style="font-size:12px;color:#18181b;font-weight:bold;text-align:right;padding-top:6px;">${data.tramiteNombre}</td></tr>
      <tr><td style="font-size:12px;color:#71717a;padding-top:6px;">Costo</td><td style="font-size:12px;color:#1B4F72;font-weight:bold;text-align:right;padding-top:6px;">$${data.precio} MXN</td></tr>
    </table>
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:12px;margin:16px 0;">
      <p style="margin:0;font-size:12px;color:#92400e;line-height:1.5;">
        📌 <strong>Importante:</strong> No necesitas pagar nada todavía. Solo pagarás los $${data.precio} MXN una vez que confirmemos tu cita consular.
      </p>
    </div>
    <p style="margin:0;font-size:13px;color:#3f3f46;line-height:1.6;">
      Puedes dar seguimiento a tu trámite en cualquier momento accediendo a tu expediente con tu correo y folio.
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#71717a;">— Mr. Trámite, tu gestor de confianza</p>
  `
  return base.replace('{{CONTENT}}', content)
}

function renderCitaConfirmada(data: EmailData, base: string): string {
  const fechaCita = data.citaFecha ? new Date(data.citaFecha).toLocaleString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : '—'

  const content = `
    <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">Tu cita consular está lista 📅</h1>
    <p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Hola <strong>${data.nombreCliente}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
      ¡Buenas noticias! Hemos generado tu cita consular. Estos son los detalles:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:6px;padding:14px;margin:16px 0;">
      <tr><td style="font-size:12px;color:#065f46;">📅 Fecha</td><td style="font-size:12px;color:#064e3b;font-weight:bold;text-align:right;">${fechaCita}</td></tr>
      ${data.citaLugar ? `<tr><td style="font-size:12px;color:#065f46;padding-top:6px;">📍 Lugar</td><td style="font-size:12px;color:#064e3b;font-weight:bold;text-align:right;padding-top:6px;">${data.citaLugar}</td></tr>` : ''}
      ${data.citaDireccion ? `<tr><td style="font-size:12px;color:#065f46;padding-top:6px;">📍 Dirección</td><td style="font-size:12px;color:#064e3b;font-weight:bold;text-align:right;padding-top:6px;">${data.citaDireccion}</td></tr>` : ''}
    </table>
    <p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Ahora debes completar el pago de <strong style="color:#1B4F72;">$${data.precio} MXN</strong> para confirmar la cita.
    </p>
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:12px;margin:16px 0;">
      <p style="margin:0;font-size:12px;color:#92400e;line-height:1.5;">
        ⚠️ <strong>Si no pagas a tiempo, la cita se cancelará</strong> y tendrás que iniciar un nuevo trámite.
      </p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="#" style="display:inline-block;background:#1B4F72;color:#ffffff;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:6px;text-decoration:none;">PAGAR $${data.precio} MXN →</a>
    </div>
    <p style="margin:0;font-size:11px;color:#71717a;text-align:center;">Pago seguro vía Mercado Pago · Tarjeta o transferencia SPEI</p>
    <p style="margin:16px 0 0;font-size:12px;color:#71717a;">— Mr. Trámite</p>
  `
  return base.replace('{{CONTENT}}', content)
}

function renderPagoConfirmado(data: EmailData, base: string): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">Pago confirmado ✓</h1>
    <p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Hola <strong>${data.nombreCliente}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Hemos recibido tu pago de <strong>$${data.precio} MXN</strong>. Tu trámite continúa su curso.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:6px;padding:14px;margin:16px 0;">
      <tr><td style="font-size:12px;color:#065f46;">✅ Estado</td><td style="font-size:12px;color:#064e3b;font-weight:bold;text-align:right;">PAGO_RECIBIDO</td></tr>
      <tr><td style="font-size:12px;color:#065f46;padding-top:6px;">Monto</td><td style="font-size:12px;color:#064e3b;font-weight:bold;text-align:right;padding-top:6px;">$${data.precio} MXN</td></tr>
      <tr><td style="font-size:12px;color:#065f46;padding-top:6px;">Folio</td><td style="font-size:12px;color:#064e3b;font-weight:bold;text-align:right;padding-top:6px;">${data.folio}</td></tr>
    </table>
    <p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Mr. Trámite está preparando tus credenciales y documentos finales. Te avisaremos cuando todo esté listo para descarga.
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#71717a;">— Mr. Trámite</p>
  `
  return base.replace('{{CONTENT}}', content)
}

function renderTramiteFinalizado(data: EmailData, base: string): string {
  const fechaCita = data.citaFecha ? new Date(data.citaFecha).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : '—'

  const content = `
    <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">¡Tu trámite está listo! 🎉</h1>
    <p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Hola <strong>${data.nombreCliente}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Tu trámite de <strong>${data.tramiteNombre}</strong> ha sido finalizado exitosamente. Tu cita está confirmada y tus documentos están listos.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:6px;padding:14px;margin:16px 0;">
      <tr><td style="font-size:12px;color:#71717a;">Cita</td><td style="font-size:12px;color:#18181b;font-weight:bold;text-align:right;">${fechaCita} ✓</td></tr>
      ${data.citaLugar ? `<tr><td style="font-size:12px;color:#71717a;padding-top:6px;">Lugar</td><td style="font-size:12px;color:#18181b;font-weight:bold;text-align:right;padding-top:6px;">${data.citaLugar}</td></tr>` : ''}
      <tr><td style="font-size:12px;color:#71717a;padding-top:6px;">Folio</td><td style="font-size:12px;color:#18181b;font-weight:bold;text-align:right;padding-top:6px;">${data.folio}</td></tr>
    </table>
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:12px;margin:16px 0;">
      <p style="margin:0;font-size:12px;color:#92400e;line-height:1.5;">
        📌 <strong>Recuerda:</strong> Asiste a tu cita el día indicado. Lleva la confirmación impresa y tu pasaporte vigente.
      </p>
    </div>
    <p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Si quedaste satisfecho con el servicio, nos encantaría tu opinión. Tu testimonio ayuda a otras personas a confiar en Mr. Trámite.
    </p>
    <p style="margin:16px 0 0;font-size:12px;color:#71717a;">— Mr. Trámite, gracias por confiar en nosotros</p>
  `
  return base.replace('{{CONTENT}}', content)
}

function renderSolicitudDocsAdicionales(data: EmailData, base: string): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">Necesitamos documentos adicionales</h1>
    <p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Hola <strong>${data.nombreCliente}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Hemos revisado tus documentos y necesitamos que nos proporciones información adicional para continuar con tu trámite de <strong>${data.tramiteNombre}</strong>.
    </p>
    <p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Por favor contáctanos por WhatsApp o Messenger para indicarte qué documentos faltan.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:6px;padding:14px;margin:16px 0;">
      <tr><td style="font-size:12px;color:#71717a;">Folio</td><td style="font-size:12px;color:#18181b;font-weight:bold;text-align:right;">${data.folio}</td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#71717a;">— Mr. Trámite</p>
  `
  return base.replace('{{CONTENT}}', content)
}

function renderRecordatorioPago(data: EmailData, base: string): string {
  const content = `
    <h1 style="margin:0 0 16px;font-size:20px;color:#18181b;">Recordatorio de pago</h1>
    <p style="margin:0 0 12px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Hola <strong>${data.nombreCliente}</strong>,
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#3f3f46;line-height:1.6;">
      Tu cita consular está lista pero aún no has completado el pago de <strong>$${data.precio} MXN</strong>.
    </p>
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:12px;margin:16px 0;">
      <p style="margin:0;font-size:12px;color:#92400e;line-height:1.5;">
        ⚠️ <strong>Si no pagas pronto, la cita se cancelará.</strong>
      </p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="#" style="display:inline-block;background:#1B4F72;color:#ffffff;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:6px;text-decoration:none;">PAGAR $${data.precio} MXN →</a>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#71717a;">— Mr. Trámite</p>
  `
  return base.replace('{{CONTENT}}', content)
}
