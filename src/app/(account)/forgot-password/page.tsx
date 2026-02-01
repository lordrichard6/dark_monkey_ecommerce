import Link from 'next/link'
import { ForgotPasswordForm } from './forgot-password-form'

export const metadata = {
  title: 'Forgot password',
  description: 'Reset your password',
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-50">Forgot password</h1>
          <p className="mt-2 text-zinc-400">
            Enter your email and we&apos;ll send you a link to reset your
            password.
          </p>
        </div>
        <ForgotPasswordForm />
        <p className="text-center">
          <Link
            href="/login"
            className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
