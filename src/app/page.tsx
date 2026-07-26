'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Landing } from '@/components/landing'
import { Wizard } from '@/components/wizard/wizard'
import { AdminPanel } from '@/components/admin-panel'
import { ClientePortal } from '@/components/cliente-portal'

export default function Home() {
  const { data: session } = useSession()
  const [view, setView] = useState<'landing' | 'wizard'>('landing')

  // Si hay sesión activa, mostrar panel según rol
  if (session) {
    const role = (session.user as any)?.role
    if (role === 'ADMIN') {
      return <AdminPanel />
    }
    if (role === 'CLIENTE') {
      return <ClientePortal />
    }
  }

  // Sin sesión: landing o wizard
  if (view === 'wizard') {
    return <Wizard onExit={() => setView('landing')} />
  }

  return <Landing onStartTramite={() => setView('wizard')} />
}
