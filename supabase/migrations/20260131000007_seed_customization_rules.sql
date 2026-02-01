-- Customization rules for products with is_customizable = true
-- rule_def.fields: array of { key, type, label, maxLength?, priceModifierCents?, options? }

INSERT INTO customization_rules (product_id, rule_def) VALUES
  -- Premium Hoodie: custom print text
  ('22222222-2222-2222-2222-222222222201', '{
    "fields": [
      { "key": "print_text", "type": "text", "label": "Custom text or initials", "placeholder": "e.g. Your initials", "maxLength": 15, "priceModifierCents": 800 }
    ]
  }'::jsonb),

  -- Ceramic Mug
  ('22222222-2222-2222-2222-222222222205', '{
    "fields": [
      { "key": "engraving", "type": "text", "label": "Text to engrave", "placeholder": "Your name or message", "maxLength": 25, "priceModifierCents": 500 }
    ]
  }'::jsonb),

  -- Tumbler
  ('22222222-2222-2222-2222-222222222206', '{
    "fields": [
      { "key": "custom_text", "type": "text", "label": "Custom text", "placeholder": "Add your text", "maxLength": 30, "priceModifierCents": 600 }
    ]
  }'::jsonb),

  -- Espresso Set
  ('22222222-2222-2222-2222-222222222207', '{
    "fields": [
      { "key": "personalisation", "type": "text", "label": "Personalise both cups", "placeholder": "e.g. A & B or names", "maxLength": 20, "priceModifierCents": 400 }
    ]
  }'::jsonb),

  -- Travel Mug
  ('22222222-2222-2222-2222-222222222208', '{
    "fields": [
      { "key": "engraved_message", "type": "text", "label": "Engraved message", "placeholder": "Your message", "maxLength": 40, "priceModifierCents": 700 }
    ]
  }'::jsonb),

  -- Baseball Cap
  ('22222222-2222-2222-2222-222222222209', '{
    "fields": [
      { "key": "logo_text", "type": "text", "label": "Text for front", "placeholder": "Company or name", "maxLength": 12, "priceModifierCents": 400 }
    ]
  }'::jsonb),

  -- Dad Hat
  ('22222222-2222-2222-2222-222222222210', '{
    "fields": [
      { "key": "embroidery_text", "type": "text", "label": "Embroidered text", "placeholder": "Your text", "maxLength": 10, "priceModifierCents": 350 }
    ]
  }'::jsonb),

  -- Snapback
  ('22222222-2222-2222-2222-222222222211', '{
    "fields": [
      { "key": "front_text", "type": "text", "label": "Front logo text", "placeholder": "Your brand", "maxLength": 12, "priceModifierCents": 450 }
    ]
  }'::jsonb),

  -- Bucket Hat
  ('22222222-2222-2222-2222-222222222212', '{
    "fields": [
      { "key": "print_text", "type": "text", "label": "Custom print text", "placeholder": "Your design text", "maxLength": 15, "priceModifierCents": 500 }
    ]
  }'::jsonb);

