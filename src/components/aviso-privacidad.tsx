'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield, Mail, Phone, MapPin, FileText, Clock, Lock, Users, RefreshCw, AlertCircle } from 'lucide-react'

interface AvisoPrivacidadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AvisoPrivacidad({ open, onOpenChange }: AvisoPrivacidadProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Aviso de Privacidad
          </DialogTitle>
          <DialogDescription className="text-xs">
            Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6 py-4">
          <div className="prose prose-sm max-w-none text-foreground/80 space-y-6 text-sm leading-relaxed">

            {/* Última actualización */}
            <p className="text-xs text-muted-foreground italic">
              Última actualización: 25 de julio de 2026
            </p>

            {/* Intro */}
            <section>
              <p>
                <strong>Mr. Trámite</strong> (en adelante "el Responsable"), con domicilio en Ciudad de México, México,
                es responsable del tratamiento de sus datos personales conforme a la Ley Federal de Protección de
                Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.
              </p>
              <p>
                Este aviso de privacidad describe cómo recabamos, usamos, almacenamos y protegemos sus datos
                personales y sensibles cuando utiliza nuestros servicios de gestoría de trámites.
              </p>
            </section>

            {/* 1. Finalidad */}
            <section>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-2">
                <FileText className="h-4 w-4 text-primary" />
                1. Finalidad del tratamiento
              </h3>
              <p className="mb-2">Sus datos personales serán tratados para las siguientes finalidades:</p>
              <p className="font-medium text-foreground mb-1">Finalidades principales:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gestión y tramitación de trámites solicitados (visa, pasaporte, INE, licencia, etc.)</li>
                <li>Comunicación con usted sobre el estado de su trámite (email, WhatsApp, Messenger, Instagram)</li>
                <li>Validación y almacenamiento de documentos requeridos para cada trámite</li>
                <li>Cobro de honorarios por servicios prestados (solo después de confirmar su cita)</li>
                <li>Cumplimiento de obligaciones legales aplicables</li>
              </ul>
              <p className="font-medium text-foreground mt-3 mb-1">Finalidades secundarias (opcionales):</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Encuestas de satisfacción y mejora del servicio</li>
                <li>Notificación de nuevos servicios o promociones</li>
                <li>Testimonios y casos de éxito (con su consentimiento expreso)</li>
              </ul>
              <p className="mt-2 text-xs">
                Si no desea que sus datos se utilicen para finalidades secundarias, puede manifestarlo enviando
                un correo a contacto@mrtramite.mx. La negativa para estos fines no afectará la prestación del servicio principal.
              </p>
            </section>

            {/* 2. Datos recabados */}
            <section>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-2">
                <Users className="h-4 w-4 text-primary" />
                2. Datos personales recabados
              </h3>
              <p className="mb-2">Recabamos los siguientes datos personales:</p>
              <p className="font-medium text-foreground mb-1">Datos de identificación:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Nombre completo (como aparece en pasaporte)</li>
                <li>CURP</li>
                <li>Sexo</li>
                <li>Fecha y lugar de nacimiento</li>
                <li>Nacionalidad</li>
              </ul>
              <p className="font-medium text-foreground mt-3 mb-1">Datos de contacto:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Correo electrónico</li>
                <li>Teléfono / WhatsApp</li>
                <li>Domicilio (calle, colonia, ciudad, estado, código postal)</li>
                <li>Redes sociales (usuario/handle, opcional)</li>
              </ul>
              <p className="font-medium text-foreground mt-3 mb-1">Datos del trámite (DS-160 para visa):</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Estado civil, datos de cónyuge e hijos</li>
                <li>Datos de padres</li>
                <li>Familiares en Estados Unidos</li>
                <li>Información laboral (empresa, ingreso, actividades)</li>
                <li>Información académica</li>
                <li>Historial de viajes y visas previas</li>
              </ul>
            </section>

            {/* 3. Datos sensibles */}
            <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <h3 className="flex items-center gap-2 text-base font-semibold text-amber-900 mb-2">
                <AlertCircle className="h-4 w-4" />
                3. Datos personales sensibles
              </h3>
              <p className="text-amber-900">
                Conforme al artículo 61 de la LFPDPPP, consideramos como <strong>datos sensibles</strong> aquellos
                que afectan a la íntima esfera del titular. En particular, recabamos:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-amber-900">
                <li>Datos del pasaporte (número, fechas, país emisor)</li>
                <li>Información sobre estatus migratorio de familiares</li>
                <li>Historial de visas y negaciones previas</li>
                <li>Ingresos mensuales</li>
              </ul>
              <p className="mt-2 text-amber-900">
                El tratamiento de datos sensibles requiere de su <strong>consentimiento expreso y por escrito</strong>,
                el cual otorga al aceptar este aviso de privacidad y completar el formulario de solicitud de trámite.
              </p>
            </section>

            {/* 4. Transferencias */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">
                4. Transferencias de datos
              </h3>
              <p className="mb-2">
                No transferimos sus datos personales a terceros, excepto en los siguientes casos:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Autoridades consulares y gubernamentales</strong> (consulado de EE.UU., SRE, INE, etc.)
                  cuando sea estrictamente necesario para la gestión del trámite que usted solicitó.
                </li>
                <li>
                  <strong>Mercado Pago</strong> como procesador de pagos, únicamente con los datos necesarios
                  para procesar su transacción (nombre, email, monto).
                </li>
                <li>
                  <strong>Resend</strong> como proveedor de envío de correos electrónicos transaccionales
                  (únicamente email y contenido del mensaje).
                </li>
                <li>
                  Cuando sea requerido por autoridad competente (art. 37 LFPDPPP).
                </li>
              </ul>
              <p className="mt-2 text-xs">
                No solicitamos su consentimiento para estas transferencias cuando son necesarias para cumplir
                con la finalidad del servicio que usted contrató (art. 37 fracción II LFPDPPP).
              </p>
            </section>

            {/* 5. Derechos ARCO */}
            <section>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-2">
                <RefreshCw className="h-4 w-4 text-primary" />
                5. Derechos ARCO
              </h3>
              <p className="mb-2">
                Usted tiene derecho a ejercer sus derechos de:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                <div className="rounded-md border border-border p-2">
                  <strong>Acceso:</strong> Conocer qué datos tenemos de usted.
                </div>
                <div className="rounded-md border border-border p-2">
                  <strong>Rectificación:</strong> Solicitar corrección de datos inexactos.
                </div>
                <div className="rounded-md border border-border p-2">
                  <strong>Cancelación:</strong> Solicitar la eliminación de sus datos.
                </div>
                <div className="rounded-md border border-border p-2">
                  <strong>Oposición:</strong> Oponerse al tratamiento para fines específicos.
                </div>
              </div>
              <p className="mt-3">
                Para ejercer estos derechos, envíe su solicitud a <strong>contacto@mrtramite.mx</strong> con:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Nombre completo y medio de contacto</li>
                <li>Documento que acredite su identidad</li>
                <li>Descripción clara del derecho que desea ejercer</li>
              </ul>
              <p className="mt-2">
                Responderemos su solicitud en un plazo máximo de <strong>20 días hábiles</strong> (art. 32 LFPDPPP).
              </p>
            </section>

            {/* 6. Seguridad */}
            <section>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-2">
                <Lock className="h-4 w-4 text-primary" />
                6. Medidas de seguridad
              </h3>
              <p>
                Implementamos medidas técnicas, administrativas y físicas para proteger sus datos personales:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Cifrado HTTPS en todas las comunicaciones</li>
                <li>Almacenamiento cifrado de documentos</li>
                <li>Acceso restringido a personal autorizado únicamente</li>
                <li>Autenticación con contraseña para acceso al panel administrativo</li>
                <li>Backups regulares de la base de datos</li>
              </ul>
              <p className="mt-2 text-xs">
                En caso de una brecha de seguridad que afecte sus datos, se le notificará conforme al artículo 64
                de la LFPDPPP en un plazo no mayor a 72 horas.
              </p>
            </section>

            {/* 7. Retención */}
            <section>
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-2">
                <Clock className="h-4 w-4 text-primary" />
                7. Conservación y retención
              </h3>
              <p>
                Sus datos personales se conservarán durante el tiempo necesario para cumplir con la finalidad
                del tratamiento. Concretamente:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Datos de trámite:</strong> durante la vigencia del trámite + 90 días posteriores a la finalización.</li>
                <li><strong>Documentos:</strong> eliminados 90 días después de la finalización del trámite.</li>
                <li><strong>Datos de contacto:</strong> hasta que solicite su cancelación.</li>
                <li><strong>Registros contables y fiscales:</strong> 5 años (conforme al Código Fiscal de la Federación).</li>
              </ul>
              <p className="mt-2">
                Transcurridos los plazos de retención, sus datos serán bloqueados y posteriormente eliminados
                de forma segura.
              </p>
            </section>

            {/* 8. Cambios */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-2">
                8. Cambios a este aviso
              </h3>
              <p>
                Nos reservamos el derecho de actualizar este aviso de privacidad en cualquier momento.
                Los cambios serán publicados en esta página y, si son sustanciales, se le notificará por
                correo electrónico. La fecha de última actualización se indica al inicio de este documento.
              </p>
            </section>

            {/* 9. Contacto */}
            <section className="rounded-md border border-primary/30 bg-primary/5 p-4">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground mb-3">
                <Mail className="h-4 w-4 text-primary" />
                9. Contacto
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Correo:</strong>{' '}
                    <a href="mailto:contacto@mrtramite.mx" className="text-primary underline">contacto@mrtramite.mx</a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>WhatsApp / Messenger / Instagram:</strong> Disponibles desde los botones de contacto en el sitio web.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Domicilio:</strong> Ciudad de México, México
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Para cualquier duda sobre el tratamiento de sus datos personales, contacte al Responsable del
                tratamiento en el correo indicado.
              </p>
            </section>

            {/* Footer del aviso */}
            <div className="border-t border-border pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Al continuar con la solicitud de su trámite, usted manifiesta haber leído y aceptado este aviso de privacidad,
                y otorga su consentimiento expreso para el tratamiento de sus datos personales y sensibles con las finalidades descritas.
              </p>
              <p className="mt-2 text-xs font-medium text-foreground">
                Mr. Trámite © 2026 — Gestoría profesional de trámites
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
