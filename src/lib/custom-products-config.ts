// ─── Custom Products — shared types & constants ──────────────────────────────
// This file has NO 'use server' directive so it can export plain objects safely.
// Import types + ARTICLE_PRICES_CENTS from here instead of from the server action.

export type ArtStyle =
  | 'minimalist'
  | 'streetwear'
  | 'vintage'
  | 'abstract'
  | 'geometric'
  | 'anime'
  | 'typography'
  | 'photorealistic'

export type ArticleType =
  | 'tshirt'
  | 'hoodie'
  | 'sweatshirt'
  | 'cap'
  | 'tote_bag'
  | 'mug'
  | 'phone_case'

export const ARTICLE_PRICES_CENTS: Record<ArticleType, number> = {
  tshirt: 5500,
  hoodie: 8500,
  sweatshirt: 7500,
  cap: 5000,
  tote_bag: 4500,
  mug: 3500,
  phone_case: 5000,
}

export type CustomProductRequest = {
  id: string
  user_id: string
  images: string[]
  art_style: ArtStyle
  article_type: ArticleType
  description: string
  status: 'pending' | 'in_review' | 'ready' | 'rejected'
  change_count: number
  product_id: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
}

export type CustomProductChangeRequest = {
  id: string
  request_id: string
  user_id: string
  note: string
  is_free: boolean
  stripe_session_id: string | null
  paid_at: string | null
  created_at: string
}
