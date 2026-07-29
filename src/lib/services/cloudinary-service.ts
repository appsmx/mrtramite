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
