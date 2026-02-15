'use client'

import { useState } from 'react'
import { Share2, Facebook, Twitter, Link2, Mail, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

type ShareButtonProps = {
    productName: string
    productUrl: string
    productImage?: string
}

export function ShareButton({ productName, productUrl, productImage }: ShareButtonProps) {
    const t = useTranslations('product')
    const [isOpen, setIsOpen] = useState(false)
    const [copied, setCopied] = useState(false)

    const fullUrl = typeof window !== 'undefined'
        ? `${window.location.origin}${productUrl}`
        : productUrl

    const shareData = {
        title: productName,
        text: t('shareText', { productName }),
        url: fullUrl,
    }

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share(shareData)
            } catch (err) {
                // User cancelled or error
            }
        } else {
            setIsOpen(true)
        }
    }

    const copyLink = async () => {
        await navigator.clipboard.writeText(fullUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(productName)}`,
        pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(fullUrl)}&media=${encodeURIComponent(productImage || '')}&description=${encodeURIComponent(productName)}`,
        email: `mailto:?subject=${encodeURIComponent(productName)}&body=${encodeURIComponent(`Check out this product: ${fullUrl}`)}`,
    }

    return (
        <div className="relative">
            <button
                onClick={handleNativeShare}
                className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700"
            >
                <Share2 className="h-4 w-4" />
                {t('share')}
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-zinc-700 bg-zinc-800 p-4 shadow-xl">
                        <p className="mb-3 text-sm font-medium text-zinc-300">{t('shareVia')}</p>
                        <div className="space-y-2">
                            <a
                                href={shareUrls.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-lg p-2 text-sm text-zinc-300 hover:bg-zinc-700"
                            >
                                <Facebook className="h-4 w-4" />
                                Facebook
                            </a>
                            <a
                                href={shareUrls.twitter}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-lg p-2 text-sm text-zinc-300 hover:bg-zinc-700"
                            >
                                <Twitter className="h-4 w-4" />
                                Twitter
                            </a>
                            <a
                                href={shareUrls.pinterest}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-lg p-2 text-sm text-zinc-300 hover:bg-zinc-700"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                                </svg>
                                Pinterest
                            </a>
                            <a
                                href={shareUrls.email}
                                className="flex items-center gap-3 rounded-lg p-2 text-sm text-zinc-300 hover:bg-zinc-700"
                            >
                                <Mail className="h-4 w-4" />
                                Email
                            </a>
                            <button
                                onClick={copyLink}
                                className="flex w-full items-center gap-3 rounded-lg p-2 text-sm text-zinc-300 hover:bg-zinc-700"
                            >
                                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Link2 className="h-4 w-4" />}
                                {copied ? t('linkCopied') : t('copyLink')}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
