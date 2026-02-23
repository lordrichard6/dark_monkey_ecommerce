'use server'

import { createClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const CategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  image_url: z
    .string()
    .optional()
    .transform((v) => v || undefined),
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
  product_count?: number
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
    .select('*, products(id)')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return (data ?? []).map((c: any) => ({
    ...c,
    product_count: Array.isArray(c.products) ? c.products.length : 0,
    products: undefined,
  })) as Category[]
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
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized' }

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

  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', validated.data.slug)
    .neq('id', validated.data.id ?? '')
    .maybeSingle()

  if (existing) return { ok: false, error: 'Slug is already in use by another category' }

  const { id, ...payload } = validated.data

  let error
  if (id) {
    const { error: updateError } = await supabase
      .from('categories')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
    error = updateError
  } else {
    const { error: insertError } = await supabase.from('categories').insert(payload)
    error = insertError
  }

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function reorderCategories(orderedIds: string[]): Promise<ActionState> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized' }

  const supabase = await createClient()
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from('categories')
      .update({ sort_order: i, updated_at: new Date().toISOString() })
      .eq('id', orderedIds[i])
  }

  revalidatePath('/admin/categories')
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function uploadCategoryImage(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized' }

  const file = formData.get('image_file') as File | null
  if (!file || file.size === 0) return { ok: false, error: 'No file provided' }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { ok: false, error: 'Invalid file type. Allowed: PNG, JPEG, WebP, GIF' }
  }

  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: 'File too large. Maximum size: 10MB' }
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `categories/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const supabase = await createClient()
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filename, file, { cacheControl: '3600', upsert: false })

  if (uploadError) return { ok: false, error: uploadError.message }

  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filename)
  return { ok: true, url: urlData.publicUrl }
}

export async function deleteCategory(id: string): Promise<ActionState> {
  const admin = await getAdminUser()
  if (!admin) return { ok: false, error: 'Not authorized' }

  const supabase = await createClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/categories')
  revalidatePath('/', 'layout')
  return { ok: true }
}
