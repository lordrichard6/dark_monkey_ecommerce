// Personalization utilities for preferred size, style matching, birthday discounts

import { createClient } from '@/lib/supabase/client'

export type UserPreferences = {
  preferred_size?: string | null
  style_preferences?: string[] | null
  birthday?: string | null
}

// Check if today is user's birthday
export function isBirthday(birthday: string | null): boolean {
  if (!birthday) return false

  const today = new Date()
  const birthDate = new Date(birthday)

  return (
    today.getMonth() === birthDate.getMonth() &&
    today.getDate() === birthDate.getDate()
  )
}

// Calculate birthday discount (e.g., 15% off)
export const BIRTHDAY_DISCOUNT_PERCENT = 15

// Get user preferences
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const supabase = createClient()

  const { data } = await supabase
    .from('user_profiles')
    .select('preferred_size, style_preferences, birthday')
    .eq('id', userId)
    .single()

  return data
}

// Auto-select preferred size in product page
export function getPreferredSize(
  availableSizes: string[],
  preferredSize: string | null
): string | null {
  if (!preferredSize || !availableSizes.includes(preferredSize)) {
    return null
  }
  return preferredSize
}

// Match products to user's style preferences
export function matchesStylePreferences(
  productTags: string[],
  userStyles: string[] | null
): boolean {
  if (!userStyles || userStyles.length === 0) return true // No preferences, show all

  // Check if any product tag matches user's style preferences
  return productTags.some((tag) =>
    userStyles.some((style) => tag.toLowerCase().includes(style.toLowerCase()))
  )
}

// Calculate style match score (0-100)
export function calculateStyleScore(
  productTags: string[],
  userStyles: string[] | null
): number {
  if (!userStyles || userStyles.length === 0) return 50 // Neutral score

  const matches = productTags.filter((tag) =>
    userStyles.some((style) => tag.toLowerCase().includes(style.toLowerCase()))
  )

  return Math.min(100, (matches.length / userStyles.length) * 100)
}

// Award birthday points
export async function awardBirthdayPoints(userId: string): Promise<boolean> {
  const supabase = createClient()

  try {
    // Check if birthday points already awarded this year
    const currentYear = new Date().getFullYear()
    const { data: existingTransaction } = await supabase
      .from('points_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('reason', 'birthday')
      .gte('created_at', `${currentYear}-01-01`)
      .single()

    if (existingTransaction) {
      return false // Already awarded this year
    }

    // Award points
    const { error } = await supabase.from('points_transactions').insert({
      user_id: userId,
      points: 500,
      reason: 'birthday',
    })

    if (error) throw error

    // Update total points in profile
    await supabase.rpc('increment', {
      table_name: 'user_profiles',
      row_id: userId,
      column_name: 'total_points',
      amount: 500,
    })

    return true
  } catch (error) {
    console.error('Error awarding birthday points:', error)
    return false
  }
}
