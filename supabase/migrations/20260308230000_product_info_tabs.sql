-- Product-level info fields for detail page tabs
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS material_info TEXT,
  ADD COLUMN IF NOT EXISTS care_instructions TEXT,
  ADD COLUMN IF NOT EXISTS print_method TEXT DEFAULT 'DTF (Direct to Film)',
  ADD COLUMN IF NOT EXISTS size_guide_url TEXT;

-- Store-wide tab content (GPSR + Shipment)
INSERT INTO store_settings (key, value, description)
VALUES
  (
    'gpsr_info',
    '<p><strong>Responsible Person (EU/EEA):</strong><br>Dark Monkey GmbH<br>Switzerland<br><a href="mailto:hello@dark-monkey.ch">hello@dark-monkey.ch</a></p><p style="margin-top:1rem"><strong>Manufacturer:</strong><br>Products are produced on-demand by Printful Inc., 11025 Westlake Dr, Charlotte, NC 28273, USA.</p><p style="margin-top:1rem">This product complies with applicable EU product safety regulations. For questions, contact us at <a href="mailto:hello@dark-monkey.ch">hello@dark-monkey.ch</a>.</p>',
    'GPSR compliance info shown on all product pages (EU General Product Safety Regulation)'
  ),
  (
    'shipment_info',
    '<p><strong>Production & Shipping:</strong><br>All items are printed on-demand and ship within <strong>2–4 business days</strong> of your order.</p><p style="margin-top:1rem"><strong>Delivery times:</strong></p><ul><li>Switzerland: 3–5 business days</li><li>Europe: 5–10 business days</li><li>UK / USA: 7–14 business days</li></ul><p style="margin-top:1rem"><strong>Returns:</strong><br>We accept returns within 30 days if the item is defective or damaged. Contact us at <a href="mailto:hello@dark-monkey.ch">hello@dark-monkey.ch</a> with your order number and a photo of the issue.</p><p style="margin-top:1rem"><strong>Print guarantee:</strong><br>Every item is quality-checked before shipment. If your print is faded or incorrect, we''ll replace it free of charge.</p>',
    'Shipment & returns info shown on all product pages'
  )
ON CONFLICT (key) DO NOTHING;
