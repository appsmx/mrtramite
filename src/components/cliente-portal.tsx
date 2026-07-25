'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import {
  LogOut,
  Loader2,
  ShieldCheck,
  Clock,
  FileText,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { ExpedienteEstado } from '@prisma/client'

interface ExpedienteCliente {
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
  tramiteTipo: {
    codigo: string
    nombre: string
    precio: number
  }
  cliente: {
    nombreCompleto: string
    email: string | null
    telefono: string | null
  }
  documentos: Array<{
    id: string
    tipo: string
    fileName: string
    valido: boolean | null
  }>
  pagos: Array<{
    id: string
    monto: number
    metodo: string
    estado: string
    fechaConfirmacion: string | null
  }>
  acciones: Array<{
    id: string
    codigo: string
    descripcion: string
    estadoNuevo: ExpedienteEstado
    createdAt: string
  }>
}

const ESTADO_CONFIG: Record<ExpedienteEstado, { label: string; color: string; descripcion: string }> = {
  NUEVO: { label: 'NUEVO', color: 'bg-blue-100 text-blue-700', descripcion: 'Hemos recibido tu solicitud' },
  ESPERANDO_DOCS: { label: 'ESPERANDO DOCUMENTOS', color: 'bg-amber-100 text-amber-700', descripcion: 'Estamos esperando tus documentos' },
  DOCS_INCOMPLETOS: { label: 'DOCUMENTOS INCOMPLETOS', color: 'bg-red-100 text-red-700', descripcion: 'Necesitamos documentos adicionales' },
  REVISION: { label: 'EN REVISIÓN', color: 'bg-amber-100 text-amber-700', descripcion: 'Mr. Trámite está revisando tus documentos' },
  EN_PROCESO: { label: 'EN PROCESO', color: 'bg-purple-100 text-purple-700', descripcion: 'Estamos generando tu trámite' },
  LISTO_PARA_PAGO: { label: 'LISTO PARA PAGO', color: 'bg-emerald-100 text-emerald-700', descripcion: 'Tu cita está lista, procede a pagar' },
  PAGO_RECIBIDO: { label: 'PAGO RECIBIDO', color: 'bg-green-100 text-green-700', descripcion: 'Hemos recibido tu pago, finalizando trámite' },
  FINALIZADO: { label: 'FINALIZADO', color: 'bg-gray-200 text-gray-700', descripcion: 'Tu trámite está listo' },
  CANCELADO: { label: 'CANCELADO', color: 'bg-red-200 text-red-800', descripcion: 'Tu trámite fue cancelado' },
  ARCHIVADO: { label: 'ARCHIVADO', color: 'bg-gray-100 text-gray-500', descripcion: 'Expediente archivado' },
}

// Pasos del timeline para el cliente (simplificado)
const PASOS_CLIENTE = [
  { estado: 'NUEVO' as ExpedienteEstado, label: 'Solicitud recibida', icon: FileText },
  { estado: 'REVISION' as ExpedienteEstado, label: 'En revisión', icon: Clock },
  { estado: 'EN_PROCESO' as ExpedienteEstado, label: 'Generando trámite', icon: FileText },
  { estado: 'LISTO_PARA_PAGO' as ExpedienteEstado, label: 'Cita generada', icon: Calendar },
  { estado: 'PAGO_RECIBIDO' as ExpedienteEstado, label: 'Pago confirmado', icon: CreditCard },
  { estado: 'FINALIZADO' as ExpedienteEstado, label: 'Trámite finalizado', icon: CheckCircle2 },
]

export function ClientePortal() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [expediente, setExpediente] = useState<ExpedienteCliente | null>(null)
  const [loading, setLoading] = useState(true)

  const folio = (session?.user as any)?.folio

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user as any)?.role !== 'CLIENTE' || !folio) {
      toast.error('Acceso denegado')
      router.refresh()
    }
  }, [session, status, folio, router])

  const cargarExpediente = useCallback(async () => {
    if (!folio) return
    setLoading(true)
    try {
      const res = await fetch(`/api/expedientes/${folio}`)
      if (!res.ok) throw new Error('Error')
      const data = await res.json()
      setExpediente(data.expediente)
    } catch (e) {
      toast.error('Error al cargar tu expediente')
    } finally {
      setLoading(false)
    }
  }, [folio])

  useEffect(() => {
    if (folio) cargarExpediente()
  }, [folio, cargarExpediente])

  const handlePagar = () => {
    toast.info('Redirección a Mercado Pago', {
      description: 'En producción, aquí se generaría el link de pago de MP. Por ahora es simulado.',
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session || (session.user as any)?.role !== 'CLIENTE') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <h2 className="text-lg font-semibold">Acceso denegado</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Necesitas iniciar sesión como cliente con tu folio.
            </p>
            <Button onClick={() => router.refresh()} className="mt-4 bg-primary text-primary-foreground">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!expediente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">No se encontró tu expediente</p>
      </div>
    )
  }

  const estadoConfig = ESTADO_CONFIG[expediente.estado]
  const pasoActualIdx = PASOS_CLIENTE.findIndex((p) => p.estado === expediente.estado)
  const listoParaPagar = expediente.estado === 'LISTO_PARA_PAGO'
  const finalizado = expediente.estado === 'FINALIZADO'
  const pagoConfirmado = expediente.pagos.some((p) => p.estado === 'PAGADO')

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* HEADER */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="mx-auto max-w-3xl flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image src="/logo_icon.png" alt="Mr. Trámite" width={24} height={24} className="h-6 w-6 rounded-full" />
            <span className="text-sm font-semibold">Mr. Trámite</span>
            <Badge variant="outline" className="text-[10px] ml-1">Mi expediente</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="text-xs">
            <LogOut className="h-3.5 w-3.5 mr-1" />
            Salir
          </Button>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-3xl w-full px-4 py-6 space-y-4">
        {/* Saludo */}
        <div>
          <h1 className="text-xl font-bold">Hola, {expediente.cliente.nombreCompleto.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground">Este es el estado de tu trámite</p>
        </div>

        {/* Card principal con estado */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-muted-foreground">Folio</div>
                <div className="font-mono font-bold text-primary">{expediente.folio}</div>
              </div>
              <Badge className={`text-[10px] ${estadoConfig.color}`} variant="secondary">
                {estadoConfig.label}
              </Badge>
            </div>
            <div className="text-sm font-medium">{estadoConfig.descripcion}</div>
            <Separator className="my-3" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Trámite</div>
                <div className="font-medium">{expediente.tramiteTipo.nombre}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Costo</div>
                <div className="font-bold text-primary">${expediente.tramiteTipo.precio} MXN</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Solicitado</div>
                <div className="font-medium text-xs">{new Date(expediente.createdAt).toLocaleDateString('es-MX')}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Pago</div>
                <div className="font-medium text-xs">
                  {pagoConfirmado ? '✓ Confirmado' : listoParaPagar ? 'Pendiente' : 'No requerido aún'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline de pasos */}
        <Card>
          <CardContent className="pt-5">
            <h2 className="text-sm font-semibold mb-4">Avance de tu trámite</h2>
            <div className="space-y-1">
              {PASOS_CLIENTE.map((paso, i) => {
                const completado = i < pasoActualIdx
                const actual = i === pasoActualIdx
                const futuro = i > pasoActualIdx
                const Icon = paso.icon
                return (
                  <div key={paso.estado} className="flex items-center gap-3 py-2">
                    <div className={`
                      flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0
                      ${completado ? 'bg-primary text-primary-foreground' : ''}
                      ${actual ? 'bg-primary/20 text-primary ring-2 ring-primary' : ''}
                      ${futuro ? 'bg-muted text-muted-foreground' : ''}
                    `}>
                      {completado ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${futuro ? 'text-muted-foreground' : ''}`}>
                        {paso.label}
                      </div>
                      {actual && (
                        <div className="text-xs text-primary mt-0.5">En curso ahora</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* CTA de pago si está listo */}
        {listoParaPagar && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground flex-shrink-0">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">¡Tu cita está lista!</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Procede al pago de <strong>${expediente.tramiteTipo.precio} MXN</strong> para confirmar tu cita.
                  </p>
                  {expediente.citaFecha && (
                    <div className="mt-2 text-xs space-y-0.5 bg-card/50 rounded-md p-2 border border-border/50">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-primary" />
                        <span>{new Date(expediente.citaFecha).toLocaleString('es-MX')}</span>
                      </div>
                      {expediente.citaLugar && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span>{expediente.citaLugar}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <Button onClick={handlePagar} className="w-full mt-3 bg-primary text-primary-foreground" size="sm">
                    Pagar ${expediente.tramiteTipo.precio} MXN
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                    Pago seguro vía Mercado Pago · Tarjeta o transferencia
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cita confirmada */}
        {expediente.citaFecha && expediente.estado !== 'LISTO_PARA_PAGO' && (
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                Tu cita consular
              </h3>
              <div className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Fecha:</span> {new Date(expediente.citaFecha).toLocaleString('es-MX')}</div>
                <div><span className="text-muted-foreground">Lugar:</span> {expediente.citaLugar}</div>
                {expediente.citaDireccion && <div><span className="text-muted-foreground">Dirección:</span> {expediente.citaDireccion}</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documentos */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold text-sm mb-2">Tus documentos ({expediente.documentos.length})</h3>
            {expediente.documentos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay documentos cargados</p>
            ) : (
              <div className="space-y-1.5">
                {expediente.documentos.map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-sm border border-border/50 rounded-md p-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs">{d.tipo.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{d.fileName}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trámite finalizado */}
        {finalizado && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-5 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-semibold">¡Tu trámite está finalizado!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tu cita está confirmada. Revisa los detalles arriba.
              </p>
              <Button variant="outline" size="sm" className="mt-3">
                <Download className="h-3.5 w-3.5 mr-1" />
                Descargar documentos (próximamente)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info de confianza */}
        <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-xs text-foreground/70">
          <ShieldCheck className="inline h-3.5 w-3.5 mr-1 text-primary" />
          Tu dinero está protegido. Si tienes dudas, contáctanos por WhatsApp o Messenger.
        </div>

        {/* Historial de acciones */}
        {expediente.acciones.length > 0 && (
          <Card>
            <CardContent className="pt-5">
              <h3 className="font-semibold text-sm mb-2">Historial</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {expediente.acciones.slice(0, 5).map((a) => (
                  <div key={a.id} className="text-xs border-l-2 border-border pl-2 py-1">
                    <div className="font-medium">{a.descripcion}</div>
                    <div className="text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString('es-MX')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

function Separator({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-border ${className}`} />
}
