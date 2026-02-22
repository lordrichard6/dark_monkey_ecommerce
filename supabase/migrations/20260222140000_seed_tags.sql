-- Seed tags across 4 tiers: niche (per category), product status, design style, occasion

INSERT INTO tags (name, slug) VALUES

  -- ── Niche: Gym & Fitness ──────────────────────────────────────
  ('Bodybuilding',      'bodybuilding'),
  ('Crossfit',          'crossfit'),
  ('MMA',               'mma'),
  ('Boxing',            'boxing'),
  ('Running',           'running'),
  ('Calisthenics',      'calisthenics'),

  -- ── Niche: Tuning & Cars ─────────────────────────────────────
  ('JDM',               'jdm'),
  ('Drift',             'drift'),
  ('BMW',               'bmw'),
  ('Euro',              'euro'),
  ('Muscle Car',        'muscle-car'),
  ('Lowrider',          'lowrider'),
  ('Stance',            'stance'),

  -- ── Niche: Memes & Fun ───────────────────────────────────────
  ('Dark Humor',        'dark-humor'),
  ('Sarcastic',         'sarcastic'),
  ('Internet Culture',  'internet-culture'),
  ('Portuguese Memes',  'portuguese-memes'),

  -- ── Niche: Street & Urban ────────────────────────────────────
  ('Graffiti',          'graffiti'),
  ('Hip-Hop',           'hip-hop'),
  ('Skateboarding',     'skateboarding'),
  ('Streetwear',        'streetwear'),

  -- ── Niche: Dark & Gothic ─────────────────────────────────────
  ('Skulls',            'skulls'),
  ('Horror',            'horror'),
  ('Occult',            'occult'),
  ('Tattoo Art',        'tattoo-art'),

  -- ── Niche: Anime & Manga ─────────────────────────────────────
  ('Dragon Ball',       'dragon-ball'),
  ('Naruto',            'naruto'),
  ('One Piece',         'one-piece'),
  ('Demon Slayer',      'demon-slayer'),
  ('Jujutsu Kaisen',    'jujutsu-kaisen'),
  ('Original Art',      'original-art'),

  -- ── Niche: Retro & Vintage ───────────────────────────────────
  ('80s',               '80s'),
  ('90s',               '90s'),
  ('Vaporwave',         'vaporwave'),
  ('Old School',        'old-school'),

  -- ── Niche: Nature & Wildlife ─────────────────────────────────
  ('Wolf',              'wolf'),
  ('Eagle',             'eagle'),
  ('Bear',              'bear'),
  ('Forest',            'forest'),
  ('Ocean',             'ocean'),

  -- ── Niche: Music ─────────────────────────────────────────────
  ('Rock',              'rock'),
  ('Metal',             'metal'),
  ('Electronic',        'electronic'),

  -- ── Niche: Gaming ────────────────────────────────────────────
  ('RPG',               'rpg'),
  ('FPS',               'fps'),
  ('Retro Gaming',      'retro-gaming'),
  ('Esports',           'esports'),

  -- ── Product Status ───────────────────────────────────────────
  ('New Arrival',       'new-arrival'),
  ('Bestseller',        'bestseller'),
  ('Limited Edition',   'limited-edition'),
  ('Sale',              'sale'),
  ('Collab',            'collab'),
  ('Staff Pick',        'staff-pick'),

  -- ── Design Style ─────────────────────────────────────────────
  ('Minimalist',        'minimalist'),
  ('Bold',              'bold'),
  ('Typography',        'typography'),
  ('Illustrative',      'illustrative'),
  ('Vintage Print',     'vintage-print'),
  ('Photorealistic',    'photorealistic'),
  ('Line Art',          'line-art'),

  -- ── Occasion & Utility ───────────────────────────────────────
  ('Gift Idea',         'gift-idea'),
  ('Unisex',            'unisex'),
  ('Oversized',         'oversized'),
  ('Summer Drop',       'summer-drop'),
  ('Winter Collection', 'winter-collection')

ON CONFLICT (slug) DO NOTHING;
