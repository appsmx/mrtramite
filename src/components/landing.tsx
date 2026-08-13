'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import {
  ShieldCheck,
  ClipboardList,
  Upload,
  CreditCard,
  Clock,
  FileCheck,
  Lock,
  Menu,
  MessageCircle,
  Mail,
  Instagram,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { LoginModal } from '@/components/login-modal'
import { AvisoPrivacidad } from '@/components/aviso-privacidad'
import { TerminosCondiciones } from '@/components/terminos-condiciones'

interface LandingProps {
  onStartTramite: () => void
}

export function Landing({ onStartTramite }: LandingProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [avisoOpen, setAvisoOpen] = useState(false)
  const [terminosOpen, setTerminosOpen] = useState(false)
  const searchParams = useSearchParams()

  // Mostrar toast cuando el cliente regresa de Mercado Pago
  useEffect(() => {
    const pagoStatus = searchParams.get('pago')
    const folio = searchParams.get('folio')
    if (!pagoStatus) return

    if (pagoStatus === 'success') {
      toast.success('¡Pago recibido!', {
        description: folio
          ? `Tu pago para el folio ${folio} está siendo procesado. Te avisaremos cuando se confirme.`
          : 'Tu pago está siendo procesado.',
      })
    } else if (pagoStatus === 'pending') {
      toast.info('Pago pendiente', {
        description: folio
          ? `Tu pago para ${folio} está pendiente. Te avisaremos cuando se complete.`
          : 'Tu pago está pendiente de confirmación.',
      })
    } else if (pagoStatus === 'failure') {
      toast.error('El pago no se completó', {
        description: folio
          ? `No se completó el pago para ${folio}. Puedes intentarlo nuevamente desde tu portal.`
          : 'Puedes intentarlo nuevamente desde tu portal.',
      })
    }
  }, [searchParams])

  const handleStartTramite = () => {
    onStartTramite()
  }

  const handleNavClick = (section: string) => {
    setMobileMenuOpen(false)
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleAvisoClick = () => {
    setAvisoOpen(true)
  }

  const handleTerminosClick = () => {
    setTerminosOpen(true)
  }

  const handleCancelacionClick = () => {
    setTerminosOpen(true)
  }

  return (
    <div className="flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Image
              src="/logo_horizontal.png"
              alt="Mr. Trámite — Gestoría profesional"
              width={140}
              height={32}
              priority
              className="h-8 w-auto sm:h-9"
            />
          </div>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-6 md:flex" aria-label="Navegación principal">
            <button
              onClick={() => handleNavClick('tramites')}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Trámites
            </button>
            <button
              onClick={() => handleNavClick('como-funciona')}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Cómo funciona
            </button>
            <button
              onClick={() => handleNavClick('confianza')}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Por qué confiar
            </button>
            <LoginModal
              trigger={
                <Button variant="ghost" size="sm">
                  Mi expediente
                </Button>
              }
            />
            <Button onClick={handleStartTramite} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Iniciar trámite
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </nav>

          {/* Nav mobile */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetTitle className="text-left">Menú</SheetTitle>
              <nav className="mt-6 flex flex-col gap-2" aria-label="Navegación móvil">
                <SheetClose asChild>
                  <Button variant="ghost" className="justify-start" onClick={() => handleNavClick('tramites')}>
                    Trámites
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button variant="ghost" className="justify-start" onClick={() => handleNavClick('como-funciona')}>
                    Cómo funciona
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button variant="ghost" className="justify-start" onClick={() => handleNavClick('confianza')}>
                    Por qué confiar
                  </Button>
                </SheetClose>
                <Separator className="my-2" />
                <LoginModal
                  defaultTab="cliente"
                  trigger={
                    <SheetClose asChild>
                      <Button variant="ghost" className="justify-start w-full">
                        Mi expediente
                      </Button>
                    </SheetClose>
                  }
                />
                <SheetClose asChild>
                  <Button onClick={handleStartTramite} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Iniciar trámite
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">
            <div className="flex flex-col items-center text-center">
              <Badge
                variant="secondary"
                className="mb-5 gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-primary"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                No pagas hasta tener tu cita confirmada
              </Badge>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                Gestiona tus trámites sin perder tiempo
              </h1>
              <p className="mt-4 max-w-2xl text-base text-foreground/70 sm:text-lg">
                Visa americana, pasaporte, licencia, INE y más. Mr. Trámite se encarga de todo el proceso por ti, con la confianza de pagar solo cuando veas tu cita confirmada.
              </p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <Button
                  onClick={handleStartTramite}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Iniciar trámite
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleNavClick('como-funciona')}
                >
                  Ver cómo funciona
                </Button>
              </div>
              <p className="mt-4 text-xs text-foreground/60">
                Sin pagos por adelantado · Respuesta en 24-48 hrs
              </p>
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section id="como-funciona" className="border-b border-border scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Cómo funciona</h2>
              <p className="mt-2 text-foreground/60">3 pasos simples</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <Card className="border-border bg-card text-center">
                <CardHeader className="pb-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-3 text-base">1. Selecciona tu trámite</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/70">
                    Elige el trámite que necesitas (visa, pasaporte, INE, etc.) y completa tus datos en el formulario guiado.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card text-center">
                <CardHeader className="pb-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Upload className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-3 text-base">2. Sube tus documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/70">
                    Adjunta los documentos necesarios. Nosotros los revisamos y generamos tu cita consular.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card text-center">
                <CardHeader className="pb-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-3 text-base">3. Paga cuando confirme tu cita</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/70">
                    Solo entonces pagas. Recibes la confirmación de cita y procedes al pago seguro.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* TRÁMITES DISPONIBLES */}
        <section id="tramites" className="border-b border-border bg-muted/30 scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Trámites disponibles</h2>
              <p className="mt-2 text-foreground/60">Precios claros, sin sorpresas</p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Visa Americana — activo */}
              <Card className="border-primary/30 bg-card shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Visa Americana de turista</CardTitle>
                    <Badge className="bg-primary/10 text-primary">Más solicitado</Badge>
                  </div>
                  <p className="text-xs text-foreground/60">Incluye DS-160 + cita consular</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-primary">$800</span>
                    <span className="ml-1 text-sm text-foreground/60">MXN</span>
                  </div>
                  <Button onClick={handleStartTramite} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Solicitar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              {/* Pasaporte — próximamente */}
              <Card className="border-border bg-card opacity-70">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Pasaporte Mexicano</CardTitle>
                    <Badge variant="outline">Próximamente</Badge>
                  </div>
                  <p className="text-xs text-foreground/60">Cita + requisitos SRE</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-2xl font-semibold text-foreground/50">$ --</span>
                  </div>
                  <Button variant="outline" disabled className="w-full">
                    No disponible
                  </Button>
                </CardContent>
              </Card>

              {/* Licencia / INE — próximamente */}
              <Card className="border-border bg-card opacity-70">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Licencia / INE</CardTitle>
                    <Badge variant="outline">Próximamente</Badge>
                  </div>
                  <p className="text-xs text-foreground/60">Otros trámites</p>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-2xl font-semibold text-foreground/50">$ --</span>
                  </div>
                  <Button variant="outline" disabled className="w-full">
                    No disponible
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* POR QUÉ CONFIAR */}
        <section id="confianza" className="border-b border-border scroll-mt-16">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Por qué confiar en Mr. Trámite</h2>
              <p className="mt-2 text-foreground/60">Tu dinero y tu tiempo están protegidos</p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">Pago post-confirmación</h3>
                <p className="mt-1 text-sm text-foreground/70">
                  No arriesgas tu dinero. Pagas solo cuando ves tu cita lista, con Mercado Pago o transferencia.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">Trazabilidad total</h3>
                <p className="mt-1 text-sm text-foreground/70">
                  Recibes confirmación de cada paso. Sabes en todo momento en qué estado está tu trámite.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">Datos protegidos</h3>
                <p className="mt-1 text-sm text-foreground/70">
                  Tus documentos se manejan bajo estricta confidencialidad, conforme a la LFPDPPP.
                </p>
              </div>
            </div>

            {/* Garantías adicionales */}
            <div className="mt-8 rounded-lg border border-primary/20 bg-primary/5 p-5">
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Sin pago anticipado</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Respuesta 24-48 hrs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Documentos cifrados</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-primary" />
                  <span>Cancelación con causa justificada</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* POLÍTICAS CLAVE */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Políticas claras</h2>
              <p className="mt-2 text-foreground/60">Sin letra chica</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <FileCheck className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 font-semibold">Si no pagas</h3>
                  <p className="mt-1 text-sm text-foreground/70">
                    La cita se cancela. No hay cargo para ti.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <FileCheck className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 font-semibold">Si tus documentos tienen errores tras pagar</h3>
                  <p className="mt-1 text-sm text-foreground/70">
                    $300 MXN por gestión de nueva cita.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <FileCheck className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 font-semibold">Si la cita se cancela por causa externa</h3>
                  <p className="mt-1 text-sm text-foreground/70">
                    50% del costo por gestión de nueva cita.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
            <div className="rounded-xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
              <h2 className="text-2xl font-bold sm:text-3xl">¿Listo para empezar?</h2>
              <p className="mx-auto mt-2 max-w-xl text-primary-foreground/80">
                Inicia tu trámite hoy mismo. No pagas nada hasta tener tu cita confirmada.
              </p>
              <Button
                onClick={handleStartTramite}
                size="lg"
                variant="secondary"
                className="mt-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                Iniciar mi trámite
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            {/* Marca */}
            <div>
              <div className="flex items-center gap-2">
                <Image
                  src="/logo_icon.png"
                  alt="Mr. Trámite"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full bg-background p-0.5"
                />
                <span className="text-lg font-semibold">Mr. Trámite</span>
              </div>
              <p className="mt-3 text-sm text-background/70">
                Gestoría profesional de trámites. Tu dinero protegido, tu tiempo valorado.
              </p>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-background/90">Contacto</h3>
              <ul className="mt-3 space-y-2 text-sm text-background/70">
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Messenger (Facebook)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  <span>Instagram</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>contacto@mrtramite.mx</span>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-background/90">Legal</h3>
              <ul className="mt-3 space-y-2 text-sm text-background/70">
                <li>
                  <button
                    className="text-background/70 hover:text-background hover:underline"
                    onClick={handleAvisoClick}
                  >
                    Aviso de Privacidad (LFPDPPP)
                  </button>
                </li>
                <li>
                  <button
                    className="text-background/70 hover:text-background hover:underline"
                    onClick={handleTerminosClick}
                  >
                    Términos y condiciones
                  </button>
                </li>
                <li>
                  <button
                    className="text-background/70 hover:text-background hover:underline"
                    onClick={handleCancelacionClick}
                  >
                    Política de cancelación
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-6 bg-background/20" />

          <div className="flex flex-col items-center justify-between gap-4 text-xs text-background/60 sm:flex-row">
            <p>© 2026 Mr. Trámite. Todos los derechos reservados.</p>

            {/* Sello LOGAN */}
            <a
              id="logan-seal"
              href="https://logancorp.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              title="Sitio creado con la metodología LOGAN"
              aria-label="Sello LOGAN — Creado con la metodología LOGAN"
              className="group relative inline-flex items-center gap-2.5 rounded-full border border-background/15 bg-background/5 px-3.5 py-2 transition-all duration-300 hover:bg-background/10 hover:border-amber-400/40 hover:shadow-[0_0_20px_-2px_rgba(251,191,36,0.4)]"
            >
              {/* Avatar con gradiente ámbar */}
              <span className="relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 font-black text-foreground text-sm shadow-inner">
                L
                {/* Anillo exterior que se ilumina al hover */}
                <span className="absolute inset-0 rounded-full border border-amber-300/40 opacity-50 transition-opacity group-hover:opacity-100" />
                {/* Brillo giratorio al hover */}
                <span className="absolute inset-[-3px] rounded-full bg-gradient-to-tr from-amber-400 via-transparent to-amber-300 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-60" />
              </span>

              {/* Texto */}
              <span className="flex flex-col leading-none">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/90">
                  Creado con
                </span>
                <span className="text-sm font-bold text-background">LOGAN</span>
              </span>

              {/* Punto verde "metodología activa" con pulse */}
              <span className="relative hidden sm:inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 ml-0.5" title="Metodología activa">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              </span>
            </a>

            <p>Hecho en México 🇲🇽</p>
          </div>
        </div>
      </footer>

      {/* Modales legales */}
      <AvisoPrivacidad open={avisoOpen} onOpenChange={setAvisoOpen} />
      <TerminosCondiciones open={terminosOpen} onOpenChange={setTerminosOpen} />
    </div>
  )
}
