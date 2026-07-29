import { db } from '@/lib/db'

/**
 * Genera un folio único para un expediente en formato MRT-YYYY-####
 * Ej: MRT-2026-0001, MRT-2026-0002, etc.
 *
 * Estrategia: cuenta expedientes del año actual y suma 1.
 * En caso de carrera, se reintenta hasta 3 veces.
 */
export async function generarFolio(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `MRT-${year}-`

  for (let attempt = 0; attempt < 3; attempt++) {
    const count = await db.expediente.count({
      where: {
        folio: { startsWith: prefix },
      },
    })
    const numero = (count + 1).toString().padStart(4, '0')
    const folio = `${prefix}${numero}`

    // Verificar que no exista (por si hubo carrera)
    const existente = await db.expediente.findUnique({ where: { folio } })
    if (!existente) {
      return folio
    }
    // Si existe, reintentar (el count del siguiente intento será mayor)
  }

  // Fallback: usar timestamp si todo falla
  const ts = Date.now().toString().slice(-6)
  return `${prefix}${ts}`
}
