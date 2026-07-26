import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { crearExpedienteDesdeWizard, listarExpedientes } from '@/lib/services/expediente-service'
import { logger } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'
import type { WizardData } from '@/components/wizard/types'
import type { ExpedienteEstado } from '@prisma/client'

// ============================================================================
// POST /api/expedientes
// Crea un expediente desde el wizard del cliente
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 creaciones por minuto por IP
    const rateLimitResponse = applyRateLimit(request, 'CREATE_EXPEDIENTE')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const wizardData = body as WizardData

    // Validación mínima
    if (!wizardData.nombreCompleto || !wizardData.email || !wizardData.curp) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombreCompleto, email, curp' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(wizardData.email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      )
    }

    // Validar formato de CURP (18 caracteres alfanuméricos)
    if (!/^[A-Z0-9]{18}$/i.test(wizardData.curp)) {
      return NextResponse.json(
        { error: 'El CURP debe tener exactamente 18 caracteres alfanuméricos' },
        { status: 400 }
      )
    }

    if (!wizardData.aceptaAvisoPrivacidad || !wizardData.aceptaTerminos) {
      return NextResponse.json(
        { error: 'Debe aceptar el aviso de privacidad y los términos' },
        { status: 400 }
      )
    }

    if (!wizardData.tienePasaporteVigente) {
      return NextResponse.json(
        { error: 'Debe tener pasaporte vigente para tramitar la visa' },
        { status: 400 }
      )
    }

    const resultado = await crearExpedienteDesdeWizard({ wizardData })

    return NextResponse.json(
      {
        ok: true,
        folio: resultado.expediente.folio,
        expedienteId: resultado.expediente.id,
        estado: resultado.expediente.estado,
        clienteId: resultado.cliente.id,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Error creando expediente', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET /api/expedientes
// Lista expedientes (para admin). Filtros opcionales: ?estado=NUEVO&limite=50
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Verificar sesión de admin
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado — se requiere sesión de administrador' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') as ExpedienteEstado | null
    const limite = parseInt(searchParams.get('limite') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const filtros: { limite: number; offset: number; estado?: ExpedienteEstado } = { limite, offset }
    if (estado) filtros.estado = estado

    const resultado = await listarExpedientes(filtros)

    return NextResponse.json({
      ok: true,
      expedientes: resultado.expedientes.map((e) => ({
        id: e.id,
        folio: e.folio,
        estado: e.estado,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
        cliente: {
          id: e.cliente.id,
          nombreCompleto: e.cliente.nombreCompleto,
          email: e.cliente.email,
          telefono: e.cliente.telefono,
          canalLlegada: e.cliente.canalLlegada,
        },
        tramiteTipo: {
          codigo: e.tramiteTipo.codigo,
          nombre: e.tramiteTipo.nombre,
          precio: e.tramiteTipo.precio,
        },
        asignadoA: e.asignadoA,
        counts: e._count,
      })),
      total: resultado.total,
    })
  } catch (error) {
    logger.error('Error listando expedientes', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
