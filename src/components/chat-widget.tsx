'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, X, Send, Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ============================================================================
// ChatWidget — Conecta con LOGAN OS Assistant
// ============================================================================
// Endpoint: POST https://logancorp.vercel.app/api/assistant/chat
// projectId: cmsmfx4670000jr04lzzy1znm
//
// Características:
//   - Burbuja flotante abajo a la derecha (#1B4F72)
//   - Panel con historial (cliente derecha, bot izquierda)
//   - Indicador "escribiendo..."
//   - sessionId persistente en localStorage (uuid v4)
//   - Rate limit: si rateLimited=true, deshabilita input
//   - Errores: mensaje con link a WhatsApp
//   - Mensaje de bienvenida al abrir
// ============================================================================

const LOGAN_ENDPOINT = 'https://logancorp.vercel.app/api/assistant/chat'
const LOGAN_PROJECT_ID = 'cmsmfx4670000jr04lzzy1znm'
const SESSION_KEY = 'logan_session_id'
const WHATSAPP_URL = 'https://wa.me/526642342946'
const BRAND_COLOR = '#1B4F72'

const WELCOME_MESSAGE =
  '¡Hola! Soy el asistente de Mr. Trámite. Puedo ayudarte con información sobre nuestros trámites (visa, pasaporte, INE, licencia), precios y requisitos. ¿En qué te puedo ayudar?'

interface Mensaje {
  id: string
  role: 'user' | 'assistant'
  content: string
  isError?: boolean
  timestamp: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem(SESSION_KEY)
    if (!id) {
      // crypto.randomUUID está disponible en todos los navegadores modernos
      // fallback por si acaso
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    // localStorage puede estar bloqueado (modo incógnito estricto)
    return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  }
}

function generarId(): string {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// ---------------------------------------------------------------------------
// Llamada al endpoint de LOGAN OS
// ---------------------------------------------------------------------------

async function enviarMensaje(
  message: string,
  sessionId: string
): Promise<{ response: string; rateLimited: boolean; remaining: number }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

  try {
    const res = await fetch(LOGAN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: LOGAN_PROJECT_ID,
        message,
        sessionId,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const data = await res.json()

    if (!res.ok && !data?.response) {
      throw new Error(`HTTP ${res.status}`)
    }

    return {
      response: data.response ?? '',
      rateLimited: data.rateLimited === true,
      remaining: typeof data.remaining === 'number' ? data.remaining : 0,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Mensaje[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [rateLimited, setRateLimited] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [hasError, setHasError] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initialized = useRef(false)

  // Inicializar sessionId al montar
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    setSessionId(getSessionId())
  }, [])

  // Mensaje de bienvenida al abrir por primera vez
  useEffect(() => {
    if (open && messages.length === 0 && sessionId) {
      setMessages([
        {
          id: generarId(),
          role: 'assistant',
          content: WELCOME_MESSAGE,
          timestamp: Date.now(),
        },
      ])
    }
  }, [open, messages.length, sessionId])

  // Auto-scroll al final cuando llegan mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Focus en input al abrir
  useEffect(() => {
    if (open && !loading) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, loading])

  const handleEnviar = useCallback(async () => {
    const texto = input.trim()
    if (!texto || loading || rateLimited || !sessionId) return

    const mensajeUsuario: Mensaje = {
      id: generarId(),
      role: 'user',
      content: texto,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, mensajeUsuario])
    setInput('')
    setLoading(true)
    setHasError(false)

    try {
      const data = await enviarMensaje(texto, sessionId)

      if (data.rateLimited) {
        setRateLimited(true)
      }
      if (typeof data.remaining === 'number') {
        setRemaining(data.remaining)
      }

      setMessages((prev) => [
        ...prev,
        {
          id: generarId(),
          role: 'assistant',
          content: data.response || 'Sin respuesta del asistente.',
          timestamp: Date.now(),
        },
      ])
    } catch (err) {
      setHasError(true)
      setMessages((prev) => [
        ...prev,
        {
          id: generarId(),
          role: 'assistant',
          content:
            'En este momento no puedo responder. Escríbenos por WhatsApp y te atendemos directamente.',
          isError: true,
          timestamp: Date.now(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, rateLimited, sessionId])

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  const reiniciarSesion = () => {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {}
    const nuevoId = getSessionId()
    setSessionId(nuevoId)
    setMessages([
      {
        id: generarId(),
        role: 'assistant',
        content: WELCOME_MESSAGE,
        timestamp: Date.now(),
      },
    ])
    setRateLimited(false)
    setHasError(false)
    setRemaining(null)
    setInput('')
  }

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir chat de asistente"
          className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-105 hover:shadow-xl active:scale-95 group"
          style={{ backgroundColor: BRAND_COLOR }}
        >
          {/* Badge de "online" */}
          <span
            className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white"
            style={{ backgroundColor: '#22C55E' }}
            aria-hidden
          />
          <MessageSquare className="h-6 w-6 transition-transform group-hover:scale-110" />
          {/* Tooltip */}
          <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none hidden sm:block">
            ¿Necesitas ayuda?
          </span>
        </button>
      )}

      {/* Panel de chat */}
      {open && (
        <div
          className="fixed inset-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 sm:w-[380px] sm:h-[560px] sm:max-h-[calc(100vh-2.5rem)] flex flex-col bg-white dark:bg-zinc-900 sm:rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300"
          role="dialog"
          aria-label="Chat con asistente de Mr. Trámite"
        >
          {/* HEADER */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">Asistente Mr. Trámite</div>
                <div className="text-[11px] opacity-90 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-300 inline-block" />
                  En línea
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reiniciarSesion}
                aria-label="Reiniciar conversación"
                title="Reiniciar conversación"
                className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar chat"
                className="p-1.5 rounded-md hover:bg-white/15 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* MENSAJES */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-3 bg-zinc-50 dark:bg-zinc-950"
            style={{ scrollbarWidth: 'thin' }}
          >
            {messages.map((m) => (
              <MensajeBubble key={m.id} mensaje={m} />
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 px-1">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: BRAND_COLOR }}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 rounded-full px-3 py-2 shadow-sm border border-zinc-100 dark:border-zinc-700">
                  <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-1 text-[11px]">escribiendo...</span>
                </div>
              </div>
            )}

            {/* Banner de rate limit */}
            {rateLimited && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Límite de mensajes alcanzado</p>
                    <p className="mt-0.5 opacity-90">
                      Has llegado al máximo de mensajes por sesión. Reinicia la conversación
                      con el botón de arriba, o contáctanos por WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contador de mensajes restantes */}
            {!rateLimited && remaining !== null && remaining <= 5 && remaining > 0 && (
              <div className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
                Te quedan {remaining} {remaining === 1 ? 'mensaje' : 'mensajes'} en esta sesión
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 bg-white dark:bg-zinc-900">
            {hasError && (
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 mb-2 text-xs font-medium text-white py-2 px-3 rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Escribir por WhatsApp
              </a>
            )}
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={
                  rateLimited
                    ? 'Límite alcanzado — reinicia para continuar'
                    : 'Escribe tu mensaje...'
                }
                disabled={loading || rateLimited}
                maxLength={500}
                className="flex-1 h-10 text-sm disabled:opacity-50"
                aria-label="Mensaje al asistente"
              />
              <Button
                onClick={handleEnviar}
                disabled={!input.trim() || loading || rateLimited}
                size="icon"
                className="h-10 w-10 shrink-0 text-white"
                style={{ backgroundColor: BRAND_COLOR }}
                aria-label="Enviar mensaje"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
              <span>Powered by LOGAN OS</span>
              {input.length > 0 && <span>{input.length}/500</span>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Bubble de mensaje
// ---------------------------------------------------------------------------

function MensajeBubble({ mensaje }: { mensaje: Mensaje }) {
  const esUsuario = mensaje.role === 'user'
  const esError = mensaje.isError === true

  if (esUsuario) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2 text-sm text-white shadow-sm whitespace-pre-wrap break-words"
          style={{ backgroundColor: BRAND_COLOR }}
        >
          {mensaje.content}
        </div>
      </div>
    )
  }

  // Mensaje del bot
  return (
    <div className="flex items-start gap-2">
      <div
        className="h-7 w-7 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5"
        style={{ backgroundColor: esError ? '#DC2626' : BRAND_COLOR }}
      >
        <MessageSquare className="h-3.5 w-3.5" />
      </div>
      <div
        className={`max-w-[80%] rounded-2xl rounded-bl-md px-3.5 py-2 text-sm shadow-sm border whitespace-pre-wrap break-words ${
          esError
            ? 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-100 border-red-200 dark:border-red-900'
            : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border-zinc-100 dark:border-zinc-700'
        }`}
      >
        {mensaje.content}
        {esError && (
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-white py-1 px-2.5 rounded-md hover:opacity-90"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageSquare className="h-3 w-3" />
            Abrir WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
