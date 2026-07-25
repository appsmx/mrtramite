'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Save, X, CheckCircle2, ShieldCheck, Upload, FileText, AlertTriangle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { initialWizardData, type WizardData, type RedSocial, type Hijo, type FamiliarEEUU, type PaisVisitado, TOTAL_STEPS, STEP_TITLES } from './types'
import { TextField, TextAreaField, SelectField, BooleanField, RepeatableList, StepDivider, InfoNote } from './fields'
import { AvisoPrivacidad } from '@/components/aviso-privacidad'
import { TerminosCondiciones } from '@/components/terminos-condiciones'

const STORAGE_KEY = 'mrtramite_wizard_v1'
const STEP_KEY = 'mrtramite_wizard_step_v1'
const genId = () => Math.random().toString(36).slice(2, 11)

interface WizardProps {
  onExit: () => void
}

function loadInitialData(): WizardData {
  if (typeof window === 'undefined') return initialWizardData
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return { ...initialWizardData, ...JSON.parse(saved) }
    }
  } catch {
    // ignore
  }
  return initialWizardData
}

function loadInitialStep(): number {
  if (typeof window === 'undefined') return 0
  try {
    const saved = localStorage.getItem(STEP_KEY)
    if (saved) {
      const step = parseInt(saved, 10)
      if (!isNaN(step) && step >= 0 && step < TOTAL_STEPS) {
        return step
      }
    }
  } catch {
    // ignore
  }
  return 0
}

export function Wizard({ onExit }: WizardProps) {
  const [step, setStep] = useState(loadInitialStep) // 0-indexed, 0-9
  const [data, setData] = useState<WizardData>(loadInitialData)
  const [submitted, setSubmitted] = useState(false)
  const [folio, setFolio] = useState<string>('')
  const [avisoOpen, setAvisoOpen] = useState(false)
  const [terminosOpen, setTerminosOpen] = useState(false)

  // Guardar en localStorage
  const save = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      toast.success('Progreso guardado', { duration: 1500 })
    } catch {
      toast.error('No se pudo guardar el progreso')
    }
  }, [data])

  const update = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  // Subir documento (usa updater para evitar race conditions)
  const addDocumento = (tipo: string, file: File) => {
    setData((prev) => {
      const existing = prev.documentos.filter((d) => d.tipo !== tipo)
      return {
        ...prev,
        documentos: [...existing, { id: genId(), tipo, fileName: file.name, fileSize: file.size }],
      }
    })
    toast.success(`${file.name} subido`)
  }

  const removeDocumento = (tipo: string) => {
    setData((prev) => ({ ...prev, documentos: prev.documentos.filter((d) => d.tipo !== tipo) }))
  }

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return true // selección de trámite
      case 1: return data.tienePasaporteVigente === true
      case 2:
        return !!(data.nombreCompleto && data.sexo && data.fechaNacimiento && data.lugarNacimiento && data.curp && data.telefono && data.email)
      case 3:
        return !!(data.calle && data.colonia && data.ciudad && data.estadoMexico && data.codigoPostal && data.estadoCivil && data.nombrePadre && data.nombreMadre)
      case 4: return data.tieneFamiliaresDirectosUS !== null && data.tieneOtrosParientesUS !== null
      case 5:
        return !!(data.situacionLaboral && (data.situacionLaboral === 'DESEMPLEADO' || data.situacionLaboral === 'JUBILADO' || (data.nombreEmpresa && data.telefonoEmpresa && data.fechaIngresoEmpresa && data.ingresoMensual && data.descripcionActividades)))
      case 6: return true // académica (todos los booleanos tienen default false)
      case 7:
        return data.haVisitadoOtrosPaises !== null && data.haTenidoVisaAnterior !== null && data.haSidoNegadaVisa !== null && data.haSidoNegadoIngresoUS !== null && data.haTrabajadoIlegalUS !== null
      case 8:
        // Al menos pasaporte, acta y foto
        const tipos = data.documentos.map((d) => d.tipo)
        return tipos.includes('PASAPORTE') && tipos.includes('ACTA_NACIMIENTO') && tipos.includes('FOTO_PASAPORTE')
      case 9:
        return data.aceptaAvisoPrivacidad && data.aceptaTerminos && !!data.canalPreferido
      default: return false
    }
  }

  const handleNext = () => {
    if (!canAdvance()) {
      toast.error('Completa los campos requeridos para continuar')
      return
    }
    if (step < TOTAL_STEPS - 1) {
      const newStep = step + 1
      setStep(newStep)
      try { localStorage.setItem(STEP_KEY, String(newStep)) } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 0) {
      const newStep = step - 1
      setStep(newStep)
      try { localStorage.setItem(STEP_KEY, String(newStep)) } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    // Llamar a la API para crear el expediente
    try {
      const response = await fetch('/api/expedientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      const result = await response.json()
      setFolio(result.folio)
      setSubmitted(true)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STEP_KEY)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      toast.error('Error al enviar solicitud', {
        description: error instanceof Error ? error.message : 'Intenta nuevamente',
      })
    }
  }

  if (submitted) {
    return <SuccessScreen folio={folio} data={data} onExit={onExit} />
  }

  const stepTitle = STEP_TITLES[step]

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Image src="/logo_icon.png" alt="Mr. Trámite" width={28} height={28} className="h-7 w-7 rounded-full" />
            <span className="text-sm font-semibold">Mr. Trámite</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={save} className="text-xs">
              <Save className="h-3.5 w-3.5 mr-1" />
              Guardar
            </Button>
            <Button variant="ghost" size="sm" onClick={onExit} className="text-xs text-muted-foreground">
              <X className="h-3.5 w-3.5 mr-1" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < step ? 'bg-primary' : i === step ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Paso {step + 1} de {TOTAL_STEPS} — {stepTitle}</span>
            <span className="flex items-center gap-1">
              <Save className="h-3 w-3" />
              Tu progreso se guarda
            </span>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <StepContent step={step} data={data} update={update} addDocumento={addDocumento} removeDocumento={removeDocumento} onOpenAviso={() => setAvisoOpen(true)} onOpenTerminos={() => setTerminosOpen(true)} />
        </div>
      </main>

      {/* FOOTER CON BOTONES */}
      <footer className="sticky bottom-0 border-t border-border bg-background">
        <div className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
          {step > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Atrás
            </Button>
          )}
          <Button onClick={handleNext} disabled={!canAdvance()} className="flex-[2] bg-primary text-primary-foreground hover:bg-primary/90">
            {step === TOTAL_STEPS - 1 ? (
              <>
                Enviar solicitud
                <CheckCircle2 className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </footer>

      {/* Modales legales */}
      <AvisoPrivacidad open={avisoOpen} onOpenChange={setAvisoOpen} />
      <TerminosCondiciones open={terminosOpen} onOpenChange={setTerminosOpen} />
    </div>
  )
}

// ============================================================================
// CONTENIDO DE CADA PASO
// ============================================================================

function StepContent({ step, data, update, addDocumento, removeDocumento, onOpenAviso, onOpenTerminos }: {
  step: number
  data: WizardData
  update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void
  addDocumento: (tipo: string, file: File) => void
  removeDocumento: (tipo: string) => void
  onOpenAviso: () => void
  onOpenTerminos: () => void
}) {
  switch (step) {
    case 0: return <Step1Tramite data={data} update={update} />
    case 1: return <Step2Prerequisitos data={data} update={update} />
    case 2: return <Step3DatosPersonales data={data} update={update} />
    case 3: return <Step4DomicilioFamilia data={data} update={update} />
    case 4: return <Step5FamiliaresEEUU data={data} update={update} />
    case 5: return <Step6Laboral data={data} update={update} />
    case 6: return <Step7Academica data={data} update={update} />
    case 7: return <Step8ViajesVisas data={data} update={update} />
    case 8: return <Step9Documentos data={data} addDocumento={addDocumento} removeDocumento={removeDocumento} />
    case 9: return <Step10Revision data={data} update={update} onOpenAviso={onOpenAviso} onOpenTerminos={onOpenTerminos} />
    default: return null
  }
}

// --- Paso 1: Selección de trámite ---
function Step1Tramite({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  const tramites = [
    { codigo: 'VISA', nombre: 'Visa Americana de turista', desc: 'Incluye DS-160 + cita consular', precio: 800, activo: true, badge: 'Más solicitado' },
    { codigo: 'PASAP', nombre: 'Pasaporte Mexicano', desc: 'Cita + requisitos SRE', precio: null, activo: false },
    { codigo: 'LIC', nombre: 'Licencia de conducir', desc: 'Otros trámites', precio: null, activo: false },
    { codigo: 'INE', nombre: 'INE', desc: 'Otros trámites', precio: null, activo: false },
  ]
  return (
    <div className="space-y-4">
      <StepHeader title="¿Qué trámite necesitas?" subtitle="Selecciona el trámite que quieres gestionar" />
      <div className="space-y-2">
        {tramites.map((t) => (
          <button
            key={t.codigo}
            type="button"
            disabled={!t.activo}
            onClick={() => t.activo && update('tramiteCodigo', t.codigo)}
            className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
              !t.activo ? 'cursor-not-allowed opacity-50' : ''
            } ${
              data.tramiteCodigo === t.codigo
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{t.nombre}</span>
                  {t.badge && <Badge className="bg-primary/10 text-primary text-[10px]">{t.badge}</Badge>}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.desc}</p>
              </div>
              <div className="text-right">
                {t.precio !== null ? (
                  <span className="font-bold text-primary">${t.precio}</span>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Próximamente</Badge>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// --- Paso 2: Prerequisitos ---
function Step2Prerequisitos({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  return (
    <div className="space-y-4">
      <StepHeader title="Antes de continuar" subtitle="Requisito obligatorio para Visa Americana" />
      <InfoNote variant="warning">
        <AlertTriangle className="inline h-3.5 w-3.5 mr-1" />
        <strong>Requisito fundacional:</strong> Para tramitar la Visa Americana de turista, debes contar con <strong>pasaporte mexicano vigente</strong> al momento de realizar la cita. Mínimo 6 meses de vigencia.
      </InfoNote>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => update('tienePasaporteVigente', true)}
          className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
            data.tienePasaporteVigente === true ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
              data.tienePasaporteVigente === true ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
            }`}>
              {data.tienePasaporteVigente === true && <CheckCircle2 className="h-3 w-3" />}
            </div>
            <div>
              <div className="font-semibold text-sm">Tengo pasaporte mexicano vigente</div>
              <p className="mt-0.5 text-xs text-muted-foreground">Con vigencia mínima de 6 meses a partir de la fecha de la cita.</p>
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={() => update('tienePasaporteVigente', false)}
          className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
            data.tienePasaporteVigente === false ? 'border-destructive bg-destructive/5' : 'border-border hover:border-destructive/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
              data.tienePasaporteVigente === false ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-border'
            }`}>
              {data.tienePasaporteVigente === false && <CheckCircle2 className="h-3 w-3" />}
            </div>
            <div>
              <div className="font-semibold text-sm">No tengo pasaporte vigente</div>
              <p className="mt-0.5 text-xs text-muted-foreground">Te sugerimos tramitar primero tu pasaporte. Mr. Trámite también lo gestiona.</p>
            </div>
          </div>
        </button>
      </div>
      {data.tienePasaporteVigente === false && (
        <InfoNote variant="warning">
          Para tramitar la visa necesitas pasaporte vigente. Si no lo tienes, contáctanos por WhatsApp para ayudarte a tramitarlo primero.
        </InfoNote>
      )}
    </div>
  )
}

// --- Paso 3: Datos personales (sin pasaporte - DEC-017) ---
function Step3DatosPersonales({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  const addRed = () => update('redesSociales', [...data.redesSociales, { id: genId(), plataforma: '', usuario: '' }])
  const removeRed = (id: string) => update('redesSociales', data.redesSociales.filter((r) => r.id !== id))
  const updateRed = (id: string, field: keyof RedSocial, value: string) =>
    update('redesSociales', data.redesSociales.map((r) => (r.id === id ? { ...r, [field]: value } : r)))

  return (
    <div className="space-y-4">
      <StepHeader title="Tus datos personales" subtitle="Categorías 2, 3, 4, 5 del DS-160" />
      <StepDivider label="Datos personales" />
      <TextField label="Nombre completo (como en pasaporte)" value={data.nombreCompleto} onChange={(v) => update('nombreCompleto', v)} required placeholder="Ej: Juan Pérez García" />
      <TextField label="Otros nombres usados (opcional)" value={data.otrosNombres} onChange={(v) => update('otrosNombres', v)} placeholder="Apodos, nombres anteriores" />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Sexo" value={data.sexo} onChange={(v) => update('sexo', v as WizardData['sexo'])} required options={[
          { value: 'MASCULINO', label: 'Masculino' },
          { value: 'FEMENINO', label: 'Femenino' },
          { value: 'OTRO', label: 'Otro' },
        ]} />
        <TextField label="Fecha de nacimiento" value={data.fechaNacimiento} onChange={(v) => update('fechaNacimiento', v)} required type="date" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Lugar de nacimiento (ciudad)" value={data.lugarNacimiento} onChange={(v) => update('lugarNacimiento', v)} required placeholder="Ciudad" />
        <TextField label="CURP" value={data.curp} onChange={(v) => update('curp', v.toUpperCase())} required placeholder="18 caracteres" maxLength={18} />
      </div>
      <InfoNote variant="success">
        <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
        <strong>No te pedimos datos del pasaporte aquí.</strong> Los extraeremos automáticamente de la foto que subas en el paso 9.
      </InfoNote>
      <StepDivider label="Teléfono y correo" />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Teléfono / WhatsApp" value={data.telefono} onChange={(v) => update('telefono', v)} required type="tel" placeholder="+52 55 1234 5678" />
        <TextField label="Correo electrónico" value={data.email} onChange={(v) => update('email', v)} required type="email" placeholder="tu@email.com" />
      </div>
      <StepDivider label="Redes sociales (últimos 5 años)" />
      <RepeatableList<RedSocial>
        items={data.redesSociales}
        onAdd={addRed}
        onRemove={removeRed}
        addLabel="Agregar otra red social"
        renderItem={(item) => (
          <div className="grid grid-cols-2 gap-3 pr-6">
            <SelectField label="Plataforma" value={item.plataforma} onChange={(v) => updateRed(item.id, 'plataforma', v)} options={[
              { value: 'FACEBOOK', label: 'Facebook' },
              { value: 'INSTAGRAM', label: 'Instagram' },
              { value: 'TWITTER', label: 'Twitter/X' },
              { value: 'LINKEDIN', label: 'LinkedIn' },
              { value: 'TIKTOK', label: 'TikTok' },
              { value: 'YOUTUBE', label: 'YouTube' },
              { value: 'OTRO', label: 'Otra' },
            ]} />
            <TextField label="Usuario / Handle" value={item.usuario} onChange={(v) => updateRed(item.id, 'usuario', v)} placeholder="@usuario" />
          </div>
        )}
      />
      <InfoNote variant="info">
        <Lock className="inline h-3.5 w-3.5 mr-1" />
        Solo solicitamos datos estrictamente necesarios. LFPDPPP — minimización.
      </InfoNote>
    </div>
  )
}

// --- Paso 4: Domicilio + estado civil + padres ---
function Step4DomicilioFamilia({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  const addHijo = () => update('hijos', [...data.hijos, { id: genId(), nombre: '', fechaNacimiento: '', viveEnUS: false }])
  const removeHijo = (id: string) => update('hijos', data.hijos.filter((h) => h.id !== id))
  const updateHijo = (id: string, field: keyof Hijo, value: string | boolean) =>
    update('hijos', data.hijos.map((h) => (h.id === id ? { ...h, [field]: value } : h)))

  return (
    <div className="space-y-4">
      <StepHeader title="Domicilio y familia" subtitle="Categorías 6, 7, 8 del DS-160" />
      <StepDivider label="Domicilio" />
      <TextField label="Calle y número" value={data.calle} onChange={(v) => update('calle', v)} required placeholder="Ej: Av. Reforma 123" />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Colonia" value={data.colonia} onChange={(v) => update('colonia', v)} required />
        <TextField label="Código postal" value={data.codigoPostal} onChange={(v) => update('codigoPostal', v)} required maxLength={5} placeholder="5 dígitos" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Ciudad" value={data.ciudad} onChange={(v) => update('ciudad', v)} required />
        <SelectField label="Estado" value={data.estadoMexico} onChange={(v) => update('estadoMexico', v)} required options={ESTADOS_MEXICO.map((e) => ({ value: e, label: e }))} />
      </div>
      <StepDivider label="Estado civil" />
      <SelectField label="Estado civil" value={data.estadoCivil} onChange={(v) => update('estadoCivil', v as WizardData['estadoCivil'])} required options={[
        { value: 'SOLTERO', label: 'Soltero/a' },
        { value: 'CASADO', label: 'Casado/a' },
        { value: 'UNION_LIBRE', label: 'Unión libre' },
        { value: 'DIVORCIADO', label: 'Divorciado/a' },
        { value: 'VIUDO', label: 'Viudo/a' },
      ]} />
      {(data.estadoCivil === 'CASADO' || data.estadoCivil === 'UNION_LIBRE') && (
        <>
          <StepDivider label="Cónyuge" />
          <TextField label="Nombre completo del cónyuge" value={data.nombreConyuge} onChange={(v) => update('nombreConyuge', v)} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Fecha de nacimiento" value={data.fechaNacConyuge} onChange={(v) => update('fechaNacConyuge', v)} type="date" />
            <BooleanField label="¿Vive en EE.UU.?" value={data.conyugeViveUS} onChange={(v) => update('conyugeViveUS', v)} />
          </div>
        </>
      )}
      <StepDivider label="Hijos" />
      <RepeatableList<Hijo>
        items={data.hijos}
        onAdd={addHijo}
        onRemove={removeHijo}
        addLabel="Agregar hijo"
        renderItem={(item) => (
          <div className="space-y-2 pr-6">
            <TextField label="Nombre completo" value={item.nombre} onChange={(v) => updateHijo(item.id, 'nombre', v)} />
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Fecha de nacimiento" value={item.fechaNacimiento} onChange={(v) => updateHijo(item.id, 'fechaNacimiento', v)} type="date" />
              <BooleanField label="¿Vive en EE.UU.?" value={item.viveEnUS} onChange={(v) => updateHijo(item.id, 'viveEnUS', v)} />
            </div>
          </div>
        )}
      />
      <StepDivider label="Padres" />
      <TextField label="Nombre completo del padre" value={data.nombrePadre} onChange={(v) => update('nombrePadre', v)} required />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Fecha de nacimiento" value={data.fechaNacPadre} onChange={(v) => update('fechaNacPadre', v)} type="date" />
        <BooleanField label="¿Vive en EE.UU.?" value={data.padreViveUS} onChange={(v) => update('padreViveUS', v)} />
      </div>
      <TextField label="Nombre completo de la madre" value={data.nombreMadre} onChange={(v) => update('nombreMadre', v)} required />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Fecha de nacimiento" value={data.fechaNacMadre} onChange={(v) => update('fechaNacMadre', v)} type="date" />
        <BooleanField label="¿Vive en EE.UU.?" value={data.madreViveUS} onChange={(v) => update('madreViveUS', v)} />
      </div>
    </div>
  )
}

// --- Paso 5: Familiares en EE.UU. ---
function Step5FamiliaresEEUU({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  const addDirecto = () => update('familiaresDirectos', [...data.familiaresDirectos, { id: genId(), nombre: '', parentesco: '', estatusMigratorio: '' }])
  const removeDirecto = (id: string) => update('familiaresDirectos', data.familiaresDirectos.filter((f) => f.id !== id))
  const updateDirecto = (id: string, field: keyof FamiliarEEUU, value: string) =>
    update('familiaresDirectos', data.familiaresDirectos.map((f) => (f.id === id ? { ...f, [field]: value } : f)))

  const addOtro = () => update('otrosParientes', [...data.otrosParientes, { id: genId(), nombre: '', parentesco: '', estatusMigratorio: '' }])
  const removeOtro = (id: string) => update('otrosParientes', data.otrosParientes.filter((f) => f.id !== id))
  const updateOtro = (id: string, field: keyof FamiliarEEUU, value: string) =>
    update('otrosParientes', data.otrosParientes.map((f) => (f.id === id ? { ...f, [field]: value } : f)))

  return (
    <div className="space-y-4">
      <StepHeader title="Familiares en EE.UU." subtitle="Categorías 9 y 10 del DS-160" />
      <StepDivider label="Familiares directos" />
      <p className="text-xs text-muted-foreground">Padre, madre, hijo/a, hermano/a, esposo/a, prometido/a</p>
      <BooleanField label="¿Tiene familiares directos en EE.UU.?" value={data.tieneFamiliaresDirectosUS} onChange={(v) => update('tieneFamiliaresDirectosUS', v)} required />
      {data.tieneFamiliaresDirectosUS === true && (
        <RepeatableList<FamiliarEEUU>
          items={data.familiaresDirectos}
          onAdd={addDirecto}
          onRemove={removeDirecto}
          addLabel="Agregar familiar directo"
          renderItem={(item) => (
            <div className="space-y-2 pr-6">
              <TextField label="Nombre completo" value={item.nombre} onChange={(v) => updateDirecto(item.id, 'nombre', v)} />
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Parentesco" value={item.parentesco} onChange={(v) => updateDirecto(item.id, 'parentesco', v)} options={[
                  { value: 'PADRE', label: 'Padre' },
                  { value: 'MADRE', label: 'Madre' },
                  { value: 'HIJO', label: 'Hijo/a' },
                  { value: 'HERMANO', label: 'Hermano/a' },
                  { value: 'CONYUGE', label: 'Cónyuge' },
                  { value: 'PROMETIDO', label: 'Prometido/a' },
                  { value: 'OTRO', label: 'Otro' },
                ]} />
                <SelectField label="Estatus migratorio" value={item.estatusMigratorio} onChange={(v) => updateDirecto(item.id, 'estatusMigratorio', v)} options={[
                  { value: 'CIUDADANO', label: 'Ciudadano' },
                  { value: 'RESIDENTE', label: 'Residente' },
                  { value: 'NO_INMIGRANTE', label: 'No inmigrante' },
                  { value: 'INDOCUMENTADO', label: 'Indocumentado' },
                  { value: 'NO_SABE', label: 'No sabe' },
                ]} />
              </div>
            </div>
          )}
        />
      )}
      <StepDivider label="Otros parientes" />
      <p className="text-xs text-muted-foreground">Tíos, primos, abuelos, etc.</p>
      <BooleanField label="¿Tiene otros parientes en EE.UU.?" value={data.tieneOtrosParientesUS} onChange={(v) => update('tieneOtrosParientesUS', v)} required />
      {data.tieneOtrosParientesUS === true && (
        <RepeatableList<FamiliarEEUU>
          items={data.otrosParientes}
          onAdd={addOtro}
          onRemove={removeOtro}
          addLabel="Agregar otro pariente"
          renderItem={(item) => (
            <div className="space-y-2 pr-6">
              <TextField label="Nombre completo" value={item.nombre} onChange={(v) => updateOtro(item.id, 'nombre', v)} />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Parentesco" value={item.parentesco} onChange={(v) => updateOtro(item.id, 'parentesco', v)} placeholder="Ej: Tío, primo, etc." />
                <SelectField label="Estatus migratorio" value={item.estatusMigratorio} onChange={(v) => updateOtro(item.id, 'estatusMigratorio', v)} options={[
                  { value: 'CIUDADANO', label: 'Ciudadano' },
                  { value: 'RESIDENTE', label: 'Residente' },
                  { value: 'NO_INMIGRANTE', label: 'No inmigrante' },
                  { value: 'INDOCUMENTADO', label: 'Indocumentado' },
                  { value: 'NO_SABE', label: 'No sabe' },
                ]} />
              </div>
            </div>
          )}
        />
      )}
    </div>
  )
}

// --- Paso 6: Información laboral ---
function Step6Laboral({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  const requiereEmpresa = data.situacionLaboral === 'EMPLEADO' || data.situacionLaboral === 'INDEPENDIENTE'
  return (
    <div className="space-y-4">
      <StepHeader title="Información laboral" subtitle="Categoría 11 del DS-160" />
      <SelectField label="Situación laboral" value={data.situacionLaboral} onChange={(v) => update('situacionLaboral', v as WizardData['situacionLaboral'])} required options={[
        { value: 'EMPLEADO', label: 'Empleado' },
        { value: 'INDEPENDIENTE', label: 'Independiente / Negocio propio' },
        { value: 'ESTUDIANTE', label: 'Estudiante' },
        { value: 'DESEMPLEADO', label: 'Desempleado' },
        { value: 'JUBILADO', label: 'Jubilado' },
      ]} />
      {requiereEmpresa && (
        <>
          <StepDivider label="Empleo actual" />
          <TextField label="Nombre de la empresa" value={data.nombreEmpresa} onChange={(v) => update('nombreEmpresa', v)} required />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Teléfono" value={data.telefonoEmpresa} onChange={(v) => update('telefonoEmpresa', v)} required type="tel" />
            <TextField label="Fecha de ingreso" value={data.fechaIngresoEmpresa} onChange={(v) => update('fechaIngresoEmpresa', v)} required type="date" />
          </div>
          <TextField label="Dirección de la empresa" value={data.direccionEmpresa} onChange={(v) => update('direccionEmpresa', v)} required />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Ingreso mensual (MXN)" value={data.ingresoMensual} onChange={(v) => update('ingresoMensual', v)} required type="number" placeholder="$" />
          </div>
          <TextAreaField label="Descripción de actividades / funciones" value={data.descripcionActividades} onChange={(v) => update('descripcionActividades', v)} required placeholder="Describe tu puesto, responsabilidades, etc." rows={3} />
        </>
      )}
      {data.situacionLaboral === 'ESTUDIANTE' && (
        <InfoNote variant="info">
          Como estudiante, completa la información académica en el siguiente paso con más detalle.
        </InfoNote>
      )}
    </div>
  )
}

// --- Paso 7: Información académica ---
function Step7Academica({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  const updateNivel = (id: string, field: keyof WizardData['nivelesAcademicos'][0], value: string | boolean) =>
    update('nivelesAcademicos', data.nivelesAcademicos.map((n) => (n.id === id ? { ...n, [field]: value } : n)))

  return (
    <div className="space-y-4">
      <StepHeader title="Información académica" subtitle="Categoría 12 del DS-160" />
      {data.nivelesAcademicos.map((nivel) => (
        <div key={nivel.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold capitalize">{nivel.nivel.toLowerCase()}</h3>
            <div className="flex items-center gap-2">
              <Checkbox id={`estudio-${nivel.id}`} checked={nivel.estudio} onCheckedChange={(v) => updateNivel(nivel.id, 'estudio', v === true)} />
              <Label htmlFor={`estudio-${nivel.id}`} className="text-xs cursor-pointer">Estudié este nivel</Label>
            </div>
          </div>
          {nivel.estudio && (
            <div className="space-y-3">
              <TextField label="Nombre de la escuela" value={nivel.nombreEscuela} onChange={(v) => updateNivel(nivel.id, 'nombreEscuela', v)} />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Fecha de ingreso" value={nivel.fechaIngreso} onChange={(v) => updateNivel(nivel.id, 'fechaIngreso', v)} type="date" />
                <TextField label="Fecha de terminación" value={nivel.fechaTerminacion} onChange={(v) => updateNivel(nivel.id, 'fechaTerminacion', v)} type="date" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Teléfono" value={nivel.telefono} onChange={(v) => updateNivel(nivel.id, 'telefono', v)} type="tel" />
                <TextField label="Domicilio" value={nivel.domicilio} onChange={(v) => updateNivel(nivel.id, 'domicilio', v)} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// --- Paso 8: Viajes y visas previas ---
function Step8ViajesVisas({ data, update }: { data: WizardData; update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void }) {
  const addPais = () => update('paisesVisitados', [...data.paisesVisitados, { id: genId(), pais: '', fecha: '', duracionDias: '' }])
  const removePais = (id: string) => update('paisesVisitados', data.paisesVisitados.filter((p) => p.id !== id))
  const updatePais = (id: string, field: keyof PaisVisitado, value: string) =>
    update('paisesVisitados', data.paisesVisitados.map((p) => (p.id === id ? { ...p, [field]: value } : p)))

  return (
    <div className="space-y-4">
      <StepHeader title="Viajes y visas previas" subtitle="Categoría 13 del DS-160" />
      <StepDivider label="Viajes en los últimos 5 años" />
      <BooleanField label="¿Ha visitado otros países en los últimos 5 años?" value={data.haVisitadoOtrosPaises} onChange={(v) => update('haVisitadoOtrosPaises', v)} required />
      {data.haVisitadoOtrosPaises === true && (
        <RepeatableList<PaisVisitado>
          items={data.paisesVisitados}
          onAdd={addPais}
          onRemove={removePais}
          addLabel="Agregar país visitado"
          renderItem={(item) => (
            <div className="space-y-2 pr-6">
              <SelectField label="País visitado" value={item.pais} onChange={(v) => updatePais(item.id, 'pais', v)} options={PAISES_COMUNES.map((p) => ({ value: p, label: p }))} />
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Fecha del viaje" value={item.fecha} onChange={(v) => updatePais(item.id, 'fecha', v)} type="date" />
                <TextField label="Duración (días)" value={item.duracionDias} onChange={(v) => updatePais(item.id, 'duracionDias', v)} type="number" />
              </div>
            </div>
          )}
        />
      )}
      <StepDivider label="Visa americana anterior" />
      <BooleanField label="¿Ha tenido visa americana anteriormente?" value={data.haTenidoVisaAnterior} onChange={(v) => update('haTenidoVisaAnterior', v)} required />
      {data.haTenidoVisaAnterior === true && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Tipo de visa" value={data.tipoVisaAnterior} onChange={(v) => update('tipoVisaAnterior', v)} options={[
              { value: 'B1', label: 'B1 (negocios)' },
              { value: 'B2', label: 'B2 (turista)' },
              { value: 'B1B2', label: 'B1/B2 (combinada)' },
              { value: 'F1', label: 'F1 (estudiante)' },
              { value: 'J1', label: 'J1 (intercambio)' },
              { value: 'H1B', label: 'H1B (trabajo)' },
              { value: 'L1', label: 'L1 (traslado)' },
              { value: 'OTRA', label: 'Otra' },
            ]} />
            <TextField label="Número de visa anterior" value={data.numeroVisaAnterior} onChange={(v) => update('numeroVisaAnterior', v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Fecha de emisión" value={data.fechaEmisionVisaAnterior} onChange={(v) => update('fechaEmisionVisaAnterior', v)} type="date" />
            <TextField label="Fecha de expiración" value={data.fechaExpiracionVisaAnterior} onChange={(v) => update('fechaExpiracionVisaAnterior', v)} type="date" />
          </div>
          <BooleanField label="¿La visa fue cancelada o revocada?" value={data.visaCanceladaRevocada} onChange={(v) => update('visaCanceladaRevocada', v)} />
        </>
      )}
      <StepDivider label="Negación de visa" />
      <BooleanField label="¿Le han negado una visa antes?" value={data.haSidoNegadaVisa} onChange={(v) => update('haSidoNegadaVisa', v)} required />
      {data.haSidoNegadaVisa === true && (
        <>
          <TextField label="Fecha de negación" value={data.fechaNegacionVisa} onChange={(v) => update('fechaNegacionVisa', v)} type="date" />
          <TextAreaField label="Motivo de negación" value={data.motivoNegacionVisa} onChange={(v) => update('motivoNegacionVisa', v)} placeholder="Describe si aplica" rows={2} />
        </>
      )}
      <BooleanField label="¿Ha sido negado ingreso a EE.UU.?" value={data.haSidoNegadoIngresoUS} onChange={(v) => update('haSidoNegadoIngresoUS', v)} required />
      <BooleanField label="¿Ha trabajado ilegalmente en EE.UU.?" value={data.haTrabajadoIlegalUS} onChange={(v) => update('haTrabajadoIlegalUS', v)} required />
    </div>
  )
}

// --- Paso 9: Carga de documentos ---
function Step9Documentos({ data, addDocumento, removeDocumento }: {
  data: WizardData
  addDocumento: (tipo: string, file: File) => void
  removeDocumento: (tipo: string) => void
}) {
  const docTypes = [
    { tipo: 'PASAPORTE', label: 'Pasaporte vigente (página de datos)', required: true, nota: '💡 De aquí extraeremos automáticamente: número, fechas y país emisor. No los escribiste antes (DEC-017).' },
    { tipo: 'ACTA_NACIMIENTO', label: 'Acta de nacimiento', required: true, nota: null },
    { tipo: 'FOTO_PASAPORTE', label: 'Foto tipo pasaporte (5x5 cm)', required: true, nota: null },
    { tipo: 'COMPROBANTE_DOMICILIO', label: 'Comprobante de domicilio', required: false, nota: 'Opcional, recomendado.' },
    { tipo: 'ACTA_MATRIMONIO', label: 'Acta de matrimonio (si casado)', required: false, nota: 'Condicional.' },
    { tipo: 'RECIBOS_INGRESOS', label: 'Comprobantes de ingresos (últimos 3 meses)', required: false, nota: 'Opcional, recomendado.' },
  ]

  return (
    <div className="space-y-4">
      <StepHeader title="Sube tus documentos" subtitle="PDF, JPG o PNG · Máx 10MB c/u" />
      {docTypes.map((dt) => {
        const uploaded = data.documentos.find((d) => d.tipo === dt.tipo)
        return (
          <div key={dt.tipo} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label className="text-xs font-medium">
                  {dt.label} {dt.required && <span className="text-destructive">*</span>}
                </Label>
                {dt.nota && <p className="mt-1 text-[10px] text-primary">{dt.nota}</p>}
              </div>
            </div>
            <div className="mt-2">
              {uploaded ? (
                <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0 text-primary" />
                    <span className="text-xs truncate">{uploaded.fileName}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-emerald-600">✓ Subido</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={() => removeDocumento(dt.tipo)}>
                      Quitar
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/30 px-4 py-4 text-center hover:border-primary/50 hover:bg-muted/50 transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Arrastra o haz clic para subir</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) addDocumento(dt.tipo, f)
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )
      })}
      <InfoNote variant="warning">
        <Lock className="inline h-3.5 w-3.5 mr-1" />
        Tus documentos se almacenarán cifrados. Solo Mr. Trámite tiene acceso. Eliminados 90 días después del trámite.
      </InfoNote>
    </div>
  )
}

// --- Paso 10: Revisión y envío ---
function Step10Revision({ data, update, onOpenAviso, onOpenTerminos }: { data: WizardData; update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void; onOpenAviso: () => void; onOpenTerminos: () => void }) {
  const completedSections = [
    { label: 'Trámite', value: 'Visa Americana' },
    { label: 'Solicitante', value: data.nombreCompleto || '—' },
    { label: 'CURP', value: data.curp || '—' },
    { label: 'Domicilio', value: data.calle ? `${data.calle}, ${data.ciudad}` : '—' },
    { label: 'Estado civil', value: data.estadoCivil || '—' },
    { label: 'Familiares en EE.UU.', value: data.tieneFamiliaresDirectosUS === true ? 'Sí' : data.tieneFamiliaresDirectosUS === false ? 'No' : '—' },
    { label: 'Situación laboral', value: data.situacionLaboral || '—' },
    { label: 'Niveles académicos', value: `${data.nivelesAcademicos.filter((n) => n.estudio).length} nivel(es)` },
    { label: 'Viajes previos', value: data.haVisitadoOtrosPaises === true ? `${data.paisesVisitados.length} país(es)` : 'No' },
    { label: 'Documentos', value: `${data.documentos.length}/6 subidos` },
  ]

  return (
    <div className="space-y-4">
      <StepHeader title="Revisa y envía" subtitle="Verifica que todo esté correcto" />
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-1">
            {completedSections.map((s) => (
              <div key={s.label} className="flex justify-between border-b border-border/50 py-2 text-xs last:border-0">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-medium text-right">{s.value}</span>
              </div>
            ))}
            <div className="flex justify-between py-2 text-xs">
              <span className="text-muted-foreground">Costo</span>
              <span className="font-bold text-primary">$800 MXN</span>
            </div>
            <div className="flex justify-between py-2 text-xs">
              <span className="text-muted-foreground">Pago</span>
              <span className="text-[10px] text-muted-foreground">Pendiente — se cobra tras confirmar cita</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-3">
        <SelectField
          label="¿Por qué canal prefieres ser contactado?"
          value={data.canalPreferido}
          onChange={(v) => update('canalPreferido', v as WizardData['canalPreferido'])}
          required
          options={[
            { value: 'WHATSAPP', label: 'WhatsApp' },
            { value: 'MESSENGER', label: 'Messenger (Facebook)' },
            { value: 'INSTAGRAM', label: 'Instagram' },
            { value: 'EMAIL', label: 'Correo electrónico' },
          ]}
        />
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox checked={data.aceptaAvisoPrivacidad} onCheckedChange={(v) => update('aceptaAvisoPrivacidad', v === true)} />
          <span className="text-xs text-foreground/80">
            <strong>Consentimiento de tratamiento de datos personales.</strong> He leído y acepto el{' '}
            <button type="button" onClick={(e) => { e.preventDefault(); onOpenAviso(); }} className="text-primary underline hover:text-primary/80 inline">
              Aviso de Privacidad
            </button>
            . Autorizo a Mr. Trámite a tratar mis datos personales y sensibles con la finalidad de gestionar este trámite.
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox checked={data.aceptaTerminos} onCheckedChange={(v) => update('aceptaTerminos', v === true)} />
          <span className="text-xs text-foreground/80">
            <strong>Términos y condiciones.</strong> He leído y acepto los{' '}
            <button type="button" onClick={(e) => { e.preventDefault(); onOpenTerminos(); }} className="text-primary underline hover:text-primary/80 inline">
              términos y condiciones
            </button>
            . Comprendo la política de cancelación: si los documentos resultan incorrectos tras confirmar y pagar, se cobrará $300 MXN por nueva cita.
          </span>
        </label>
      </div>
      <InfoNote variant="success">
        <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
        <strong>Importante:</strong> No se te cobrará nada ahora. Recibirás un mensaje cuando Mr. Trámite haya generado tu cita. Solo entonces pagarás.
      </InfoNote>
    </div>
  )
}

// ============================================================================
// PANTALLA DE ÉXITO
// ============================================================================

function SuccessScreen({ folio, data, onExit }: { folio: string; data: WizardData; onExit: () => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-3xl items-center px-4">
          <Image src="/logo_icon.png" alt="Mr. Trámite" width={28} height={28} className="h-7 w-7 rounded-full" />
          <span className="ml-2 text-sm font-semibold">Mr. Trámite</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">¡Solicitud enviada!</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Mr. Trámite revisará tu información y documentos. Recibirás notificación por {data.canalPreferido?.toLowerCase()}.
          </p>
          <Card className="mt-6 text-left">
            <CardContent className="pt-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Folio</span>
                  <span className="font-bold text-primary">{folio}</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Expediente</span>
                  <span className="font-medium">EXP-{folio.split('-')[2]}-VISA</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Estado</span>
                  <span className="font-medium text-amber-600">NUEVO</span>
                </div>
                <div className="flex justify-between text-xs py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Próxima acción</span>
                  <span className="font-medium">Revisión por gestor</span>
                </div>
                <div className="flex justify-between text-xs py-2">
                  <span className="text-muted-foreground">Tiempo estimado</span>
                  <span className="font-medium">24-48 hrs</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <InfoNote variant="info">
            <ShieldCheck className="inline h-3.5 w-3.5 mr-1" />
            Guarda tu folio. Con él y tu correo podrás acceder a tu expediente y verificar el avance.
          </InfoNote>
          <div className="mt-6 space-y-2">
            <Button variant="outline" className="w-full" disabled>
              Ver mi expediente (próximamente)
            </Button>
            <Button onClick={onExit} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Volver al inicio
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  )
}

const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
  'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
]

const PAISES_COMUNES = [
  'Estados Unidos', 'Canadá', 'España', 'Francia', 'Reino Unido', 'Italia', 'Alemania',
  'Brasil', 'Argentina', 'Colombia', 'Perú', 'Chile', 'Costa Rica', 'Cuba', 'República Dominicana',
  'Japón', 'China', 'Corea del Sur', 'India', 'Australia', 'Otros',
]
