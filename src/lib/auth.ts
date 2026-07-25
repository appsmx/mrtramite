import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

// ============================================================================
// Configuración NextAuth v4
// ============================================================================
// Dos flujos:
//   1. Admin/Asesor/Gestor: email + password (hasheado con bcrypt)
//   2. Cliente: email + folio (login sin password, valida que el expediente existe)

export const authOptions: NextAuthOptions = {
  providers: [
    // Flujo admin: email + password
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const usuario = await db.usuario.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { cliente: true },
        })

        if (!usuario || !usuario.activo) {
          return null
        }

        // Solo admin/asesor/gestor pueden usar este flujo
        if (usuario.rol === 'CLIENTE') {
          return null
        }

        // Verificar password
        const passwordValido = await bcrypt.compare(credentials.password, usuario.passwordHash)
        if (!passwordValido) {
          return null
        }

        return {
          id: usuario.id,
          name: usuario.nombre,
          email: usuario.email,
          role: usuario.rol,
        }
      },
    }),

    // Flujo cliente: email + folio
    CredentialsProvider({
      id: 'cliente-credentials',
      name: 'Cliente',
      credentials: {
        email: { label: 'Email', type: 'email' },
        folio: { label: 'Folio', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.folio) {
          return null
        }

        // Buscar expediente por folio
        const expediente = await db.expediente.findUnique({
          where: { folio: credentials.folio.toUpperCase().trim() },
          include: { cliente: true },
        })

        if (!expediente) {
          return null
        }

        // Validar que el email coincide con el del cliente
        if (
          !expediente.cliente.email ||
          expediente.cliente.email.toLowerCase() !== credentials.email.toLowerCase()
        ) {
          return null
        }

        return {
          id: expediente.cliente.usuarioId || expediente.cliente.id, // Usar clienteId si no tiene usuario
          name: expediente.cliente.nombreCompleto,
          email: expediente.cliente.email,
          role: 'CLIENTE' as const,
          folio: expediente.folio,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.folio = (user as any).folio
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).folio = token.folio
      }
      return session
    },
  },
  pages: {
    signIn: '/', // Login integrado en la home (no página separada)
  },
}
