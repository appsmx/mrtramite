import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// ============================================================================
// Rate Limiter en memoria
// ============================================================================
// Para MVP (single instance): funciona en memoria.
// Para producción con múltiples instancias: reemplazar con Upstash Rate Limit.
//   Cambio: sustituir la implementación de `check` por:
//     import { Ratelimit } from '@upstash/ratelimit'
//     import { Redis } from '@upstash/redis'
//     const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(5, '1 m') })
//     const { success } = await ratelimit.limit(identifier)

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Mapa en memoria: clave → entrada
const store = new Map<string, RateLimitEntry>()

// Limpieza periódica de entradas expiradas (cada 5 minutos)
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupExpired(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key)
    }
  }
}

interface RateLimitConfig {
  limit: number // número de requests permitidos
  windowMs: number // ventana de tiempo en milisegundos
}

// Configuraciones por tipo de endpoint
export const RATE_LIMITS = {
  // Crear expediente: 5 por minuto por IP (evita spam de creación)
  CREATE_EXPEDIENTE: { limit: 5, windowMs: 60 * 1000 },
  // Ejecutar acción: 30 por minuto por IP (admin trabaja, pero evita abuso)
  EJECUTAR_ACCION: { limit: 30, windowMs: 60 * 1000 },
  // Login: 10 por minuto por IP (evita brute force)
  LOGIN: { limit: 10, windowMs: 60 * 1000 },
  // Webhook MP: 60 por minuto (MP puede enviar muchos webhooks)
  WEBHOOK_MP: { limit: 60, windowMs: 60 * 1000 },
  // APIs generales (GET): 100 por minuto por IP
  GENERAL: { limit: 100, windowMs: 60 * 1000 },
} as const

export type RateLimitType = keyof typeof RATE_LIMITS

/**
 * Verifica si un request está dentro del límite.
 * Retorna { success, limit, remaining, resetTime }.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  cleanupExpired()

  const now = Date.now()
  const key = `${identifier}:${config.windowMs}`
  const entry = store.get(key)

  if (!entry || now > entry.resetTime) {
    // Primera request o ventana expirada
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    store.set(key, newEntry)
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetTime: newEntry.resetTime,
    }
  }

  // Request dentro de la ventana
  if (entry.count >= config.limit) {
    // Límite excedido
    logger.warn('Rate limit excedido', { identifier, count: entry.count, limit: config.limit })
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  // Incrementar contador
  entry.count += 1
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Obtiene el identificador del cliente (IP o user ID).
 * En Vercel: usa x-forwarded-for.
 * En desarrollo: usa x-forwarded-for o 'dev'.
 */
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Tomar la primera IP (cliente original)
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  // Fallback para desarrollo local
  return 'local-dev'
}

/**
 * Middleware de rate limiting para API routes.
 * Uso:
 *   const rateCheck = applyRateLimit(request, 'CREATE_EXPEDIENTE')
 *   if (rateCheck) return rateCheck  // 429 si excedido
 */
export function applyRateLimit(
  request: NextRequest,
  type: RateLimitType
): NextResponse | null {
  const config = RATE_LIMITS[type]
  const identifier = getClientIdentifier(request)
  const result = checkRateLimit(identifier, config)

  if (!result.success) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
    return NextResponse.json(
      {
        error: 'Demasiadas solicitudes',
        message: `Has excedido el límite de ${result.limit} requests por minuto. Intenta nuevamente en ${retryAfter} segundos.`,
      },
      {
        status: 429,
        headers: {
          'RateLimit-Limit': String(result.limit),
          'RateLimit-Remaining': '0',
          'RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
          'Retry-After': String(retryAfter),
        },
      }
    )
  }

  return null // No excedido, continuar
}

/**
 * Agrega headers de rate limit a una respuesta exitosa.
 */
export function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest,
  type: RateLimitType
): NextResponse {
  const config = RATE_LIMITS[type]
  const identifier = getClientIdentifier(request)
  const result = checkRateLimit(identifier, config)

  // Si ya fue contado en applyRateLimit, no incrementar de nuevo
  // Por eso esta función solo lee, no incrementa
  response.headers.set('RateLimit-Limit', String(result.limit))
  response.headers.set('RateLimit-Remaining', String(Math.max(0, result.remaining)))
  response.headers.set('RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)))

  return response
}
