'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  FileText,
  CreditCard,
  Calendar,
  Activity,
  Settings,
  LogOut,
  ChevronRight,
  Search,
  Plus,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  UserCircle,
  Mail,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { ExpedienteEstado } from '@prisma/client'

// ============================================================================
// Tipos
// ============================================================================

interface ExpedienteListItem {
  id: string
  folio: string
  estado: ExpedienteEstado
  createdAt: string
  updatedAt: string
  cliente: {
    id: string
    nombreCompleto: string
    email: string | null
    telefono: string | null
    canalLlegada: string
  }
  tramiteTipo: {
    codigo: string
    nombre: string
    precio: number
  }
  asignadoA: { id: string; nombre: string } | null
  counts: { documentos: number; pagos: number; acciones: number }
}

interface ExpedienteDetalle {
  id: string
  folio: string
  estado: ExpedienteEstado
  createdAt: string
  updatedAt: string
  closedAt: string | null
  citaFecha: string | null
  citaLugar: string | null
  citaDireccion: string | null
  citaConfirmada: boolean
  ds160Data: string
  datosPasaporte: string | null
  cliente: {
    id: string
    nombreCompleto: string
    curp: string | null
    email: string | null
    telefono: string | null
    canalPreferido: string | null
    canalLlegada: string
  }
  tramiteTipo: {
    codigo: string
    nombre: string
    precio: number
  }
  documentos: Array<{
    id: string
    tipo: string
    fileName: string
    fileSize: number
    valido: boolean | null
    notaValidacion: string | null
    createdAt: string
  }>
  pagos: Array<{
    id: string
    monto: number
    metodo: string
    estado: string
    mercadoPagoId: string | null
    fechaConfirmacion: string | null
  }>
  acciones: Array<{
    id: string
    codigo: string
    descripcion: string
    estadoPrevio: ExpedienteEstado
    estadoNuevo: ExpedienteEstado
    ejecutadoPor: { id: string; nombre: string }
    createdAt: string
  }>
}

// ============================================================================
// Config de estados
// ============================================================================

const ESTADO_CONFIG: Record<ExpedienteEstado, { label: string; color: string }> = {
  NUEVO: { label: 'NUEVO', color: 'bg-blue-100 text-blue-700' },
  ESPERANDO_DOCS: { label: 'ESPERANDO_DOCS', color: 'bg-amber-100 text-amber-700' },
  DOCS_INCOMPLETOS: { label: 'DOCS_INCOMPLETOS', color: 'bg-red-100 text-red-700' },
  REVISION: { label: 'REVISION', color: 'bg-amber-100 text-amber-700' },
  EN_PROCESO: { label: 'EN_PROCESO', color: 'bg-purple-100 text-purple-700' },
  LISTO_PARA_PAGO: { label: 'LISTO_PARA_PAGO', color: 'bg-emerald-100 text-emerald-700' },
  PAGO_RECIBIDO: { label: 'PAGO_RECIBIDO', color: 'bg-green-100 text-green-700' },
  FINALIZADO: { label: 'FINALIZADO', color: 'bg-gray-200 text-gray-700' },
  CANCELADO: { label: 'CANCELADO', color: 'bg-red-200 text-red-800' },
  ARCHIVADO: { label: 'ARCHIVADO', color: 'bg-gray-100 text-gray-500' },
}

const ACCIONES_DISPONIBLES: Record<ExpedienteEstado, Array<{ codigo: string; label: string; variant: 'default' | 'outline' | 'destructive' }>> = {
  NUEVO: [{ codigo: 'ACC-001', label: 'Documentos recibidos', variant: 'default' }],
  ESPERANDO_DOCS: [
    { codigo: 'ACC-001', label: 'Documentos recibidos', variant: 'default' },
    { codigo: 'ACC-003', label: 'Solicitar docs adicionales', variant: 'outline' },
  ],
  DOCS_INCOMPLETOS: [{ codigo: 'ACC-001', label: 'Documentos recibidos', variant: 'default' }],
  REVISION: [
    { codigo: 'ACC-002', label: 'Aprobar documentos', variant: 'default' },
    { codigo: 'ACC-003', label: 'Solicitar docs adicionales', variant: 'outline' },
  ],
  EN_PROCESO: [{ codigo: 'ACC-004', label: 'Marcar cita generada', variant: 'default' }],
  LISTO_PARA_PAGO: [{ codigo: 'ACC-005', label: 'Confirmar pago (manual)', variant: 'default' }],
  PAGO_RECIBIDO: [{ codigo: 'ACC-006', label: 'Finalizar trámite', variant: 'default' }],
  FINALIZADO: [],
  CANCELADO: [],
  ARCHIVADO: [],
}

// ============================================================================
// Componente principal
// ============================================================================

export function AdminPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [view, setView] = useState<'lista' | 'detalle' | 'ajustes'>('lista')
  const [expedientes, setExpedientes] = useState<ExpedienteListItem[]>([])
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState<ExpedienteDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<ExpedienteEstado | 'TODOS'>('TODOS')
  const [searchTerm, setSearchTerm] = useState('')

  // Verificar auth
  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      toast.error('Acceso denegado', { description: 'Necesitas ser administrador' })
      router.push('/')
    }
  }, [session, status, router])

  // Cargar expedientes (con flag de mounted para evitar set state en componente desmontado)
  const cargarExpedientes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado !== 'TODOS') params.set('estado', filtroEstado)
      const res = await fetch(`/api/expedientes?${params}`)
      if (!res.ok) throw new Error('Error al cargar')
      const data = await res.json()
      setExpedientes(data.expedientes || [])
    } catch (e) {
      toast.error('Error al cargar expedientes')
    } finally {
      setLoading(false)
    }
  }, [filtroEstado])

  useEffect(() => {
    if (session && (session.user as any)?.role === 'ADMIN') {
      let cancelled = false
      cargarExpedientes().then(() => {
        if (cancelled) return
      })
      return () => { cancelled = true }
    }
  }, [session, cargarExpedientes])

  // Seleccionar expediente (ver detalle)
  const verDetalle = async (folio: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/expedientes/${folio}`)
      if (!res.ok) throw new Error('Error')
      const data = await res.json()
      setExpedienteSeleccionado(data.expediente)
      setView('detalle')
    } catch (e) {
      toast.error('Error al cargar expediente')
    } finally {
      setLoading(false)
    }
  }

  // Ejecutar acción del Motor de Acciones
  const ejecutarAccion = async (
    folio: string,
    codigoAccion: string,
    metadata?: Record<string, any>
  ) => {
    try {
      const res = await fetch(`/api/expedientes/${folio}/accion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigoAccion, metadata }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al ejecutar acción')
      }
      toast.success(`Acción ejecutada: ${codigoAccion}`, {
        description: `Estado: ${data.accion.estadoPrevio} → ${data.accion.estadoNuevo}`,
      })
      // Recargar detalle
      await verDetalle(folio)
    } catch (e) {
      toast.error('Error al ejecutar acción', {
        description: e instanceof Error ? e.message : 'Intenta nuevamente',
      })
    }
  }

  // Filtrado por búsqueda
  const expedientesFiltrados = expedientes.filter((e) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      e.folio.toLowerCase().includes(term) ||
      e.cliente.nombreCompleto.toLowerCase().includes(term) ||
      (e.cliente.email?.toLowerCase().includes(term) ?? false)
    )
  })

  // Stats
  const stats = {
    total: expedientes.length,
    activos: expedientes.filter((e) => !['FINALIZADO', 'CANCELADO', 'ARCHIVADO'].includes(e.estado)).length,
    listosPago: expedientes.filter((e) => e.estado === 'LISTO_PARA_PAGO').length,
    finalizados: expedientes.filter((e) => e.estado === 'FINALIZADO').length,
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <h2 className="text-lg font-semibold">Acceso denegado</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Necesitas iniciar sesión como administrador para acceder al panel.
            </p>
            <Button onClick={() => router.push('/')} className="mt-4 bg-primary text-primary-foreground">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* SIDEBAR */}
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <Image src="/logo_icon.png" alt="Mr. Trámite" width={24} height={24} className="h-6 w-6 rounded-full" />
          <span className="text-sm font-semibold">Mr. Trámite</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">ADMIN</Badge>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <SidebarItem icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" active={view === 'lista'} onClick={() => setView('lista')} />
          <SidebarItem icon={<FolderOpen className="h-4 w-4" />} label="Expedientes" active={view === 'lista'} badge={stats.total} onClick={() => setView('lista')} />
          <SidebarItem icon={<Users className="h-4 w-4" />} label="Clientes" />
          <SidebarItem icon={<FileText className="h-4 w-4" />} label="Documentos" />
          <SidebarItem icon={<CreditCard className="h-4 w-4" />} label="Pagos" />
          <SidebarItem icon={<Calendar className="h-4 w-4" />} label="Citas" />
          <SidebarItem icon={<Activity className="h-4 w-4" />} label="Acciones (log)" />
          <Separator className="my-2" />
          <SidebarItem icon={<Settings className="h-4 w-4" />} label="Ajustes" active={view === 'ajustes'} onClick={() => setView('ajustes')} />
          <SidebarItem icon={<LogOut className="h-4 w-4" />} label="Cerrar sesión" onClick={() => signOut({ callbackUrl: '/' })} />
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden md:inline">Panel admin</span>
            {view === 'detalle' && (
              <>
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => {
                    setView('lista')
                    cargarExpedientes()
                  }}
                  className="hover:text-foreground flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Volver
                </button>
                {expedienteSeleccionado && (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-foreground font-medium">{expedienteSeleccionado.folio}</span>
                  </>
                )}
              </>
            )}
            {view === 'ajustes' && (
              <>
                <ChevronRight className="h-3 w-3" />
                <button
                  onClick={() => setView('lista')}
                  className="hover:text-foreground flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Volver
                </button>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium">Ajustes</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {session.user?.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="md:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {view === 'lista' && (
            <ListaExpedientes
              expedientes={expedientesFiltrados}
              loading={loading}
              stats={stats}
              filtroEstado={filtroEstado}
              setFiltroEstado={setFiltroEstado}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onVerDetalle={verDetalle}
              onRecargar={cargarExpedientes}
            />
          )}
          {view === 'detalle' && expedienteSeleccionado && (
            <DetalleExpediente
              expediente={expedienteSeleccionado}
              onEjecutarAccion={ejecutarAccion}
              onVolver={() => {
                setView('lista')
                cargarExpedientes() // Recargar lista al volver (estado puede haber cambiado)
              }}
            />
          )}
          {view === 'ajustes' && <AjustesPanel onVolver={() => setView('lista')} />}
        </main>
      </div>
    </div>
  )
}

// ============================================================================
// Sidebar item
// ============================================================================

function SidebarItem({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: number
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
        active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <Badge variant="secondary" className="text-[10px]">{badge}</Badge>
      )}
    </button>
  )
}

// ============================================================================
// Lista de expedientes
// ============================================================================

function ListaExpedientes({
  expedientes,
  loading,
  stats,
  filtroEstado,
  setFiltroEstado,
  searchTerm,
  setSearchTerm,
  onVerDetalle,
  onRecargar,
}: {
  expedientes: ExpedienteListItem[]
  loading: boolean
  stats: { total: number; activos: number; listosPago: number; finalizados: number }
  filtroEstado: ExpedienteEstado | 'TODOS'
  setFiltroEstado: (e: ExpedienteEstado | 'TODOS') => void
  searchTerm: string
  setSearchTerm: (s: string) => void
  onVerDetalle: (folio: string) => void
  onRecargar: () => void
}) {
  const filtros: Array<{ value: ExpedienteEstado | 'TODOS'; label: string }> = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'NUEVO', label: 'Nuevos' },
    { value: 'REVISION', label: 'En revisión' },
    { value: 'EN_PROCESO', label: 'En proceso' },
    { value: 'LISTO_PARA_PAGO', label: 'Listo para pago' },
    { value: 'PAGO_RECIBIDO', label: 'Pago recibido' },
    { value: 'FINALIZADO', label: 'Finalizados' },
  ]

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Expedientes</h1>
          <p className="text-sm text-muted-foreground">CRM unificado — todos los canales en un solo lugar</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRecargar} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          <span className="ml-1 hidden sm:inline">Refrescar</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={<FolderOpen className="h-4 w-4" />} />
        <StatCard label="Activos" value={stats.activos} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Listos para pago" value={stats.listosPago} icon={<CreditCard className="h-4 w-4" />} highlight />
        <StatCard label="Finalizados" value={stats.finalizados} icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por folio, nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {filtros.map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltroEstado(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                filtroEstado === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-medium text-xs uppercase text-muted-foreground">Folio</th>
                <th className="text-left p-3 font-medium text-xs uppercase text-muted-foreground">Cliente</th>
                <th className="text-left p-3 font-medium text-xs uppercase text-muted-foreground hidden md:table-cell">Trámite</th>
                <th className="text-left p-3 font-medium text-xs uppercase text-muted-foreground hidden sm:table-cell">Canal</th>
                <th className="text-left p-3 font-medium text-xs uppercase text-muted-foreground">Estado</th>
                <th className="text-left p-3 font-medium text-xs uppercase text-muted-foreground hidden lg:table-cell">Actualizado</th>
                <th className="text-right p-3 font-medium text-xs uppercase text-muted-foreground">Acción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : expedientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No hay expedientes con estos filtros
                  </td>
                </tr>
              ) : (
                expedientes.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => onVerDetalle(e.folio)}
                  >
                    <td className="p-3 font-mono text-xs font-medium">{e.folio}</td>
                    <td className="p-3">
                      <div className="font-medium text-sm">{e.cliente.nombreCompleto}</div>
                      <div className="text-xs text-muted-foreground">{e.cliente.email || '—'}</div>
                    </td>
                    <td className="p-3 hidden md:table-cell text-xs">{e.tramiteTipo.codigo}</td>
                    <td className="p-3 hidden sm:table-cell">
                      <Badge variant="outline" className="text-[10px]">{e.cliente.canalLlegada}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={`text-[10px] ${ESTADO_CONFIG[e.estado].color}`} variant="secondary">
                        {ESTADO_CONFIG[e.estado].label}
                      </Badge>
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                      {new Date(e.updatedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Ver
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function StatCard({ label, value, icon, highlight }: { label: string; value: number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <Card className={highlight ? 'border-primary/30' : ''}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={highlight ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
        </div>
        <div className={`text-2xl font-bold mt-1 ${highlight ? 'text-primary' : ''}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Detalle de expediente
// ============================================================================

function DetalleExpediente({
  expediente,
  onEjecutarAccion,
  onVolver,
}: {
  expediente: ExpedienteDetalle
  onEjecutarAccion: (folio: string, codigo: string, metadata?: Record<string, any>) => void
  onVolver: () => void
}) {
  const [showCitaModal, setShowCitaModal] = useState(false)
  const [citaFecha, setCitaFecha] = useState('')
  const [citaLugar, setCitaLugar] = useState('')
  const [citaDireccion, setCitaDireccion] = useState('')

  const accionesDisponibles = ACCIONES_DISPONIBLES[expediente.estado] || []

  // Datos DS-160
  let ds160: any = null
  try {
    ds160 = expediente.ds160Data ? JSON.parse(expediente.ds160Data) : null
  } catch {
    // ignore
  }

  const handleACC004 = () => {
    if (!citaFecha || !citaLugar) {
      toast.error('Completa fecha y lugar de la cita')
      return
    }
    onEjecutarAccion(expediente.folio, 'ACC-004', {
      cita: {
        fecha: citaFecha,
        lugar: citaLugar,
        direccion: citaDireccion,
      },
    })
    setShowCitaModal(false)
    setCitaFecha('')
    setCitaLugar('')
    setCitaDireccion('')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">{expediente.cliente.nombreCompleto}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span className="font-mono">{expediente.folio}</span>
          <span>·</span>
          <span>{expediente.tramiteTipo.nombre}</span>
          <span>·</span>
          <span>Canal: {expediente.cliente.canalLlegada}</span>
          <span>·</span>
          <Badge className={`text-[10px] ${ESTADO_CONFIG[expediente.estado].color}`} variant="secondary">
            {ESTADO_CONFIG[expediente.estado].label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna izquierda: datos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cliente */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <DataRow label="Nombre" value={expediente.cliente.nombreCompleto} />
              <DataRow label="CURP" value={expediente.cliente.curp || '—'} />
              <DataRow label="Email" value={expediente.cliente.email || '—'} />
              <DataRow label="Teléfono" value={expediente.cliente.telefono || '—'} />
              <DataRow label="Canal preferido" value={expediente.cliente.canalPreferido || '—'} />
              <DataRow label="Canal de llegada" value={expediente.cliente.canalLlegada} />
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Documentos ({expediente.documentos.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {expediente.documentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin documentos cargados</p>
              ) : (
                expediente.documentos.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{d.tipo.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-muted-foreground">{d.fileName}</span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        d.valido === true ? 'bg-green-100 text-green-700' :
                        d.valido === false ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }
                    >
                      {d.valido === true ? 'Válido' : d.valido === false ? 'Inválido' : 'Pendiente'}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* DS-160 resumen */}
          {ds160 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Datos DS-160 (capturados por cliente)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <DataRow label="Sexo" value={ds160.sexo || '—'} />
                <DataRow label="Fecha nacimiento" value={ds160.fechaNacimiento || '—'} />
                <DataRow label="Lugar nacimiento" value={ds160.lugarNacimiento || '—'} />
                <DataRow label="Estado civil" value={ds160.estadoCivil || '—'} />
                <DataRow label="Situación laboral" value={ds160.situacionLaboral || '—'} />
                {ds160.nombreEmpresa && <DataRow label="Empresa" value={ds160.nombreEmpresa} />}
                {ds160.nombrePadre && <DataRow label="Padre" value={ds160.nombrePadre} />}
                {ds160.nombreMadre && <DataRow label="Madre" value={ds160.nombreMadre} />}
                <DataRow label="Familiares EE.UU." value={ds160.tieneFamiliaresDirectosUS === true ? 'Sí' : 'No'} />
                <DataRow label="Viajes últimos 5 años" value={ds160.haVisitadoOtrosPaises === true ? 'Sí' : 'No'} />
                <DataRow label="Visa anterior" value={ds160.haTenidoVisaAnterior === true ? 'Sí' : 'No'} />
                <div className="pt-2">
                  <Button variant="ghost" size="sm" className="text-xs h-7">
                    Ver DS-160 completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pago */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              <DataRow label="Costo" value={`$${expediente.tramiteTipo.precio} MXN`} />
              <DataRow label="Método" value="Mercado Pago" />
              {expediente.pagos.length > 0 ? (
                expediente.pagos.map((p) => (
                  <div key={p.id} className="pt-2 border-t border-border/50 mt-2">
                    <DataRow label="Estado pago" value={
                      <Badge variant="secondary" className={
                        p.estado === 'PAGADO' ? 'bg-green-100 text-green-700' :
                        p.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {p.estado}
                      </Badge>
                    } />
                    {p.mercadoPagoId && <DataRow label="MP ID" value={p.mercadoPagoId} />}
                    {p.fechaConfirmacion && <DataRow label="Confirmado" value={new Date(p.fechaConfirmacion).toLocaleString('es-MX')} />}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: motor de acciones + timeline */}
        <div className="space-y-4">
          {/* Motor de Acciones */}
          <Card className={accionesDisponibles.length > 0 ? 'border-primary/30' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Motor de Acciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Estado actual: <span className="font-medium text-foreground">{ESTADO_CONFIG[expediente.estado].label}</span>
              </p>
              {accionesDisponibles.length > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground mt-2">Acciones disponibles:</p>
                  <div className="space-y-1.5">
                    {accionesDisponibles.map((a) => (
                      <Button
                        key={a.codigo}
                        variant={a.variant}
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => {
                          if (a.codigo === 'ACC-004') {
                            setShowCitaModal(true)
                          } else if (a.codigo === 'ACC-005') {
                            onEjecutarAccion(expediente.folio, a.codigo, { manual: true })
                          } else {
                            onEjecutarAccion(expediente.folio, a.codigo)
                          }
                        }}
                      >
                        <span className="font-mono text-[10px] opacity-70">{a.codigo}</span>
                        <span className="ml-1">{a.label}</span>
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  No hay acciones disponibles en este estado.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Cita (si existe) */}
          {expediente.citaFecha && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cita consular</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-sm">
                <DataRow label="Fecha" value={new Date(expediente.citaFecha).toLocaleString('es-MX')} />
                <DataRow label="Lugar" value={expediente.citaLugar || '—'} />
                {expediente.citaDireccion && <DataRow label="Dirección" value={expediente.citaDireccion} />}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Timeline (audit log)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {expediente.acciones.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin acciones registradas</p>
              ) : (
                expediente.acciones.map((a, i) => (
                  <div key={a.id} className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                      {i < expediente.acciones.length - 1 && <div className="w-px h-6 bg-border" />}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-medium">{a.codigo}</span>
                        <span className="text-xs">{a.descripcion}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {a.estadoPrevio} → {a.estadoNuevo} · {new Date(a.createdAt).toLocaleString('es-MX')}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        por {a.ejecutadoPor.nombre}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal cita (ACC-004) */}
      {showCitaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCitaModal(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-base">ACC-004: Cita generada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Ingresa los datos de la cita consular. Se notificará al cliente.</p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Fecha y hora *</label>
                <Input type="datetime-local" value={citaFecha} onChange={(e) => setCitaFecha(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Lugar (consulado) *</label>
                <Input value={citaLugar} onChange={(e) => setCitaLugar(e.target.value)} placeholder="Ej: Consulado EE.UU. CDMX" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Dirección</label>
                <Input value={citaDireccion} onChange={(e) => setCitaDireccion(e.target.value)} placeholder="Ej: Paseo de la Reforma 305" className="h-9" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCitaModal(false)}>Cancelar</Button>
                <Button size="sm" className="flex-1 bg-primary text-primary-foreground" onClick={handleACC004}>
                  Confirmar cita
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-right text-xs font-medium">{value}</span>
    </div>
  )
}

// ============================================================================
// Ajustes — Cambio de contraseña y preferencias de cuenta
// ============================================================================

function AjustesPanel({ onVolver }: { onVolver: () => void }) {
  const { data: session, update: updateSession } = useSession()

  // ----- Estado del formulario de CONTRASEÑA -----
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNuevo, setpasswordNuevo] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const [mostrarActual, setMostrarActual] = useState(false)
  const [mostrarNuevo, setMostrarNuevo] = useState(false)
  const [mostrarConfirm, setMostrarConfirm] = useState(false)

  const [guardandoPwd, setGuardandoPwd] = useState(false)
  const [exitoPwd, setExitoPwd] = useState(false)

  // ----- Estado del formulario de CUENTA (email + nombre) -----
  const [cuentaPassword, setCuentaPassword] = useState('')
  const [mostrarCuentaPwd, setMostrarCuentaPwd] = useState(false)
  const [emailNuevo, setEmailNuevo] = useState('')
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [guardandoCuenta, setGuardandoCuenta] = useState(false)
  const [exitoCuenta, setExitoCuenta] = useState<null | { mensaje: string; necesitaRelogin: boolean }>(null)

  // Validación en vivo del password
  const validaciones = {
    longitud: passwordNuevo.length >= 8,
    letra: /[A-Za-z]/.test(passwordNuevo),
    numero: /[0-9]/.test(passwordNuevo),
    coincide: passwordNuevo.length > 0 && passwordNuevo === passwordConfirm,
    actualLlena: passwordActual.length > 0,
  }
  const formularioValido =
    validaciones.actualLlena &&
    validaciones.longitud &&
    validaciones.letra &&
    validaciones.numero &&
    validaciones.coincide

  // Validación en vivo de cuenta
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const emailOriginal = (session?.user?.email as string) || ''
  const nombreOriginal = (session?.user?.name as string) || ''
  const emailNormalizado = emailNuevo.trim().toLowerCase()
  const nombreNormalizado = nombreNuevo.trim()
  const hayCambiosCuenta =
    (emailNormalizado.length > 0 && emailNormalizado !== emailOriginal.toLowerCase()) ||
    (nombreNormalizado.length > 0 && nombreNormalizado !== nombreOriginal)
  const emailValido = emailNormalizado.length === 0 || EMAIL_REGEX.test(emailNormalizado)
  const cuentaFormValida =
    cuentaPassword.length > 0 && hayCambiosCuenta && emailValido

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formularioValido || guardandoPwd) return

    setGuardandoPwd(true)
    setExitoPwd(false)
    try {
      const res = await fetch('/api/auth/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordActual,
          passwordNuevo,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al cambiar la contraseña')
      }
      toast.success('Contraseña actualizada', {
        description: 'Usa la nueva contraseña la próxima vez que inicies sesión.',
      })
      setExitoPwd(true)
      setPasswordActual('')
      setpasswordNuevo('')
      setPasswordConfirm('')
    } catch (err) {
      toast.error('No se pudo cambiar la contraseña', {
        description: err instanceof Error ? err.message : 'Intenta nuevamente',
      })
    } finally {
      setGuardandoPwd(false)
    }
  }

  // ----- Handler para actualizar CUENTA (email / nombre) -----
  const handleActualizarCuenta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cuentaFormValida || guardandoCuenta) return

    setGuardandoCuenta(true)
    setExitoCuenta(null)
    try {
      const res = await fetch('/api/auth/actualizar-cuenta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordActual: cuentaPassword,
          emailNuevo: emailNormalizado || undefined,
          nombreNuevo: nombreNormalizado || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar la cuenta')
      }
      setExitoCuenta({
        mensaje: data.mensaje || 'Cuenta actualizada',
        necesitaRelogin: data.necesitaRelogin === true,
      })
      // Limpiar campos
      setCuentaPassword('')
      setEmailNuevo('')
      setNombreNuevo('')
      // Forzar refresh de la sesión para que se actualice el email/nombre en el topbar
      try {
        await updateSession({ force: true } as any)
      } catch {}
      if (data.necesitaRelogin) {
        toast.warning('Email actualizado', {
          description: 'Cierra sesión y vuelve a entrar con el nuevo email.',
        })
      } else {
        toast.success('Cuenta actualizada')
      }
    } catch (err) {
      toast.error('No se pudo actualizar la cuenta', {
        description: err instanceof Error ? err.message : 'Intenta nuevamente',
      })
    } finally {
      setGuardandoCuenta(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Ajustes</h1>
          <p className="text-sm text-muted-foreground">
            Administra tu cuenta y preferencias del panel
          </p>
        </div>
      </div>

      {/* Tarjeta de cuenta — lectura */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DataRow label="Nombre" value={session?.user?.name ?? '—'} />
          <DataRow label="Email" value={session?.user?.email ?? '—'} />
          <DataRow label="Rol" value={(session?.user as any)?.role ?? '—'} />
        </CardContent>
      </Card>

      {/* Cambio de email / nombre */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            Cambiar email o nombre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActualizarCuenta} className="space-y-4">
            {/* Email actual (lectura) */}
            <div className="rounded-md bg-muted/50 p-3 space-y-1.5">
              <div className="text-[11px] text-muted-foreground">Email actual</div>
              <div className="text-sm font-medium">{emailOriginal || '—'}</div>
              <div className="text-[11px] text-muted-foreground">Nombre actual: {nombreOriginal || '—'}</div>
            </div>

            {/* Nuevo nombre */}
            <div className="space-y-1.5">
              <label htmlFor="cuenta-nombre" className="text-sm font-medium flex items-center gap-1.5">
                <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                Nuevo nombre <span className="text-muted-foreground text-xs">(opcional)</span>
              </label>
              <Input
                id="cuenta-nombre"
                type="text"
                value={nombreNuevo}
                onChange={(e) => {
                  setNombreNuevo(e.target.value)
                  setExitoCuenta(null)
                }}
                placeholder={nombreOriginal || 'Tu nombre'}
                autoComplete="name"
                maxLength={100}
              />
            </div>

            {/* Nuevo email */}
            <div className="space-y-1.5">
              <label htmlFor="cuenta-email" className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Nuevo email <span className="text-muted-foreground text-xs">(opcional)</span>
              </label>
              <Input
                id="cuenta-email"
                type="email"
                value={emailNuevo}
                onChange={(e) => {
                  setEmailNuevo(e.target.value)
                  setExitoCuenta(null)
                }}
                placeholder={emailOriginal || 'tu@correo.com'}
                autoComplete="email"
                className={!emailValido ? 'border-destructive' : ''}
              />
              {!emailValido && (
                <p className="text-xs text-destructive mt-1">El email no tiene un formato válido</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Cuando tengas tu dominio <code className="bg-muted px-1 rounded">mrtramite.mx</code>,
                aquí podrás cambiarlo a <code className="bg-muted px-1 rounded">contacto@mrtramite.mx</code> o
                <code className="bg-muted px-1 rounded ml-1">julian@mrtramite.mx</code>.
              </p>
            </div>

            <Separator />

            {/* Contraseña para confirmar */}
            <div className="space-y-1.5">
              <label htmlFor="cuenta-pwd" className="text-sm font-medium flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Contraseña actual <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="cuenta-pwd"
                  type={mostrarCuentaPwd ? 'text' : 'password'}
                  value={cuentaPassword}
                  onChange={(e) => {
                    setCuentaPassword(e.target.value)
                    setExitoCuenta(null)
                  }}
                  placeholder="Confirma tu contraseña para guardar cambios"
                  autoComplete="current-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarCuentaPwd(!mostrarCuentaPwd)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label={mostrarCuentaPwd ? 'Ocultar' : 'Mostrar'}
                >
                  {mostrarCuentaPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Pedimos tu contraseña por seguridad antes de cambiar datos sensibles.
              </p>
            </div>

            {/* Mensaje de éxito */}
            {exitoCuenta && (
              <div
                className={`flex items-start gap-2 rounded-md border p-3 ${
                  exitoCuenta.necesitaRelogin
                    ? 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900'
                    : 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900'
                }`}
              >
                {exitoCuenta.necesitaRelogin ? (
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                )}
                <div className="text-xs">
                  <p
                    className={`font-medium ${
                      exitoCuenta.necesitaRelogin
                        ? 'text-amber-900 dark:text-amber-200'
                        : 'text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    {exitoCuenta.necesitaRelogin ? 'Email actualizado — reinicio requerido' : 'Cuenta actualizada'}
                  </p>
                  <p
                    className={`mt-0.5 ${
                      exitoCuenta.necesitaRelogin
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {exitoCuenta.mensaje}
                  </p>
                  {exitoCuenta.necesitaRelogin && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 text-xs"
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Cerrar sesión ahora
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onVolver}
                className="sm:w-auto"
              >
                Volver
              </Button>
              <Button
                type="submit"
                disabled={!cuentaFormValida || guardandoCuenta}
                className="sm:flex-1 bg-primary text-primary-foreground"
              >
                {guardandoCuenta ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <UserCircle className="h-4 w-4 mr-2" />
                    Actualizar cuenta
                  </>
                )}
              </Button>
            </div>

            {!hayCambiosCuenta && (emailNuevo.length > 0 || nombreNuevo.length > 0) && (
              <p className="text-[11px] text-muted-foreground text-center">
                Los valores que escribiste son iguales a los actuales.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Cambio de contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
            Cambiar contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contraseña actual */}
            <div className="space-y-1.5">
              <label htmlFor="pwd-actual" className="text-sm font-medium flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Contraseña actual
              </label>
              <div className="relative">
                <Input
                  id="pwd-actual"
                  type={mostrarActual ? 'text' : 'password'}
                  value={passwordActual}
                  onChange={(e) => {
                    setPasswordActual(e.target.value)
                    setExitoPwd(false)
                  }}
                  placeholder="Tu contraseña actual"
                  autoComplete="current-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarActual(!mostrarActual)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label={mostrarActual ? 'Ocultar' : 'Mostrar'}
                >
                  {mostrarActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Separator />

            {/* Nueva contraseña */}
            <div className="space-y-1.5">
              <label htmlFor="pwd-nuevo" className="text-sm font-medium flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                Nueva contraseña
              </label>
              <div className="relative">
                <Input
                  id="pwd-nuevo"
                  type={mostrarNuevo ? 'text' : 'password'}
                  value={passwordNuevo}
                  onChange={(e) => {
                    setpasswordNuevo(e.target.value)
                    setExitoPwd(false)
                  }}
                  placeholder="Mínimo 8 caracteres, letras y números"
                  autoComplete="new-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarNuevo(!mostrarNuevo)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label={mostrarNuevo ? 'Ocultar' : 'Mostrar'}
                >
                  {mostrarNuevo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Indicadores de fortaleza */}
              {passwordNuevo.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <FortalezaItem ok={validaciones.longitud} label="Mínimo 8 caracteres" />
                  <FortalezaItem ok={validaciones.letra} label="Incluye letras" />
                  <FortalezaItem ok={validaciones.numero} label="Incluye números" />
                </div>
              )}
            </div>

            {/* Confirmar nueva */}
            <div className="space-y-1.5">
              <label htmlFor="pwd-confirm" className="text-sm font-medium flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <Input
                  id="pwd-confirm"
                  type={mostrarConfirm ? 'text' : 'password'}
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value)
                    setExitoPwd(false)
                  }}
                  placeholder="Repite la nueva contraseña"
                  autoComplete="new-password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirm(!mostrarConfirm)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  aria-label={mostrarConfirm ? 'Ocultar' : 'Mostrar'}
                >
                  {mostrarConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordConfirm.length > 0 && !validaciones.coincide && (
                <p className="text-xs text-destructive mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Mensaje de éxito */}
            {exitoPwd && (
              <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-emerald-900 dark:text-emerald-200">
                    Contraseña actualizada correctamente
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                    La próxima vez que inicies sesión usa tu nueva contraseña.
                  </p>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onVolver}
                className="sm:w-auto"
              >
                Volver
              </Button>
              <Button
                type="submit"
                disabled={!formularioValido || guardandoPwd}
                className="sm:flex-1 bg-primary text-primary-foreground"
              >
                {guardandoPwd ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Cambiar contraseña
                  </>
                )}
              </Button>
            </div>

            {/* Nota de seguridad */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3 mt-2">
              <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p>
                Por seguridad, te pediremos la contraseña actual para verificar tu identidad.
                La nueva contraseña se guarda hasheada con bcrypt y nunca se envía por correo.
                Si la olvidas, un administrador con acceso al servidor puede restablecerla
                directamente en la base de datos.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function FortalezaItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
        ok
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </span>
  )
}
