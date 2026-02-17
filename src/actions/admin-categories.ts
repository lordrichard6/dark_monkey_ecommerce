'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  parent_id: z.string().uuid().optional().nullable(),
  sort_order: z.coerce.number().default(0),
})

export type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type ActionState = {
  ok: boolean
  error?: string
  data?: Category
}

export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  return data as Category[]
}

export async function getCategory(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('categories').select('*').eq('id', id).single()

  if (error) return null
  return data as Category
}

export async function upsertCategory(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = {
    id: formData.get('id') as string,
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    image_url: formData.get('image_url'),
    parent_id: formData.get('parent_id') || null,
    sort_order: formData.get('sort_order'),
  }

  const validated = CategorySchema.safeParse(rawData)

  if (!validated.success) {
    return {
      ok: false,
      error: validated.error.errors[0].message,
    }
  }

  const supabase = await createClient()
  const { id, ...payload } = validated.data

  let error
  if (id) {
    // Update
    const { error: updateError } = await supabase.from('categories').update(payload).eq('id', id)
    error = updateError
  } else {
    // Insert
    const { error: insertError } = await supabase.from('categories').insert(payload)
    error = insertError
  }

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/categories')
  return { ok: true }
}

export async function deleteCategory(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/categories')
  return { ok: true }
}
