import { v2 as cloudinary } from 'cloudinary'
import { logger } from '@/lib/logger'

// ============================================================================
// Servicio de Cloudinary — subida de archivos
// ============================================================================
// Sube archivos (PDF, JPG, PNG) a Cloudinary y retorna la URL permanente.
// Los archivos se organizan por folio de expediente.

// Configurar Cloudinary solo si las credenciales existen
const isConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

export interface CloudinaryUploadResult {
  url: string
  publicId: string
  bytes: number
  format: string
}

/**
 * Sube un archivo (Buffer) a Cloudinary.
 * @param buffer - El contenido del archivo
 * @param folder - Carpeta donde guardar (ej: 'mrtramite/MRT-2026-0001')
 * @param fileName - Nombre del archivo (ej: 'pasaporte.pdf')
 * @param mimeType - Tipo MIME (ej: 'application/pdf')
 */
export async function subirArchivo(
  buffer: Buffer,
  folder: string,
  fileName: string,
  mimeType: string
): Promise<CloudinaryUploadResult> {
  if (!isConfigured) {
    logger.warn('Cloudinary no configurado — simulando subida', { fileName })
    return {
      url: `https://res.cloudinary.com/demo/image/upload/v1/${folder}/${fileName}`,
      publicId: `${folder}/${fileName}`,
      bytes: buffer.length,
      format: fileName.split('.').pop() || 'bin',
    }
  }

  try {
    const resourceType = mimeType.startsWith('image/') ? 'image' : 'raw'

    const result = await cloudinary.uploader.upload(`data:${mimeType};base64,${buffer.toString('base64')}`, {
      folder,
      public_id: fileName.replace(/\.[^/.]+$/, ''), // sin extensión
      resource_type: resourceType,
      unique_filename: false,
      overwrite: true,
      type: 'authenticated',
    })

    logger.info('Archivo subido a Cloudinary', { publicId: result.public_id, bytes: result.bytes })

    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
    }
  } catch (error) {
    logger.error('Error subiendo a Cloudinary', { fileName, error: error instanceof Error ? error.message : String(error) })
    throw new Error(`Error subiendo archivo a Cloudinary: ${error instanceof Error ? error.message : 'desconocido'}`)
  }
}

/**
 * Sube un archivo desde una URL temporal (ej: URL de WhatsApp/Messenger).
 * Descarga el archivo y lo sube a Cloudinary.
 */
export async function subirArchivoDesdeUrl(
  url: string,
  folder: string,
  fileName: string
): Promise<CloudinaryUploadResult> {
  if (!isConfigured) {
    logger.warn('Cloudinary no configurado — simulando subida desde URL', { url, fileName })
    return {
      url: `https://res.cloudinary.com/demo/image/upload/v1/${folder}/${fileName}`,
      publicId: `${folder}/${fileName}`,
      bytes: 0,
      format: fileName.split('.').pop() || 'bin',
    }
  }

  try {
    // Descargar el archivo desde la URL temporal
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error descargando archivo: ${response.status}`)
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    const mimeType = response.headers.get('content-type') || 'application/octet-stream'

    return subirArchivo(buffer, folder, fileName, mimeType)
  } catch (error) {
    logger.error('Error subiendo desde URL a Cloudinary', { url, error: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

/**
 * Elimina un archivo de Cloudinary por su public_id.
 */
export async function eliminarArchivo(publicId: string): Promise<boolean> {
  if (!isConfigured) {
    logger.warn('Cloudinary no configurado — simulando eliminación', { publicId })
    return true
  }

  try {
    await cloudinary.uploader.destroy(publicId)
    logger.info('Archivo eliminado de Cloudinary', { publicId })
    return true
  } catch (error) {
    logger.error('Error eliminando de Cloudinary', { publicId, error: error instanceof Error ? error.message : String(error) })
    return false
  }
}

export const cloudinaryConfigured = isConfigured

/**
 * Genera una URL firmada para un asset autenticado de Cloudinary.
 * La URL expira después del tiempo especificado (default: 1 hora).
 * Solo alguien con las credenciales de Cloudinary puede generarla.
 */
export function generarUrlFirmada(publicId: string, resourceType: string = 'image', expiresInSeconds: number = 3600): string {
  if (!isConfigured) {
    return `https://res.cloudinary.com/demo/${resourceType}/upload/v1/${publicId}`
  }

  try {
    const signedUrl = cloudinary.utils.private_download_url(publicId, resourceType === 'image' ? 'jpg' : 'pdf', {
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
      type: 'authenticated',
    })
    return signedUrl
  } catch (error) {
    logger.error('Error generando URL firmada', { publicId, error: error instanceof Error ? error.message : String(error) })
    // Fallback: usar signed_url de cloudinary
    try {
      const signedUrl = cloudinary.url(publicId, {
        type: 'authenticated',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
        resource_type: resourceType,
      })
      return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/${signedUrl}`
    } catch {
      return ''
    }
  }
}

/**
 * Extrae el publicId de una URL de Cloudinary.
 * Ej: https://res.cloudinary.com/nvjxzuy1/image/upload/v123/mrtramite/MRT-2026-0002/PASAPORTE_456.jpg
 * → mrtramite/MRT-2026-0002/PASAPORTE_456
 */
export function extraerPublicIdDeUrl(url: string): string {
  if (!url || url === 'whatsapp') return ''
  const match = url.match(/\/(?:upload|authenticated)\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/)
  return match ? match[1] : ''
}

/**
 * Extrae el resource_type de una URL de Cloudinary.
 */
export function extraerResourceTypeDeUrl(url: string): string {
  if (url.includes('/image/')) return 'image'
  if (url.includes('/raw/')) return 'raw'
  if (url.includes('/video/')) return 'video'
  return 'image'
}
