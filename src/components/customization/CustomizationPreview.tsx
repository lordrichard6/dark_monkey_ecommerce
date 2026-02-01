'use client'

import Image from 'next/image'

type Props = {
  imageUrl: string
  config: Record<string, string>
  productType?: 'mug' | 'hat' | 'hoodie'
}

export function CustomizationPreview({ imageUrl, config, productType = 'mug' }: Props) {
  const text = Object.values(config).find((v) => v && String(v).trim())

  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      <Image
        src={imageUrl}
        alt="Product"
        fill
        className="object-cover"
        unoptimized={imageUrl?.includes('picsum.photos') || imageUrl?.endsWith('.svg')}
      />
      {text && (
        <div
          className="absolute inset-0 flex items-center justify-center p-4"
          aria-hidden
        >
          <span
            className="max-w-full truncate text-center font-semibold drop-shadow-lg"
            style={{
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.8), 0 0 20px rgba(251,191,36,0.4)',
              fontSize: productType === 'hat' ? 'clamp(0.6rem, 3vw, 1rem)' : 'clamp(0.8rem, 4vw, 1.25rem)',
            }}
          >
            {text}
          </span>
        </div>
      )}
    </div>
  )
}
