
-- Add foreign key from product_reviews to user_profiles to enable PostgREST embedding
ALTER TABLE "public"."product_reviews"
ADD CONSTRAINT "product_reviews_user_id_fkey_profiles"
FOREIGN KEY ("user_id")
REFERENCES "public"."user_profiles" ("id")
ON DELETE CASCADE;
