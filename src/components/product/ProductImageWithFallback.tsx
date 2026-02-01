'use client'

import { useState } from 'react'
import Image from 'next/image'

type ProductImageWithFallbackProps = {
  src: string
  alt: string
  fill?: boolean
  sizes?: string
  unoptimized?: boolean
  priority?: boolean
  className?: string
}

export function ProductImageWithFallback({
  src,
  alt,
  fill = true,
  sizes,
  unoptimized,
  priority,
  className,
}: ProductImageWithFallbackProps) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 text-center text-zinc-500">
        <span className="px-2 text-xs">No image</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      unoptimized={unoptimized}
      priority={priority}
      className={className}
      onError={() => setError(true)}
    />
  )
}
