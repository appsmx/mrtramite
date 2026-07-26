'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText } from 'lucide-react'

interface TerminosCondicionesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TerminosCondiciones({ open, onOpenChange }: TerminosCondicionesProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Términos y Condiciones
          </DialogTitle>
          <DialogDescription className="text-xs">
            Condiciones de servicio de Mr. Trámite
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6 py-4">
          <div className="space-y-6 text-sm leading-relaxed text-foreground/80">
            <p className="text-xs text-muted-foreground italic">
              Última actualización: 25 de julio de 2026
            </p>

            <section>
              <h3 className="font-semibold text-foreground mb-2">1. Servicios</h3>
              <p>
                Mr. Trámite ofrece servicios de gestoría para trámites gubernamentales y consulares,
                incluyendo Visa Americana, pasaporte mexicano, INE, licencia de conducir y otros.
                Nuestro rol es de gestoría: realizamos el acompañamiento y trámite administrativo,
                pero no garantizamos la aprobación de visados o trámites por parte de las autoridades.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">2. Modelo de pago</h3>
              <p className="mb-2">
                El cliente paga <strong>únicamente después de tener su cita confirmada</strong>.
                Esto aplica para trámites que requieren cita (como visa americana).
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>El costo del servicio es de $800 MXN para Visa Americana (puede variar por trámite).</li>
                <li>El pago se realiza vía Mercado Pago (tarjeta o transferencia SPEI).</li>
                <li>No se aceptan devoluciones una vez iniciado el trámite ante la autoridad.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">3. Responsabilidades del cliente</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Proporcionar información veraz y completa.</li>
                <li>Subir documentos legítimos y vigentes.</li>
                <li>Confirmar que los datos del DS-160 son correctos antes de pagar.</li>
                <li>Asistir a la cita consular en la fecha y hora indicadas.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">4. Política de cancelación</h3>
              <div className="space-y-2">
                <div className="rounded-md border border-border p-3">
                  <strong className="text-foreground">Si el cliente no paga después de la confirmación de cita:</strong>
                  <p className="mt-1">La cita se cancela. No hay cargo para el cliente.</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <strong className="text-foreground">Si el cliente confirma y paga, pero después detecta errores en sus documentos:</strong>
                  <p className="mt-1">Se cobrará $300 MXN por gestión de cancelación y realización de nueva cita. El pago debe realizarse antes de ejecutar la cancelación.</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <strong className="text-foreground">Si la cita se cancela por causa externa</strong> (consulado, SAT, sistema oficial):
                  <p className="mt-1">No es responsabilidad de Mr. Trámite. Como cortesía, se cobra 50% del costo por la gestión de nueva cita.</p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <strong className="text-foreground">Trámites ya realizados:</strong>
                  <p className="mt-1">No hay reembolso una vez que el trámite se ha ejecutado ante la autoridad.</p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">5. Limitación de responsabilidad</h3>
              <p>
                Mr. Trámite no se hace responsable por:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Decisiones de las autoridades consulares o gubernamentales (aprobación o rechazo de visas).</li>
                <li>Cancelaciones de citas por causas ajenas a Mr. Trámite.</li>
                <li>Información incorrecta proporcionada por el cliente.</li>
                <li>Retrasos en los sistemas oficiales de citas.</li>
              </ul>
              <p className="mt-2">
                La responsabilidad de Mr. Trámite se limita al valor del servicio contratado ($800 MXN para visa).
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">6. Prerequisitos</h3>
              <p>
                Para tramitar la Visa Americana de turista, el cliente <strong>debe contar con pasaporte mexicano
                vigente</strong> al momento de realizar la cita. Mr. Trámite no es responsable si el cliente
                no cumple con este requisito.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">7. Modificaciones</h3>
              <p>
                Mr. Trámite se reserva el derecho de modificar estos términos en cualquier momento.
                Los cambios serán efectivos desde su publicación en este documento.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">8. Jurisdicción</h3>
              <p>
                Estos términos se rigen por las leyes de los Estados Unidos Mexicanos.
                Cualquier controversia se resolverá ante los tribunales de Ciudad de México.
              </p>
            </section>

            <div className="border-t border-border pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Al continuar con la solicitud de su trámite, usted manifiesta haber leído y aceptado estos términos y condiciones.
              </p>
              <p className="mt-2 text-xs font-medium text-foreground">
                Mr. Trámite © 2026
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
