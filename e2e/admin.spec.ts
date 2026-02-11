import { test, expect } from '@playwright/test'

test.describe('Admin Panel Access', () => {
    // Test admin account credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@darkmonkey.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

    test('admin login and dashboard access', async ({ page }) => {
        // 1. Navigate to admin login or regular login
        await page.goto('/admin')

        // Check if redirected to login
        const currentUrl = page.url()

        if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
            // Fill in admin credentials
            await page.locator('input[type="email"]').fill(adminEmail)
            await page.locator('input[type="password"]').fill(adminPassword)

            const submitButton = page.getByRole('button', { name: /log in|sign in/i })
            await submitButton.click()

            await page.waitForTimeout(2000)
        }

        // Should now be on admin dashboard
        const isAdmin = await page.locator('text=/admin|dashboard|products|orders/i').isVisible().catch(() => false)
        expect(isAdmin).toBeTruthy()
    })

    test('admin product management', async ({ page }) => {
        // Login first
        await page.goto('/admin')

        // Check if we need to login
        if (page.url().includes('/login')) {
            await page.locator('input[type="email"]').fill(adminEmail)
            await page.locator('input[type="password"]').fill(adminPassword)
            await page.getByRole('button', { name: /log in/i }).click()
            await page.waitForTimeout(2000)
        }

        // Navigate to products section
        await page.goto('/admin/products')

        // Should see products list
        const hasProducts = await page.locator('text=/product|name|price/i').isVisible({ timeout: 5000 }).catch(() => false)
        const hasAddButton = await page.locator('button:has-text("Add"), a:has-text("New")').isVisible().catch(() => false)

        expect(hasProducts || hasAddButton).toBeTruthy()
    })

    test('admin order management', async ({ page }) => {
        // Login
        await page.goto('/admin')

        if (page.url().includes('/login')) {
            await page.locator('input[type="email"]').fill(adminEmail)
            await page.locator('input[type="password"]').fill(adminPassword)
            await page.getByRole('button', { name: /log in/i }).click()
            await page.waitForTimeout(2000)
        }

        // Navigate to orders
        await page.goto('/admin/orders')

        // Should see orders list or empty state
        const hasOrders = await page.locator('text=/order|status|total/i').isVisible({ timeout: 5000 }).catch(() => false)
        const hasEmptyState = await page.locator('text=/no orders/i').isVisible().catch(() => false)

        expect(hasOrders || hasEmptyState).toBeTruthy()
    })

    test('admin navigation sidebar', async ({ page }) => {
        // Login
        await page.goto('/admin')

        if (page.url().includes('/login')) {
            await page.locator('input[type="email"]').fill(adminEmail)
            await page.locator('input[type="password"]').fill(adminPassword)

            await page.getByRole('button', { name: /log in/i }).click()
            await page.waitForTimeout(2000)
        }

        // Check for navigation links
        const navLinks = page.locator('nav a, [role="navigation"] a, aside a')
        const count = await navLinks.count()

        // Should have multiple navigation links
        expect(count).toBeGreaterThan(0)
    })

    test('admin stock management', async ({ page }) => {
        // Login
        await page.goto('/admin')

        if (page.url().includes('/login')) {
            await page.locator('input[type="email"]').fill(adminEmail)
            await page.locator('input[type="password"]').fill(adminPassword)
            await page.getByRole('button', { name: /log in/i }).click()
            await page.waitForTimeout(2000)
        }

        // Navigate to inventory/stock page
        await page.goto('/admin/inventory')

        // Should see stock information
        const hasInventory = await page.locator('text=/stock|inventory|quantity/i').isVisible({ timeout: 5000 }).catch(() => false)
        const hasProducts = await page.locator('text=/product/i').isVisible().catch(() => false)

        expect(hasInventory || hasProducts).toBeTruthy()
    })

    test('admin discount codes management', async ({ page }) => {
        // Login
        await page.goto('/admin')

        if (page.url().includes('/login')) {
            await page.locator('input[type="email"]').fill(adminEmail)
            await page.locator('input[type="password"]').fill(adminPassword)
            await page.getByRole('button', { name: /log in/i }).click()
            await page.waitForTimeout(2000)
        }

        // Navigate to discounts
        await page.goto('/admin/discounts')

        // Should see discounts list or ability to create
        const hasDiscounts = await page.locator('text=/discount|code|percentage/i').isVisible({ timeout: 5000 }).catch(() => false)
        const hasCreateButton = await page.locator('button:has-text("Create"), button:has-text("New")').isVisible().catch(() => false)

        expect(hasDiscounts || hasCreateButton).toBeTruthy()
    })

    test('admin review moderation', async ({ page }) => {
        // Login
        await page.goto('/admin')

        if (page.url().includes('/login')) {
            await page.locator('input[type="email"]').fill(adminEmail)
            await page.locator('input[type="password"]').fill(adminPassword)
            await page.getByRole('button', { name: /log in/i }).click()
            await page.waitForTimeout(2000)
        }

        // Navigate to reviews
        await page.goto('/admin/reviews')

        // Should see reviews or empty state
        const hasReviews = await page.locator('text=/review|rating|approve/i').isVisible({ timeout: 5000 }).catch(() => false)
        const hasEmptyState = await page.locator('text=/no reviews/i').isVisible().catch(() => false)

        expect(hasReviews || hasEmptyState).toBeTruthy()
    })

    test('unauthorized user cannot access admin', async ({ page }) => {
        // Go to admin without login
        await page.goto('/admin/products')

        // Should redirect to login or show access denied
        await page.waitForTimeout(2000)

        const currentUrl = page.url()
        const isBlocked = currentUrl.includes('/login') ||
            currentUrl.includes('/auth') ||
            await page.locator('text=/unauthorized|forbidden|access denied/i').isVisible().catch(() => false)

        expect(isBlocked).toBeTruthy()
    })

    test('admin can logout', async ({ page }) => {
        // Login first
        await page.goto('/admin')

        if (page.url().includes('/login')) {
            await page.locator('input[type="email"]').fill(adminEmail)
            await page.locator('input[type="password"]').fill(adminPassword)
            await page.getByRole('button', { name: /log in/i }).click()
            await page.waitForTimeout(2000)
        }

        // Find logout button
        const logoutButton = page.getByRole('button', { name: /log out|sign out/i })

        if (await logoutButton.isVisible().catch(() => false)) {
            await logoutButton.click()
            await page.waitForTimeout(1000)

            // Should redirect to login or home
            const currentUrl = page.url()
            const isLoggedOut = currentUrl.includes('/login') || currentUrl === '/'
            expect(isLoggedOut).toBeTruthy()
        }
    })
})
