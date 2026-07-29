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
  const [view, setView] = useState<'lista' | 'detalle'>('lista')
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
          <SidebarItem icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" active />
          <SidebarItem icon={<FolderOpen className="h-4 w-4" />} label="Expedientes" active badge={stats.total} />
          <SidebarItem icon={<Users className="h-4 w-4" />} label="Clientes" />
          <SidebarItem icon={<FileText className="h-4 w-4" />} label="Documentos" />
          <SidebarItem icon={<CreditCard className="h-4 w-4" />} label="Pagos" />
          <SidebarItem icon={<Calendar className="h-4 w-4" />} label="Citas" />
          <SidebarItem icon={<Activity className="h-4 w-4" />} label="Acciones (log)" />
          <Separator className="my-2" />
          <SidebarItem icon={<Settings className="h-4 w-4" />} label="Ajustes" />
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
              onRecargar={() => verDetalle(expedienteSeleccionado.folio)}
            />
          )}
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
  onRecargar,
}: {
  expediente: ExpedienteDetalle
  onEjecutarAccion: (folio: string, codigo: string, metadata?: Record<string, any>) => void
  onVolver: () => void
  onRecargar: () => void
}) {
  const [showCitaModal, setShowCitaModal] = useState(false)
  const [citaFecha, setCitaFecha] = useState('')
  const [citaLugar, setCitaLugar] = useState('')
  const [citaDireccion, setCitaDireccion] = useState('')

  const DOC_REQUERIDOS = [
    { tipo: 'PASAPORTE', label: 'Pasaporte vigente', required: true },
    { tipo: 'ACTA_NACIMIENTO', label: 'Acta de nacimiento', required: true },
    { tipo: 'FOTO_PASAPORTE', label: 'Foto tipo pasaporte', required: true },
    { tipo: 'COMPROBANTE_DOMICILIO', label: 'Comprobante de domicilio', required: false },
    { tipo: 'ACTA_MATRIMONIO', label: 'Acta de matrimonio', required: false },
    { tipo: 'RECIBOS_INGRESOS', label: 'Comprobantes de ingresos', required: false },
  ]

  const marcarDocumento = async (tipo: string, recibido: boolean) => {
    try {
      const res = await fetch(`/api/expedientes/${expediente.folio}/documentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, recibido }),
      })
      if (!res.ok) throw new Error('Error')
      toast.success(recibido ? `${tipo.replace(/_/g, ' ')} marcado como recibido` : `${tipo.replace(/_/g, ' ')} desmarcado`)
      onRecargar()
    } catch (e) {
      toast.error('Error al marcar documento')
    }
  }

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
              <CardTitle className="text-sm">Documentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">
                Los documentos pueden ser recibidos por WhatsApp o subidos directamente por el cliente. Marca como "Recibido" los que ya tienes. Todos los obligatorios deben estar recibidos para aprobar (ACC-002).
              </p>
              {DOC_REQUERIDOS.map((dt) => {
                const doc = expediente.documentos.find((d) => d.tipo === dt.tipo)
                const recibido = doc?.valido === true
                const subidoPendiente = doc && doc.valido === null
                const tieneArchivo = doc && doc.filePath && doc.filePath !== 'whatsapp'
                
                let bgColor = 'border-border'
                let iconColor = 'text-muted-foreground'
                let badge = null
                
                if (recibido) {
                  bgColor = 'border-green-300 bg-green-50'
                  iconColor = 'text-green-600'
                  badge = <span className="text-[10px] text-green-700 font-medium">✓ Recibido</span>
                } else if (subidoPendiente) {
                  bgColor = 'border-amber-300 bg-amber-50'
                  iconColor = 'text-amber-600'
                  badge = <span className="text-[10px] text-amber-700 font-medium">📎 Subido (pendiente)</span>
                }
                
                return (
                  <div key={dt.tipo} className={`flex items-center justify-between rounded-md border p-2.5 text-sm ${bgColor}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className={`h-4 w-4 flex-shrink-0 ${iconColor}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{dt.label}</span>
                          {dt.required && <span className="text-destructive">*</span>}
                          {badge}
                        </div>
                        {doc?.fileName && doc.fileName !== 'Recibido por WhatsApp' && (
                          <span className="text-[10px] text-muted-foreground truncate block">{doc.fileName}</span>
                        )}
                        {tieneArchivo && (
                          <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary underline block">
                            Ver archivo
                          </a>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={recibido ? 'outline' : 'default'}
                      size="sm"
                      className={`h-7 text-xs flex-shrink-0 ml-2 ${recibido ? 'text-green-700 border-green-300' : 'bg-primary text-primary-foreground'}`}
                      onClick={() => marcarDocumento(dt.tipo, !recibido)}
                    >
                      {recibido ? '✓ Recibido' : 'Marcar recibido'}
                    </Button>
                  </div>
                )
              })}
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
