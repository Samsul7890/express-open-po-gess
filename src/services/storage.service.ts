import crypto from "crypto"
import path from "path"
import sharp from "sharp"
import { supabase } from "../config/supabase"
import { env } from "../config/env"

const MAX_FILE_SIZE_BYTES = 500 * 1024 // 500 KB

/**
 * Compresses an image buffer using sharp if it exceeds 500 KB.
 */
export const compressImageBuffer = async (
  buffer: Buffer,
  maxSizeBytes: number = MAX_FILE_SIZE_BYTES
): Promise<{ buffer: Buffer; mimetype: string }> => {
  if (buffer.length <= maxSizeBytes) {
    return { buffer, mimetype: "image/webp" }
  }

  let quality = 80
  let width = 1600

  let metadata
  try {
    metadata = await sharp(buffer).metadata()
    if (metadata.width && metadata.width < width) {
      width = metadata.width
    }
  } catch {
    // Continue with default width
  }

  let processedBuffer = await sharp(buffer)
    .resize({ width, fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer()

  while (processedBuffer.length > maxSizeBytes && quality > 20) {
    quality -= 15
    if (quality <= 30 && width > 600) {
      width = Math.round(width * 0.8)
    }
    processedBuffer = await sharp(buffer)
      .resize({ width, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer()
  }

  return { buffer: processedBuffer, mimetype: "image/webp" }
}

/**
 * Uploads a file buffer to Supabase Storage and returns its public URL.
 * Automatically resizes & compresses images larger than 500 KB.
 */
export const uploadToSupabase = async (
  file: Express.Multer.File,
  folder: string = "general"
): Promise<string> => {
  if (!file || !file.buffer) {
    throw new Error("Invalid file upload: empty buffer")
  }

  // Ensure image is compressed under 500 KB
  const { buffer: processedBuffer, mimetype } = await compressImageBuffer(file.buffer, MAX_FILE_SIZE_BYTES)

  const ext = ".webp"
  const fileName = `${folder}/${crypto.randomUUID()}-${Date.now()}${ext}`
  const bucketName = env.supabase.storageBucket || "open-po-gess"

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, processedBuffer, {
      contentType: mimetype,
      upsert: true,
    })

  if (error) {
    throw new Error(`Failed to upload image to Supabase Storage: ${error.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path)

  return publicUrlData.publicUrl
}

/**
 * Deletes a file from Supabase Storage given its public URL or storage path.
 */
export const deleteFromSupabase = async (fileUrlOrPath: string): Promise<void> => {
  if (!fileUrlOrPath) return
  const bucketName = env.supabase.storageBucket || "open-po-gess"

  let storagePath = fileUrlOrPath
  if (fileUrlOrPath.includes(`/storage/v1/object/public/${bucketName}/`)) {
    storagePath = fileUrlOrPath.split(`/storage/v1/object/public/${bucketName}/`)[1]
  } else if (fileUrlOrPath.startsWith("http://") || fileUrlOrPath.startsWith("https://")) {
    try {
      const url = new URL(fileUrlOrPath)
      const pathParts = url.pathname.split("/")
      const bucketIndex = pathParts.indexOf(bucketName)
      if (bucketIndex !== -1) {
        storagePath = pathParts.slice(bucketIndex + 1).join("/")
      }
    } catch {
      // Keep storagePath as is if parsing fails
    }
  }

  const { error } = await supabase.storage
    .from(bucketName)
    .remove([storagePath])

  if (error) {
    console.error(`Warning: Failed to delete image from Supabase Storage (${storagePath}):`, error.message)
  }
}
