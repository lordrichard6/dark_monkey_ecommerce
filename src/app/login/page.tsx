import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const supabase = await createClient()
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Invalid refresh token (stale session) — treat as logged out
  }

  if (user) {
    const { redirectTo } = await searchParams
    redirect(redirectTo ?? '/account')
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-50">Sign in</h1>
          <p className="mt-2 text-zinc-400">
            Sign in or create an account to save addresses, track orders, and
            earn rewards.
          </p>
          <a
            href="/categories"
            className="mt-4 inline-block text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
          >
            Continue shopping without account
          </a>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
