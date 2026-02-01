import { ResetPasswordForm } from './reset-password-form'

export const metadata = {
  title: 'Set new password',
  description: 'Choose a new password',
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-50">Set new password</h1>
          <p className="mt-2 text-zinc-400">
            Enter your new password below.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
