// ============================================================================
// Logger con niveles y filtrado de datos sensibles
// ============================================================================
// Reemplaza console.log/error/warn con un logger estructurado que:
//   - Respeta NODE_ENV (debug solo en desarrollo)
//   - Tiene niveles: debug, info, warn, error
//   - Filtra automáticamente datos sensibles (CURP, emails, tokens, passwords)
//   - Incluye timestamp e contexto en cada log
//   - En producción, los logs de debug se omiten silenciosamente

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

// Campos sensibles que se filtran automáticamente
const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'session',
  'csrf',
  'curp',
  'email',
  'telefono',
  'phone',
  'mercadoPagoId',
  'creditCard',
  'cardNumber',
  'cvv',
]

// Niveles permitidos por entorno
const isDev = process.env.NODE_ENV !== 'production'
const isTest = process.env.NODE_ENV === 'test'

// Filtra recursivamente datos sensibles de un objeto
// Maneja referencias circulares con un WeakSet de objetos ya vistos
function sanitize(value: unknown, seen = new WeakSet()): unknown {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack }

  // Detectar referencias circulares
  if (seen.has(value as object)) {
    return '[Circular]'
  }
  seen.add(value as object)

  if (Array.isArray(value)) {
    return value.map((v) => sanitize(v, seen))
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s.toLowerCase()))) {
      sanitized[key] = '[REDACTED]'
    } else {
      sanitized[key] = sanitize(val, seen)
    }
  }
  return sanitized
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`

  if (context && Object.keys(context).length > 0) {
    const sanitizedContext = sanitize(context)
    return `${prefix} ${message} ${JSON.stringify(sanitizedContext)}`
  }

  return `${prefix} ${message}`
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!isDev || isTest) return // debug solo en desarrollo
    console.debug(formatMessage('debug', message, context))
  },

  info(message: string, context?: LogContext): void {
    if (isTest) return
    console.info(formatMessage('info', message, context))
  },

  warn(message: string, context?: LogContext): void {
    if (isTest) return
    console.warn(formatMessage('warn', message, context))
  },

  error(message: string, context?: LogContext): void {
    // error siempre se loguea, incluso en test
    console.error(formatMessage('error', message, context))
  },
}

// Alias para compatibilidad con console.log
export const log = logger.info
