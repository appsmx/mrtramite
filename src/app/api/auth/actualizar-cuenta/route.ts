import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// ============================================================================
// POST /api/auth/actualizar-cuenta
// ============================================================================
// Permite a un usuario autenticado (ADMIN, ASESOR, GESTOR) actualizar su
// propio email y/o nombre. Por seguridad, requiere la contraseña actual
// para confirmar la identidad en cualquier cambio sensible.
//
// Body:
//   {
//     passwordActual: string,   // siempre requerido
//     emailNuevo?: string,      // si se quiere cambiar el email
//     nombreNuevo?: string      // si se quiere cambiar el nombre
//   }
//
// Reglas:
//   - Si emailNuevo es null/undefined/vacío → no se cambia el email
//   - Si nombreNuevo es null/undefined/vacío → no se cambia el nombre
//   - Si ninguno cambia → retorna 400 "nada que actualizar"
//   - El emailNuevo debe ser válido y no estar ya en uso
//   - El nombreNuevo no puede exceder 100 caracteres
//
// IMPORTANTE: Como NextAuth usa JWT, el cambio de email NO se refleja en
// la sesión actual hasta que el usuario cierre y vuelva a abrir sesión.
// El frontend debe invitar al usuario a hacerlo.
// ============================================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LEN = 1 // Solo verificamos que no esté vacío; fortaleza ya se validó al crear
const MAX_NOMBRE_LEN = 100

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
        { error: 'Sin permiso. Los clientes no gestionan cuenta propia.' },
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

    const { passwordActual, emailNuevo, nombreNuevo } = body ?? {}

    // 3. Validar que vino la contraseña actual
    if (typeof passwordActual !== 'string' || passwordActual.length < MIN_PASSWORD_LEN) {
      return NextResponse.json(
        { error: 'Debes ingresar tu contraseña actual para confirmar cambios.' },
        { status: 400 }
      )
    }

    // 4. Normalizar inputs
    const emailLimpio = typeof emailNuevo === 'string' ? emailNuevo.trim().toLowerCase() : ''
    const nombreLimpio = typeof nombreNuevo === 'string' ? nombreNuevo.trim() : ''

    // 5. Determinar qué se quiere cambiar
    const quiereCambiarEmail = emailLimpio.length > 0
    const quiereCambiarNombre = nombreLimpio.length > 0

    if (!quiereCambiarEmail && !quiereCambiarNombre) {
      return NextResponse.json(
        { error: 'No hay nada que actualizar. Indica un nuevo email o nombre.' },
        { status: 400 }
      )
    }

    // 6. Cargar usuario y verificar contraseña actual
    const usuario = await db.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        email: true,
        nombre: true,
        passwordHash: true,
        activo: true,
      },
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

    // 7. Validar email nuevo si se quiere cambiar
    if (quiereCambiarEmail) {
      if (!EMAIL_REGEX.test(emailLimpio)) {
        return NextResponse.json(
          { error: 'El email no tiene un formato válido.' },
          { status: 400 }
        )
      }
      if (emailLimpio === usuario.email) {
        return NextResponse.json(
          { error: 'El email nuevo es igual al actual.' },
          { status: 400 }
        )
      }
      // Validar unicidad
      const existente = await db.usuario.findUnique({
        where: { email: emailLimpio },
        select: { id: true },
      })
      if (existente) {
        return NextResponse.json(
          { error: 'Ese email ya está registrado por otro usuario.' },
          { status: 409 }
        )
      }
    }

    // 8. Validar nombre nuevo si se quiere cambiar
    if (quiereCambiarNombre) {
      if (nombreLimpio.length > MAX_NOMBRE_LEN) {
        return NextResponse.json(
          { error: `El nombre no puede exceder ${MAX_NOMBRE_LEN} caracteres.` },
          { status: 400 }
        )
      }
      if (nombreLimpio === usuario.nombre) {
        // Si el nombre no cambió realmente, lo quitamos del update
        // para no hacer un no-op
      }
    }

    // 9. Construir update solo con los campos que cambiaron
    const data: { email?: string; nombre?: string } = {}
    if (quiereCambiarEmail && emailLimpio !== usuario.email) {
      data.email = emailLimpio
    }
    if (quiereCambiarNombre && nombreLimpio !== usuario.nombre) {
      data.nombre = nombreLimpio
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No hay cambios reales que aplicar.' },
        { status: 400 }
      )
    }

    // 10. Aplicar el update
    await db.usuario.update({
      where: { id: usuario.id },
      data,
    })

    // 11. Log de auditoría
    const cambios: string[] = []
    if (data.email) cambios.push(`email: ${usuario.email} → ${data.email}`)
    if (data.nombre) cambios.push(`nombre: ${usuario.nombre} → ${data.nombre}`)
    console.log(
      `[auth] Cuenta actualizada — usuario=${usuario.email} cambios=[${cambios.join(', ')}] ts=${new Date().toISOString()}`
    )

    // 12. Respuesta
    const necesitaRelogin = !!data.email // Si cambió email, el JWT ya no coincide

    return NextResponse.json({
      ok: true,
      mensaje: necesitaRelogin
        ? 'Cuenta actualizada. Como cambiaste el email, debes cerrar sesión y volver a entrar con el nuevo email.'
        : 'Cuenta actualizada correctamente.',
      cambios: {
        email: data.email || null,
        nombre: data.nombre || null,
      },
      necesitaRelogin,
    })
  } catch (err) {
    console.error('[api/auth/actualizar-cuenta] Error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
