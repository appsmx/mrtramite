import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// ============================================================================
// POST /api/auth/cambiar-password
// ============================================================================
// Permite a un usuario autenticado (ADMIN, ASESOR, GESTOR) cambiar su propia
// contraseña. Requiere la contraseña actual para validar identidad.
//
// Body:
//   { passwordActual: string, passwordNuevo: string }
//
// Respuestas:
//   200 — { ok: true }                  (contraseña actualizada)
//   400 — { error: 'Datos inválidos' }  (campos faltantes o password débil)
//   401 — { error: 'No autenticado' }   (sin sesión)
//   403 — { error: 'Sin permiso' }      (rol CLIENTE no usa este flujo)
//   409 — { error: 'Contraseña actual incorrecta' }
// ============================================================================

const MIN_LEN = 8
const MAX_LEN = 128

function esPasswordFuerte(pwd: string): { ok: boolean; mensaje?: string } {
  if (pwd.length < MIN_LEN) {
    return { ok: false, mensaje: `La contraseña debe tener al menos ${MIN_LEN} caracteres` }
  }
  if (pwd.length > MAX_LEN) {
    return { ok: false, mensaje: `La contraseña no puede exceder ${MAX_LEN} caracteres` }
  }
  if (!/[A-Za-z]/.test(pwd)) {
    return { ok: false, mensaje: 'La contraseña debe incluir al menos una letra' }
  }
  if (!/[0-9]/.test(pwd)) {
    return { ok: false, mensaje: 'La contraseña debe incluir al menos un número' }
  }
  return { ok: true }
}

export async function POST(req: Request) {
  try {
    // 1. Verificar sesión
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const rol = (session.user as any)?.role
    if (rol === 'CLIENTE') {
      return NextResponse.json(
        { error: 'Sin permiso. Los clientes no usan contraseña.' },
        { status: 403 }
      )
    }

    const usuarioId = (session.user as any)?.id
    if (!usuarioId) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    // 2. Parsear body
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    const { passwordActual, passwordNuevo } = body ?? {}

    if (
      typeof passwordActual !== 'string' ||
      typeof passwordNuevo !== 'string' ||
      !passwordActual ||
      !passwordNuevo
    ) {
      return NextResponse.json(
        { error: 'Datos inválidos. Se requieren passwordActual y passwordNuevo.' },
        { status: 400 }
      )
    }

    // 3. Validar fortaleza de la nueva contraseña
    const check = esPasswordFuerte(passwordNuevo)
    if (!check.ok) {
      return NextResponse.json({ error: check.mensaje }, { status: 400 })
    }

    // 4. Cargar usuario y verificar contraseña actual
    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: { id: true, email: true, passwordHash: true, activo: true },
    })

    if (!usuario || !usuario.activo) {
      return NextResponse.json({ error: 'Usuario no disponible' }, { status: 401 })
    }

    const actualValida = await bcrypt.compare(passwordActual, usuario.passwordHash)
    if (!actualValida) {
      return NextResponse.json(
        { error: 'Contraseña actual incorrecta' },
        { status: 409 }
      )
    }

    // 5. Evitar que la nueva sea igual a la actual
    const igualQueActual = await bcrypt.compare(passwordNuevo, usuario.passwordHash)
    if (igualQueActual) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe ser diferente a la actual' },
        { status: 400 }
      )
    }

    // 6. Hashear y guardar
    const nuevoHash = await bcrypt.hash(passwordNuevo, 12)
    await db.usuario.update({
      where: { id: usuario.id },
      data: { passwordHash: nuevoHash },
    })

    // 7. Registrar auditoría (mensaje en log interno del sistema)
    console.log(
      `[auth] Password cambiada — usuario=${usuario.email} rol=${rol} ts=${new Date().toISOString()}`
    )

    return NextResponse.json({ ok: true, mensaje: 'Contraseña actualizada correctamente' })
  } catch (err) {
    console.error('[api/auth/cambiar-password] Error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
