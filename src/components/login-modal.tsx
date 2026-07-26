'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShieldCheck, User, Lock, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface LoginModalProps {
  trigger: React.ReactNode
  defaultTab?: 'admin' | 'cliente'
}

export function LoginModal({ trigger, defaultTab = 'cliente' }: LoginModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<'admin' | 'cliente' | null>(null)
  const router = useRouter()

  // Admin form state
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')

  // Cliente form state
  const [clienteEmail, setClienteEmail] = useState('')
  const [clienteFolio, setClienteFolio] = useState('')

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('admin')
    try {
      const result = await signIn('admin-credentials', {
        email: adminEmail,
        password: adminPassword,
        redirect: false,
      })
      if (result?.error) {
        toast.error('Credenciales inválidas', {
          description: 'Verifica tu email y contraseña',
        })
      } else {
        toast.success('Bienvenido', { description: 'Sesión iniciada como administrador' })
        setOpen(false)
        // Por ahora redirige a home; cuando haya panel admin, redirigir ahí
        router.refresh()
      }
    } catch (error) {
      toast.error('Error al iniciar sesión')
    } finally {
      setLoading(null)
    }
  }

  const handleClienteLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading('cliente')
    try {
      const result = await signIn('cliente-credentials', {
        email: clienteEmail,
        folio: clienteFolio,
        redirect: false,
      })
      if (result?.error) {
        toast.error('No encontramos tu expediente', {
          description: 'Verifica tu email y folio',
        })
      } else {
        toast.success('Bienvenido', { description: 'Acceso a tu expediente concedido' })
        setOpen(false)
        router.refresh()
      }
    } catch (error) {
      toast.error('Error al iniciar sesión')
    } finally {
      setLoading(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Acceso a Mr. Trámite</SheetTitle>
          <SheetDescription>
            Inicia sesión para acceder a tu expediente o al panel de administración
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue={defaultTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cliente">
              <User className="h-3.5 w-3.5 mr-1" />
              Cliente
            </TabsTrigger>
            <TabsTrigger value="admin">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Admin
            </TabsTrigger>
          </TabsList>

          {/* Login cliente */}
          <TabsContent value="cliente" className="space-y-4 mt-4">
            <form onSubmit={handleClienteLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cliente-email" className="text-xs">Correo electrónico</Label>
                <Input
                  id="cliente-email"
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cliente-folio" className="text-xs">Folio de expediente</Label>
                <Input
                  id="cliente-folio"
                  type="text"
                  value={clienteFolio}
                  onChange={(e) => setClienteFolio(e.target.value.toUpperCase())}
                  placeholder="MRT-2026-XXXX"
                  required
                  className="h-10 font-mono"
                />
              </div>
              <Button
                type="submit"
                disabled={loading === 'cliente'}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading === 'cliente' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Ver mi expediente
                  </>
                )}
              </Button>
            </form>
            <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">¿No tienes folio?</p>
              <p className="mt-1">Inicia un trámite para recibir tu folio por correo.</p>
            </div>
          </TabsContent>

          {/* Login admin */}
          <TabsContent value="admin" className="space-y-4 mt-4">
            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-xs">Email administrador</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@mrtramite.mx"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-xs">Contraseña</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                disabled={loading === 'admin'}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading === 'admin' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Acceder al panel
                  </>
                )}
              </Button>
            </form>
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
              <p className="font-medium">Acceso restringido</p>
              <p className="mt-1">Solo gestores y administradores autorizados.</p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
