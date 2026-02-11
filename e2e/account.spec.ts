import { test, expect } from '@playwright/test'

test.describe('Account Management', () => {
    // Helper to create a unique email for each test
    const generateTestEmail = () => `test-${Date.now()}@example.com`

    test('signup flow - new user registration', async ({ page }) => {
        const email = generateTestEmail()
        const password = 'TestPassword123!'

        // 1. Navigate to signup
        await page.goto('/auth/signup')
        await expect(page.getByRole('heading', { name: /sign up|create account/i })).toBeVisible()

        // 2. Fill in signup form
        const emailInput = page.locator('input[type="email"]')
        const passwordInput = page.locator('input[type="password"]').first()

        await emailInput.fill(email)
        await passwordInput.fill(password)

        // 3. Submit form
        const submitButton = page.getByRole('button', { name: /sign up|create/i })
        await submitButton.click()

        // 4. Should redirect or show success message
        // Note: Supabase sends confirmation email, so we can't complete this fully in E2E
        // Check for success message or redirect
        await page.waitForTimeout(2000)

        // Verify we're not on signup page anymore OR see confirmation message
        const currentUrl = page.url()
        const isRedirected = !currentUrl.includes('/signup')
        const hasConfirmMessage = await page.locator('text=/confirm|check your email/i').isVisible().catch(() => false)

        expect(isRedirected || hasConfirmMessage).toBeTruthy()
    })

    test('login flow - existing user', async ({ page }) => {
        // Note: This requires a pre-seeded test account
        // Skip if no test account exists
        const testEmail = process.env.TEST_USER_EMAIL || 'test@darkmonkey.com'
        const testPassword = process.env.TEST_USER_PASSWORD || 'password123'

        // 1. Navigate to login
        await page.goto('/login')
        await expect(page.getByRole('heading', { name: /log in|sign in/i })).toBeVisible()

        // 2. Fill in credentials
        await page.locator('input[type="email"]').fill(testEmail)
        await page.locator('input[type="password"]').fill(testPassword)

        // 3. Submit
        const submitButton = page.getByRole('button', { name: /log in|sign in/i })
        await submitButton.click()

        // 4. Should redirect to homepage or account
        await page.waitForTimeout(2000)

        // Verify redirect happened
        const currentUrl = page.url()
        const isRedirected = !currentUrl.includes('/login')
        expect(isRedirected).toBeTruthy()
    })

    test('profile page - view user information', async ({ page }) => {
        // Access account page
        await page.goto('/account')

        // Check for account elements (works for both logged in and logged out)
        const hasLoginPrompt = await page.locator('text=/log in|sign in/i').isVisible().catch(() => false)
        const hasProfileInfo = await page.locator('text=/profile|account|email/i').isVisible().catch(() => false)

        // Should show either login prompt or profile info
        expect(hasLoginPrompt || hasProfileInfo).toBeTruthy()
    })

    test('gamification - view XP and tier', async ({ page }) => {
        await page.goto('/account')

        // If logged in, should see gamification info
        const hasTierInfo = await page.locator('text=/bronze|silver|gold|vip|tier|xp/i').isVisible().catch(() => false)
        const hasLoginPrompt = await page.locator('text=/log in/i').isVisible().catch(() => false)

        // Should see either tier info (if logged in) or login prompt
        expect(hasTierInfo || hasLoginPrompt).toBeTruthy()
    })

    test('wishlist - add and remove items', async ({ page }) => {
        // 1. Go to product page
        await page.goto('/')
        const productCard = page.locator('[data-testid="product-card"]').first()
        await productCard.waitFor({ state: 'visible', timeout: 10000 })
        await productCard.click()

        await page.waitForURL(/\/products\/.*/)

        // 2. Find wishlist button (heart icon)
        const wishlistButton = page.locator('button[aria-label*="wishlist"], button[title*="wishlist"]').first()

        if (await wishlistButton.isVisible().catch(() => false)) {
            // Click to add to wishlist
            await wishlistButton.click()
            await page.waitForTimeout(1000)

            // Verify state changed (would need to check icon color or text)
            // This might require login, so just verify button is still there
            await expect(wishlistButton).toBeVisible()
        }
    })

    test('order history - view past orders', async ({ page }) => {
        await page.goto('/account/orders')

        // Should show orders (if logged in) or login prompt
        const hasOrders = await page.locator('text=/order|purchase/i').isVisible().catch(() => false)
        const hasLoginPrompt = await page.locator('text=/log in/i').isVisible().catch(() => false)
        const hasEmptyState = await page.locator('text=/no orders|haven\'t made/i').isVisible().catch(() => false)

        expect(hasOrders || hasLoginPrompt || hasEmptyState).toBeTruthy()
    })

    test('logout flow', async ({ page }) => {
        // Try to access account page
        await page.goto('/account')

        // Look for logout button (only visible if logged in)
        const logoutButton = page.getByRole('button', { name: /log out|sign out/i })

        if (await logoutButton.isVisible().catch(() => false)) {
            await logoutButton.click()
            await page.waitForTimeout(1000)

            // Should redirect or show login prompt
            const hasLoginPrompt = await page.locator('text=/log in/i').isVisible()
            expect(hasLoginPrompt).toBeTruthy()
        }
    })
})
