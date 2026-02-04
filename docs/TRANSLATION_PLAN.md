# DarkMonkey — Translation Plan

## Languages
- **en** — English (default)
- **pt** — Portuguese
- **de** — German
- **it** — Italian
- **fr** — French

## Locale detection
- First visit: use browser `Accept-Language` (next-intl middleware).
- Later: use `NEXT_LOCALE` cookie if set (user can switch language).

---

## Pages & components that need translation

### Public (store)
| Route / Component | File(s) | Strings to translate |
|-------------------|---------|------------------------|
| **Home** | `app/page.tsx`, `Hero.tsx`, `ProductGrid.tsx` | Metadata, "Featured products", "Premium", "quality, crafted for", "you", "For customers who demand...", "Shop now", "Browse categories", sort labels ("Newest", "Price: low/high"), "No products yet..." |
| **Categories list** | `(store)/categories/page.tsx` | Page title, empty state |
| **Category by slug** | `(store)/categories/[slug]/page.tsx` | Title, breadcrumb, empty state |
| **Product detail** | `(store)/products/[slug]/page.tsx`, `add-to-cart-form.tsx` | "Add to cart", variant labels, price, description |
| **Layout (store)** | `(store)/layout.tsx` | (if any) |

### Layout (global)
| Component | File(s) | Strings |
|-----------|---------|---------|
| **Root layout** | `app/layout.tsx` | Metadata: title, description |
| **Header** | `Header.tsx` (server), `SideNav.tsx`, `DesktopTopBar.tsx`, `MobileHeader.tsx` | "Shop", "Wishlist", "Categories", "All categories", "Admin", "Dashboard", "Products", "Orders", "Discounts" |
| **User menu** | `UserMenuDropdown.tsx` | "Account", "Orders", "Wishlist", "Sign out", "Sign in/up" |
| **Cart** | `CartTrigger.tsx`, `CartDrawer.tsx` | "Cart", "View cart", item count, "Checkout", "Your cart is empty" |
| **Cookie consent** | `CookieConsent.tsx` | Cookie text, "Privacy & Cookies", "Accept" |

### Auth
| Route / Component | File(s) | Strings |
|------------------|---------|---------|
| **Login** | `login/page.tsx`, `login-form.tsx` | "Sign in", "Sign up", "Email", "Password", "Forgot password?", "Create account", "Passwords do not match", errors, "Account created", "Check your email...", "Start shopping", "Continue shopping without account", "Contact support" |
| **Forgot password** | `(account)/forgot-password/page.tsx`, `forgot-password-form.tsx` | Title, instructions, "Send reset link" |
| **Reset password** | `auth/reset-password/page.tsx`, `reset-password-form.tsx` | Title, "New password", "Reset password" |
| **Auth callback** | (no UI) | — |

### Account (logged-in)
| Route | File(s) | Strings |
|-------|---------|---------|
| **Account dashboard** | `account/page.tsx` | "Account", "Profile", "Orders", "Wishlist", addresses |
| **Orders list** | `account/orders/page.tsx` | "Orders", "Order", "Date", "Status", "Total", status values |
| **Order detail** | `account/orders/[id]/page.tsx` | "Order", "Status", "Items", "Total", status labels |
| **Wishlist** | `account/wishlist/page.tsx` | "Wishlist", "Your wishlist is empty" |
| **Profile / Address** | `account/ProfileEditForm.tsx`, `AddressForm.tsx`, `AddressList.tsx` | Labels, "Save", "Add address" |

### Checkout
| Route | File(s) | Strings |
|-------|---------|---------|
| **Checkout** | `(checkout)/checkout/page.tsx`, `checkout-form.tsx` | "Checkout", "Shipping", "Payment", "Place order", field labels |
| **Success** | `(checkout)/checkout/success/page.tsx` | "Thank you", "Order confirmed", "Payment received" |

### Static / legal
| Route | File(s) | Strings |
|-------|---------|---------|
| **Privacy** | `privacy/page.tsx` | Full page content (privacy policy, cookies) |

### Admin (optional — can stay EN for now)
| Route | File(s) | Strings |
|-------|---------|---------|
| **Admin login** | `admin/login/page.tsx`, `admin-login-form.tsx` | "Admin", "Sign in" |
| **Admin dashboard** | `admin/(dashboard)/dashboard/page.tsx`, orders, products, discounts | Table headers, "Status", "Orders", "Products", "Discounts", form labels |

---

## Implementation order
1. **Setup** — next-intl, `[locale]` routing, middleware (browser locale), message files en/pt/de/it/fr. ✅ Done
2. **Layout** — Root layout metadata, SideNav, DesktopTopBar, MobileHeader, UserMenuDropdown, CookieConsent. ✅ Done
3. **Home** — Hero, ProductGrid, home page metadata. ✅ Done
4. **Store** — Categories pages, product detail, add-to-cart. ✅ Done
5. **Auth** — Login page + redirect; forgot password, reset password. ✅ Done
6. **Account** — Account dashboard, orders, wishlist, profile/address forms. ✅ Done
7. **Checkout** — Checkout form, success page. ✅ Done
8. **Cart** — CartTrigger, CartDrawer. ✅ Done
9. **Privacy** — Full page. ✅ Done
10. **Legal / Contact / Terms / Shipping / Refund** — Full page body content. ✅ Done
11. **Admin** — Optional; can defer or keep in EN.

### Auth callback (Supabase)
With locale routing, auth callback URLs are `/{locale}/auth/callback` (e.g. `/en/auth/callback`, `/pt/auth/callback`). Add these to your Supabase project **Authentication → URL Configuration → Redirect URLs** if using OAuth or email confirmation.

---

## Message file structure (JSON)
- `messages/en.json` (base)
- `messages/pt.json`
- `messages/de.json`
- `messages/it.json`
- `messages/fr.json`

Namespaces (optional but tidy): `common`, `home`, `auth`, `account`, `checkout`, `cart`, `cookie`, `privacy`, `admin`.

For simplicity we can use a flat or shallow structure per section, e.g.:
```json
{
  "common": { "shop": "Shop", "wishlist": "Wishlist", ... },
  "home": { "title": "Featured products", "shopNow": "Shop now", ... },
  "auth": { "signIn": "Sign in", "email": "Email", ... }
}
```
