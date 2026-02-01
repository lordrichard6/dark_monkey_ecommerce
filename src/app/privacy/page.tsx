import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy & Cookies',
  description: 'DarkMonkey privacy policy and cookie usage.',
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <nav className="mb-8 text-sm text-zinc-500">
        <Link href="/" className="hover:text-zinc-300">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-400">Privacy &amp; Cookies</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold text-zinc-50">
        Privacy &amp; Cookies
      </h1>

      <div className="space-y-8 text-zinc-300">
        <section>
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">
            Cookies We Use
          </h2>
          <p className="mb-4 leading-relaxed">
            DarkMonkey uses cookies to provide essential functionality and
            improve your experience. By using our site, you consent to the use
            of these cookies.
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong className="text-zinc-200">Cart cookie</strong> — Stores
              your shopping cart so items persist across sessions (7 days).
            </li>
            <li>
              <strong className="text-zinc-200">Authentication cookies</strong>{' '}
              — Used when you sign in to keep you logged in securely.
            </li>
            <li>
              <strong className="text-zinc-200">Consent cookie</strong> —
              Remembers that you accepted our cookie policy.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">
            Data We Collect
          </h2>
          <p className="leading-relaxed">
            When you place an order, we collect your name, email, shipping
            address, and payment information (processed securely via Stripe). We
            use this solely to fulfill your order and communicate with you about
            it.
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-zinc-50">
            Your Rights
          </h2>
          <p className="leading-relaxed">
            You may request access to, correction of, or deletion of your
            personal data. Contact us for any privacy-related inquiries.
          </p>
        </section>
      </div>

      <div className="mt-12">
        <Link
          href="/"
          className="text-amber-400 hover:text-amber-300"
        >
          ← Back to shop
        </Link>
      </div>
    </div>
  )
}
