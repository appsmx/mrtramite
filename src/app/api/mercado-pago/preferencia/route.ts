import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { crearPreferencia } from '@/lib/services/mercado-pago-service'
import { db } from '@/lib/db'

// ============================================================================
// POST /api/mercado-pago/preferencia
// ============================================================================
// Crea una preferencia de pago en Mercado Pago para un expediente.
// Solo el cliente dueño del expediente (o un admin) puede generar el link.
//
// Body:
//   { folio: string }
//
// Respuestas:
//   200 — { preferenceId, initPoint, sandboxInitPoint }
//   400 — expediente no está en estado LISTO_PARA_PAGO
//   401 — no autenticado
//   403 — no autorizado (no es dueño ni admin)
//   500 — error del servidor o MP
// ============================================================================

export async function POST(req: Request) {
  try {
    // 1. Verificar sesión
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const rol = (session.user as any)?.role
    const folioSesion = (session.user as any)?.folio
    const usuarioId = (session.user as any)?.id

    // 2. Parsear body
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const { folio } = body ?? {}
    if (typeof folio !== 'string' || !folio.trim()) {
      return NextResponse.json(
        { error: 'Folio requerido' },
        { status: 400 }
      )
    }

    const folioNorm = folio.toUpperCase().trim()

    // 3. Verificar autorización
    if (rol === 'CLIENTE' && folioSesion !== folioNorm) {
      return NextResponse.json(
        { error: 'No tienes acceso a este expediente' },
        { status: 403 }
      )
    }

    // 4. Buscar el expediente para obtener datos del cliente
    const expediente = await db.expediente.findUnique({
      where: { folio: folioNorm },
      include: { cliente: true, tramiteTipo: true },
    })

    if (!expediente) {
      return NextResponse.json(
        { error: 'Expediente no encontrado' },
        { status: 404 }
      )
    }

    // 5. Crear preferencia de MP
    const result = await crearPreferencia({
      folio: folioNorm,
      monto: expediente.tramiteTipo.precio,
      descripcion: `${expediente.tramiteTipo.nombre} — Folio ${folioNorm}`,
      emailCliente: expediente.cliente.email,
      nombreCliente: expediente.cliente.nombreCompleto,
    })

    return NextResponse.json({
      preferenceId: result.preference.preferenceId,
      initPoint: result.preference.initPoint,
      sandboxInitPoint: result.preference.sandboxInitPoint,
      pagoId: result.pagoId,
      monto: expediente.tramiteTipo.precio,
    })
  } catch (err) {
    console.error('[api/mercado-pago/preferencia] Error:', err)
    const msg = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    )
  }
}
