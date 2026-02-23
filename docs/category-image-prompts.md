# Category Image Prompts — Dark Monkey

## Style Guide

All images must follow these rules for visual consistency:

- **Mood:** Dark, cinematic, high-contrast, editorial
- **Lighting:** Dramatic — neon, studio strobes, or single hard light source. Deep blacks, intentional shadows
- **Color palette:** Near-black backgrounds, amber/gold or color-specific accent tones, no flat or pastel colors
- **Composition:** Subject fills the frame. Strong foreground interest, room to breathe at the top (text overlays the bottom)
- **Feel:** Gritty, raw, premium streetwear brand. Think Nike x Supreme x Rick Owens campaign
- **Aspect ratio:** `1:1` (square) — cards render in square format
- **Resolution:** 1200 × 1200 px minimum
- **Format:** WebP or JPEG, compressed for web

> The images render at ~400px tall inside rounded cards with a heavy `from-zinc-950 to-transparent` gradient overlay at the bottom and `opacity-60` on the image itself. Make the images vivid and high-contrast — they'll appear darker on the page.

---

## Parent Category Prompts (10 images)

These are the images shown on `/categories`.

---

### 1. Gym & Fitness

**Slug:** `gym-fitness`

```
Cinematic close-up of a powerlifter's chalk-covered fists gripping a barbed iron barbell, dramatic hard side-lighting casting deep shadows across tensed forearm muscles, weightlifting plates blurred in background, dark gym atmosphere, dust and chalk particles floating in the beam of a single industrial spotlight, raw concrete floor, deep blacks, amber-tinted highlights, editorial sports photography, ultra-sharp, 1:1 square
```

---

### 2. Tuning & Cars

**Slug:** `tuning-cars`

```
Low-angle cinematic shot of a slammed matte-black sports car parked on wet asphalt at night, neon blue and orange underlighting reflecting on the ground, light trails from passing traffic blurred in the background, exhaust smoke curling upward, dark urban parking garage setting, deep moody shadows, glossy carbon fiber details, aggressive wide-body kit, high-end automotive editorial photography, 1:1 square
```

---

### 3. Memes & Fun

**Slug:** `memes-fun`

```
Chaotic pop-art collage explosion — bold halftone dots, retro comic speech bubbles, oversized emoji rendered as textured 3D objects, VHS glitch artifacts, neon magenta and cyan color bleed on a near-black background, laughing faces as bold graphic shapes, maximalist internet culture aesthetic, controlled chaos, high-contrast, editorial graphic design photography, 1:1 square
```

---

### 4. Street & Urban

**Slug:** `street-urban`

```
Hooded figure leaning against a graffiti-covered concrete wall at night, face obscured in shadow, single harsh streetlight overhead casting a dramatic pool of amber light, rain-wet pavement reflecting neon signs, layers of spray-painted tags and paste-ups behind, urban underground atmosphere, desaturated with amber accent tones, cinematic film grain, gritty street photography editorial, 1:1 square
```

---

### 5. Dark & Gothic

**Slug:** `dark-gothic`

```
Dramatic close-up of a black raven perched on a human skull, surrounded by black smoke and dying candlelight, dark velvet and iron chains in the background, deep crimson and shadow tones, gothic altar aesthetic, candle wax dripping over aged bone, baroque composition, macro lens detail on feathers and bone texture, ultra-cinematic dark fantasy editorial photography, 1:1 square
```

---

### 6. Anime & Manga

**Slug:** `anime-manga`

```
Hyper-detailed ink illustration portrait in dark anime style — lone warrior figure silhouetted against a shattered moon, dramatic speed lines emanating outward, black ink splatter accents, bold brushstroke texture, monochrome with a single accent color (deep indigo or blood red), manga panel crop marks visible, cinematic composition with heavy shadows, high-contrast graphic novel aesthetic, 1:1 square
```

---

### 7. Retro & Vintage

**Slug:** `retro-vintage`

```
Vintage 35mm film photograph aesthetic — worn leather jacket draped over a 1970s jukebox in a dimly lit diner booth, heavy film grain and light leaks, faded amber and sepia tones, scratched film overlay, analog imperfections, retro neon signage glowing softly in the background, nostalgic but edgy, dark editorial fashion photography shot on expired film, 1:1 square
```

---

### 8. Nature & Wildlife

**Slug:** `nature-wildlife`

```
Lone grey wolf standing at the edge of a dark forest at dusk, breath visible in freezing air, dead trees silhouetted against a stormy charcoal sky with a sliver of blood-orange on the horizon, ground covered in frost, wolf in sharp focus with a deep dark forest background, atmospheric perspective, raw wilderness editorial wildlife photography, dramatic and foreboding, 1:1 square
```

---

### 9. Music

**Slug:** `music`

```
Silhouette of a guitarist on a smoky concert stage, backlit by a wall of blinding amber-gold stage lights cutting through thick fog, electric guitar raised mid-performance, lens flares streaking across the frame, roaring crowd a dark mass below, raw concert energy, blown-out highlights, heavy grain, rock photography editorial, cinematic and visceral, 1:1 square
```

---

### 10. Gaming

**Slug:** `gaming`

```
Cinematic overhead shot of a gaming setup at night — mechanical keyboard, controller, and headset bathed in dramatic RGB lighting (deep purple and electric blue), empty energy drink can, screens glowing with abstract game visuals, dark desk surface, light spilling through gaps in a blackout blind, moody gamer den aesthetic, editorial tech photography, ultra-sharp product details, 1:1 square
```

---

## Notes

- **Upload destination:** Supabase Storage → `category-images` bucket. Set `image_url` on each root category row in the `categories` table.
- **Naming convention:** `{slug}.webp` — e.g. `gym-fitness.webp`, `tuning-cars.webp`
- **Recommended tools:** Midjourney v6 (`--ar 1:1 --style raw --q 2`), DALL-E 3, or Stable Diffusion XL
- **Post-processing tip:** Boost contrast +15, shadows -10 in Lightroom/Photoshop before exporting — the `opacity-60` overlay on the page will soften everything slightly
