-- Add photo support to product reviews
-- Photos stored as array of Supabase Storage URLs

ALTER TABLE product_reviews 
ADD COLUMN photos TEXT[] DEFAULT '{}';

-- Add index for reviews with photos (for filtering/sorting)
CREATE INDEX idx_product_reviews_with_photos 
ON product_reviews((ARRAY_LENGTH(photos, 1))) 
WHERE ARRAY_LENGTH(photos, 1) > 0;

-- Add comment for documentation
COMMENT ON COLUMN product_reviews.photos IS 'Array of Supabase Storage URLs for review photos (max 5)';
