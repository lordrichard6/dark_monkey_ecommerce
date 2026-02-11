/**
 * Utility functions for handling review photo uploads
 * Includes image optimization, validation, and Supabase Storage integration
 */

import { createClient } from '@/lib/supabase/client'

const MAX_PHOTOS = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

export type PhotoUploadResult = {
    url: string
    path: string
}

export type PhotoUploadError = {
    file: File
    error: string
}

/**
 * Validate a single image file
 */
export function validatePhotoFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return `Invalid file type. Allowed: JPEG, PNG, WebP, HEIC`
    }

    if (file.size > MAX_FILE_SIZE) {
        return `File too large. Max size: 5MB`
    }

    return null
}

/**
 * Compress and optimize image before upload
 * Reduces file size while maintaining quality
 */
export async function optimizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            const img = new Image()

            img.onload = () => {
                const canvas = document.createElement('canvas')
                let { width, height } = img

                // Resize if too large (max 1200px width)
                const maxWidth = 1200
                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                ctx.drawImage(img, 0, 0, width, height)

                // Convert to blob with compression
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image'))
                            return
                        }

                        const optimizedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        })

                        resolve(optimizedFile)
                    },
                    'image/jpeg',
                    0.85 // 85% quality
                )
            }

            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = e.target?.result as string
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}

/**
 * Upload a photo to Supabase Storage
 * Path format: {userId}/{timestamp}-{filename}
 */
export async function uploadReviewPhoto(
    file: File,
    userId: string
): Promise<PhotoUploadResult> {
    const supabase = createClient()

    // Optimize image before upload
    const optimizedFile = await optimizeImage(file)

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-z0-9.-]/gi, '_')
    const fileName = `${userId}/${timestamp}-${sanitizedName}`

    const { data, error } = await supabase.storage
        .from('review-photos')
        .upload(fileName, optimizedFile, {
            cacheControl: '3600',
            upsert: false,
        })

    if (error) {
        throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('review-photos')
        .getPublicUrl(data.path)

    return {
        url: publicUrl,
        path: data.path,
    }
}

/**
 * Upload multiple photos with progress tracking
 */
export async function uploadReviewPhotos(
    files: File[],
    userId: string,
    onProgress?: (uploaded: number, total: number) => void
): Promise<{
    successful: PhotoUploadResult[]
    failed: PhotoUploadError[]
}> {
    if (files.length > MAX_PHOTOS) {
        throw new Error(`Maximum ${MAX_PHOTOS} photos allowed`)
    }

    const successful: PhotoUploadResult[] = []
    const failed: PhotoUploadError[] = []

    for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate
        const validationError = validatePhotoFile(file)
        if (validationError) {
            failed.push({ file, error: validationError })
            continue
        }

        // Upload
        try {
            const result = await uploadReviewPhoto(file, userId)
            successful.push(result)

            if (onProgress) {
                onProgress(i + 1, files.length)
            }
        } catch (error) {
            failed.push({
                file,
                error: error instanceof Error ? error.message : 'Upload failed',
            })
        }
    }

    return { successful, failed }
}

/**
 * Delete a photo from Supabase Storage
 */
export async function deleteReviewPhoto(path: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase.storage
        .from('review-photos')
        .remove([path])

    if (error) {
        throw new Error(`Delete failed: ${error.message}`)
    }
}

/**
 * Get image dimensions for display
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => resolve({ width: img.width, height: img.height })
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = e.target?.result as string
        }

        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}

export { MAX_PHOTOS, MAX_FILE_SIZE, ALLOWED_TYPES }
