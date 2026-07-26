import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

// ============================================================================
// Rate Limiter en memoria
// ============================================================================
// Para MVP (single instance): funciona en memoria.
// Para producción con múltiples instancias: reemplazar con Upstash Rate Limit.

interface RateLimitEntry {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()
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
  limit: number
  windowMs: number
}

export const RATE_LIMITS = {
  CREATE_EXPEDIENTE: { limit: 5, windowMs: 60 * 1000 },
  EJECUTAR_ACCION: { limit: 30, windowMs: 60 * 1000 },
  LOGIN: { limit: 10, windowMs: 60 * 1000 },
  WEBHOOK_MP: { limit: 60, windowMs: 60 * 1000 },
  GENERAL: { limit: 100, windowMs: 60 * 1000 },
} as const

export type RateLimitType = keyof typeof RATE_LIMITS

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { success: boolean; limit: number; remaining: number; resetTime: number } {
  cleanupExpired()

  const now = Date.now()
  const key = `${identifier}:${config.windowMs}`
  const entry = store.get(key)

  if (!entry || now > entry.resetTime) {
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

  if (entry.count >= config.limit) {
    logger.warn('Rate limit excedido', { identifier, count: entry.count, limit: config.limit })
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  entry.count += 1
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
  }
}

export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return 'local-dev'
}

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

  return null
}
