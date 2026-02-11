'use client'

import { useState, useRef } from 'react'
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react'
import { uploadReviewPhotos, validatePhotoFile, MAX_PHOTOS, type PhotoUploadResult } from '@/lib/review-photos'

type PhotoUploadProps = {
    userId: string
    onPhotosChange: (photos: PhotoUploadResult[]) => void
    maxPhotos?: number
}

export function PhotoUpload({ userId, onPhotosChange, maxPhotos = MAX_PHOTOS }: PhotoUploadProps) {
    const [photos, setPhotos] = useState<PhotoUploadResult[]>([])
    const [previews, setPreviews] = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState({ uploaded: 0, total: 0 })
    const [errors, setErrors] = useState<string[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        // Check photo limit
        if (photos.length + files.length > maxPhotos) {
            setErrors([`Maximum ${maxPhotos} photos allowed`])
            return
        }

        setErrors([])
        setUploading(true)

        try {
            // Upload photos
            const { successful, failed } = await uploadReviewPhotos(
                files,
                userId,
                (uploaded, total) => setProgress({ uploaded, total })
            )

            // Update photos
            const newPhotos = [...photos, ...successful]
            setPhotos(newPhotos)
            onPhotosChange(newPhotos)

            // Create previews
            const newPreviews = [...previews, ...successful.map(p => p.url)]
            setPreviews(newPreviews)

            // Show errors if any
            if (failed.length > 0) {
                setErrors(failed.map(f => `${f.file.name}: ${f.error}`))
            }
        } catch (error) {
            setErrors([error instanceof Error ? error.message : 'Upload failed'])
        } finally {
            setUploading(false)
            setProgress({ uploaded: 0, total: 0 })
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemovePhoto = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index)
        const newPreviews = previews.filter((_, i) => i !== index)

        setPhotos(newPhotos)
        setPreviews(newPreviews)
        onPhotosChange(newPhotos)
    }

    return (
        <div className="space-y-4">
            {/* Upload Button */}
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || photos.length >= maxPhotos}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-neutral-700 hover:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Upload className="w-5 h-5" />
                    )}
                    <span>
                        {uploading
                            ? `Uploading ${progress.uploaded}/${progress.total}...`
                            : `Add Photos (${photos.length}/${maxPhotos})`}
                    </span>
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <span className="text-sm text-neutral-400">
                    JPEG, PNG, WebP up to 5MB
                </span>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            {errors.map((error, i) => (
                                <p key={i} className="text-sm text-red-400">{error}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Photo Previews */}
            {previews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {previews.map((preview, index) => (
                        <div key={index} className="relative aspect-square group">
                            <img
                                src={preview}
                                alt={`Review photo ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemovePhoto(index)}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Remove photo"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
