'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Subscribes an email address to the DarkMonkey newsletter.
 * Accepts a `FormData` object (compatible with Next.js `<form action={...}>`).
 * Returns `{ success: true }` on success, `{ success: true, message }` if already subscribed,
 * or `{ error: string }` on validation or database failure.
 *
 * @param formData - Form data containing the `email` field.
 */
export async function subscribeToNewsletter(formData: FormData) {
  const email = formData.get('email') as string

  if (!email || !email.includes('@')) {
    return { error: 'Invalid email address' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('newsletter_subs').insert([{ email }])

  if (error) {
    if (error.code === '23505') {
      return { success: true, message: 'Already subscribed!' }
    }
    console.error('Newsletter error:', error)
    return { error: 'Failed to subscribe' }
  }

  revalidatePath('/')
  return { success: true }
}
