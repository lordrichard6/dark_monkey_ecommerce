-- Seed hard-coded categories and subcategories
-- This ensures foreign key integrity for products linked to these categories

-- Clear existing categories if any (careful with foreign keys)
-- We use DO block to handle potential circular dependencies or existing products
DO $$ 
BEGIN
    -- Temporarily disable FK checks or just handle existing products by setting category_id to NULL
    UPDATE products SET category_id = NULL;
    DELETE FROM categories;

    -- Top-level categories
    INSERT INTO categories (id, name, slug, sort_order) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Men''s clothing', 'mens-clothing', 1),
    ('550e8400-e29b-41d4-a716-446655440002', 'Women''s clothing', 'womens-clothing', 2),
    ('550e8400-e29b-41d4-a716-446655440003', 'Kids'' & youth clothing', 'kids-youth-clothing', 3),
    ('550e8400-e29b-41d4-a716-446655440004', 'Hats', 'hats', 4),
    ('550e8400-e29b-41d4-a716-446655440005', 'Accessories', 'accessories', 5),
    ('550e8400-e29b-41d4-a716-446655440006', 'Home & living', 'home-living', 6);

    -- Subcategories for Men
    INSERT INTO categories (id, name, slug, sort_order, parent_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440011', 'T-shirts', 'mens-t-shirts', 1, '550e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440012', 'Hoodies', 'mens-hoodies', 2, '550e8400-e29b-41d4-a716-446655440001'),
    ('550e8400-e29b-41d4-a716-446655440013', 'Pants', 'mens-pants', 3, '550e8400-e29b-41d4-a716-446655440001');

    -- Subcategories for Women
    INSERT INTO categories (id, name, slug, sort_order, parent_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440021', 'T-shirts', 'womens-t-shirts', 1, '550e8400-e29b-41d4-a716-446655440002'),
    ('550e8400-e29b-41d4-a716-446655440022', 'Hoodies', 'womens-hoodies', 2, '550e8400-e29b-41d4-a716-446655440002'),
    ('550e8400-e29b-41d4-a716-446655440023', 'Dresses', 'womens-dresses', 3, '550e8400-e29b-41d4-a716-446655440002');

    -- Subcategories for Kids
    INSERT INTO categories (id, name, slug, sort_order, parent_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440031', 'T-shirts', 'kids-t-shirts', 1, '550e8400-e29b-41d4-a716-446655440003'),
    ('550e8400-e29b-41d4-a716-446655440032', 'Hoodies', 'kids-hoodies', 2, '550e8400-e29b-41d4-a716-446655440003');

    -- Subcategories for Hats
    INSERT INTO categories (id, name, slug, sort_order, parent_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440041', 'Caps', 'caps', 1, '550e8400-e29b-41d4-a716-446655440004'),
    ('550e8400-e29b-41d4-a716-446655440042', 'Beanies', 'beanies', 2, '550e8400-e29b-41d4-a716-446655440004');

    -- Subcategories for Accessories
    INSERT INTO categories (id, name, slug, sort_order, parent_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440051', 'Bags', 'bags', 1, '550e8400-e29b-41d4-a716-446655440005'),
    ('550e8400-e29b-41d4-a716-446655440052', 'Phone Cases', 'phone-cases', 2, '550e8400-e29b-41d4-a716-446655440005');

    -- Subcategories for Home
    INSERT INTO categories (id, name, slug, sort_order, parent_id) VALUES
    ('550e8400-e29b-41d4-a716-446655440061', 'Mugs', 'mugs', 1, '550e8400-e29b-41d4-a716-446655440006'),
    ('550e8400-e29b-41d4-a716-446655440062', 'Posters', 'posters', 2, '550e8400-e29b-41d4-a716-446655440006'),
    ('550e8400-e29b-41d4-a716-446655440063', 'Pillows', 'pillows', 3, '550e8400-e29b-41d4-a716-446655440006');

END $$;
