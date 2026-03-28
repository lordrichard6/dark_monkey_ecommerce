'use client'

/**
 * Client-side confirmation handler for password recovery links.
 *
 * Supabase admin-generated recovery links (generateLink) bypass the PKCE
 * initiation step, so there is no code_verifier cookie on the browser.
 * The server-side /auth/callback route fails because exchangeCodeForSession
 * requires a matching verifier. This client component handles both cases:
 *
 *   - PKCE flow: Supabase appends ?code=… as a query parameter
 *   - Implicit flow: Supabase appends #access_token=…&refresh_token=…
 *
 * After establishing the session the user is sent to /auth/reset-password.
 */

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ConfirmClient() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = (params.locale as string) ?? 'en'
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function handleConfirm() {
      const supabase = createClient()

      // PKCE flow — code arrives as a query parameter
      const code = searchParams.get('code')

      // Implicit flow — tokens arrive in the URL hash (never sent to the server)
      const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token') ?? ''

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        } else {
          throw new Error('No auth token found in URL')
        }

        router.replace(`/${locale}/auth/reset-password`)
      } catch (err) {
        console.error('[auth/confirm]', err)
        setErrorMsg('This link has expired or already been used. Please request a new one.')
      }
    }

    handleConfirm()
  }, [router, locale, searchParams])

  if (errorMsg) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
        <div className="space-y-4 text-center">
          <p className="text-red-400">{errorMsg}</p>
          <a
            href={`/${locale}/forgot-password`}
            className="block text-sm text-zinc-400 underline hover:text-zinc-200"
          >
            Request a new password reset link
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <p className="text-zinc-400">Verifying your link…</p>
    </div>
  )
}
