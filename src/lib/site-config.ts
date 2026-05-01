/**
 * Single source of truth for site-wide URLs, branding, and social handles.
 *
 * Before this file existed, BASE_URL was duplicated as
 * `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch'`
 * across 10+ files (sitemap, robots, every layout, every product/blog page).
 * Keep new references centralized here.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.dark-monkey.ch').replace(
  /\/$/,
  ''
)

export const BRAND_NAME = 'Dark Monkey'

// Social handles — preserved from existing code without renaming, since
// the audit can't verify which accounts are actually live.
// → If any handle below is wrong, fix it HERE and every consumer updates.
export const TWITTER_HANDLE = '@darkmonkey' // src/app/layout.tsx (Twitter card)
export const INSTAGRAM_HANDLE = '@dark_monkey_store' // src/components/social/SocialSection.tsx (visible)
export const TIKTOK_HANDLE = '@darkmonkey' // src/app/[locale]/layout.tsx (TikTok URL)

/**
 * Default <meta name="description"> for pages that don't supply their own.
 * Was generic ("Premium gamified e-commerce — commerce, customization,
 * progression"). Replaced with copy that names the brand, the product
 * category, and a benefit, so SERP snippets stop being noise.
 */
export const DEFAULT_DESCRIPTION =
  'Dark Monkey — premium streetwear and lifestyle apparel. On-demand printed in Switzerland, designed to last. Free returns, fast shipping, and a loyalty program that rewards every order.'
