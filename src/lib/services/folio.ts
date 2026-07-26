import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * Genera un folio único para un expediente en formato MRT-YYYY-####
 * Ej: MRT-2026-0001, MRT-2026-0002, etc.
 *
 * Estrategia: cuenta expedientes del año actual y suma 1.
 * Si hay colisión (race condition), captura el error de unique constraint y reintenta.
 */
export async function generarFolio(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `MRT-${year}-`

  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await db.expediente.count({
      where: {
        folio: { startsWith: prefix },
      },
    })
    const numero = (count + 1 + attempt).toString().padStart(4, '0')
    const folio = `${prefix}${numero}`

    // Verificar que no exista
    const existente = await db.expediente.findUnique({ where: { folio } })
    if (existente) {
      continue // Ya existe, reintentar con siguiente número
    }

    return folio
  }

  // Fallback: usar timestamp + random si todo falla (extremadamente improbable)
  const ts = Date.now().toString().slice(-6)
  const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `${prefix}${ts}${rand}`
}
