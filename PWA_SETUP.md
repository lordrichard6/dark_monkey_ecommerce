# Phase 10A: PWA Foundation - Setup Instructions

## Environment Setup

### 1. Generate VAPID Keys (Already Done!)

The VAPID keys were generated using `scripts/generate-vapid-keys.js`.

**Copy the keys from the terminal output and add to `.env.local`:**

```bash
# Web Push Notifications (VAPID Keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
```

⚠️ **IMPORTANT:** 
- The public key is safe to expose (prefixed with `NEXT_PUBLIC_`)
- The private key must remain secret (no prefix)
- Both keys are already in `.gitignore` via `.env.local`

### 2. Install Dependencies

```bash
npm install web-push
npm install --save-dev sharp
```

### 3. Database Migration

```bash
supabase db reset  # Local
# OR
supabase db push   # Production
```

Migrations applied:
- `20260211000002_push_notifications.sql` - Push subscriptions table

---

## Testing the PWA

### Test in Production Mode

Service worker only runs in production:

```bash
npm run build
npm run start
```

Then visit `http://localhost:3000`

### Test Install Prompt

**Chrome Desktop/Android:**
1. Visit site in production mode
2. Install banner appears automatically
3. Click "Install App"
4. App added to device

**iOS Safari:**
1. Visit site
2. Tap Share button
3. "Add to Home Screen"
4. "Add"

### Test Offline Mode

1. Open DevTools → Network tab
2. Set to "Offline"
3. Browse products (should work)
4. Visit new page → See offline page
5. Set back to "Online"

### Test Push Notifications

1. Enable notifications in `NotificationSettings` component
2. Click "Send Test" button
3. Check for notification
4. Click notification → Should open app

---

## Integration Points

### Add NotificationSettings to Account Page

```typescript
// src/app/[locale]/account/page.tsx
import { NotificationSettings } from '@/components/account/NotificationSettings'

export default function AccountPage() {
  return (
    <div className="space-y-6">
      {/* ... other account sections ... */}
      
      <NotificationSettings />
    </div>
  )
}
```

### Send Order Notifications

```typescript
// In your order creation/update code
import { sendOrderNotification } from '@/lib/send-push-notification'

// After order created
await sendOrderNotification(userId, orderId, 'confirmed')

// After order shipped
await sendOrderNotification(userId, orderId, 'shipped')

// After order delivered
await sendOrderNotification(userId, orderId, 'delivered')
```

### Send Restock Notifications

```typescript
import { sendRestockNotification } from '@/lib/send-push-notification'

// When product back in stock
const interestedUserIds = ['user-1', 'user-2', 'user-3']
await sendRestockNotification(
  interestedUserIds,
  'Premium T-Shirt',
  'premium-t-shirt'
)
```

---

## Lighthouse PWA Audit

Run Lighthouse audit in Chrome DevTools:

1. Open DevTools → Lighthouse tab
2. Select "Progressive Web App"
3. Click "Analyze page load"

**Expected Score:** 100/100

**Checklist:**
- ✅ Registers a service worker
- ✅ Responds with 200 when offline
- ✅ Has a web app manifest
- ✅ Configured for custom splash screen
- ✅ Sets theme color
- ✅ Content sized correctly
- ✅ Has maskable icon

---

## Troubleshooting

### Service Worker Not Registering

**Check:**
- Running in production mode (`npm run build && npm run start`)
- HTTPS or localhost (required for SW)
- Browser supports service workers
- No console errors

### Push Notifications Not Working

**Check:**
- VAPID keys in `.env.local`
- Permission granted
- Service worker registered
- Active subscription in database
- Test notification API returns success

### Install Prompt Not Showing

**Check:**
- Manifest is valid (`/manifest.json`)
- All PWA criteria met
- Not already installed
- Not dismissed recently (7 day cooldown)

---

## Production Deployment

### 1. Generate Production VAPID Keys

```bash
node scripts/generate-vapid-keys.js
```

### 2. Add to Vercel/Hosting

Add environment variables:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

### 3. Deploy

```bash
git push origin main
# OR
vercel deploy --prod
```

### 4. Test on Production

- Install app on mobile device
- Test offline functionality
- Send test notifications
- Run Lighthouse audit

---

## Success! 🎉

Your PWA is now:
- ✅ Installable on devices
- ✅ Works offline
- ✅ Sends push notifications
- ✅ App-like experience

**Next Steps:**
- Add NotificationSettings to account page
- Integrate order notifications
- Test on real devices
- Monitor analytics
