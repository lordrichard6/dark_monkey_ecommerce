-- Add story content to products for brand storytelling
-- Stores rich content with title, body (HTML), images, and optional video

ALTER TABLE products 
ADD COLUMN story_content JSONB DEFAULT '{}';

-- Add index for products with stories (for filtering/querying)
CREATE INDEX idx_products_with_story 
ON products((story_content->>'published')) 
WHERE (story_content->>'published')::boolean = true;

-- Add comment for documentation
COMMENT ON COLUMN products.story_content IS 'Rich story content: { title, body (HTML), images[], video_url, published }';

-- Example story_content structure:
-- {
--   "title": "The Story Behind This Design",
--   "body": "<p>This product was inspired by...</p>",
--   "images": ["https://...", "https://..."],
--   "video_url": "https://youtube.com/...",
--   "published": true
-- }
