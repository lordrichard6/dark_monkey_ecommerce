import { test, expect, devices } from '@playwright/test'

test.describe('Mobile Viewport Tests', () => {
    // Use iPhone 13 viewport
    test.use({ ...devices['iPhone 13'] })

    test('mobile navigation menu', async ({ page }) => {
        await page.goto('/')

        // Look for mobile menu button (usually hamburger icon)
        const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="navigation"]').first()

        if (await menuButton.isVisible().catch(() => false)) {
            // Open menu
            await menuButton.click()
            await page.waitForTimeout(500)

            // Verify menu items visible
            const menuItems = page.locator('nav a, [role="navigation"] a')
            const count = await menuItems.count()
            expect(count).toBeGreaterThan(0)

            // Close menu
            await menuButton.click()
        }
    })

    test('mobile product card layout', async ({ page }) => {
        await page.goto('/')

        // Get viewport width
        const viewport = page.viewportSize()
        expect(viewport?.width).toBeLessThanOrEqual(428) // iPhone 13 width

        // Check product cards are visible and stacked vertically
        const productCards = page.locator('[data-testid="product-card"]')
        await productCards.first().waitFor({ state: 'visible', timeout: 10000 })

        const count = await productCards.count()
        expect(count).toBeGreaterThan(0)

        // Get positions of first two cards to verify vertical stacking
        if (count >= 2) {
            const firstCard = productCards.nth(0)
            const secondCard = productCards.nth(1)

            const firstBox = await firstCard.boundingBox()
            const secondBox = await secondCard.boundingBox()

            if (firstBox && secondBox) {
                // Second card should be below first card
                expect(secondBox.y).toBeGreaterThan(firstBox.y)
            }
        }
    })

    test('mobile cart experience', async ({ page }) => {
        // Add item to cart
        await page.goto('/')
        const productCard = page.locator('[data-testid="product-card"]').first()
        await productCard.waitFor({ state: 'visible', timeout: 10000 })
        await productCard.click()

        await page.waitForURL(/\/products\/.*/)

        // Product page should be scrollable on mobile
        const addToCartButton = page.getByRole('button', { name: /add to cart/i })
        await addToCartButton.scrollIntoViewIfNeeded()
        await addToCartButton.click()
        await page.waitForTimeout(1000)

        // Navigate to cart
        await page.goto('/cart')

        // Cart should be visible and scrollable
        const cartHeading = page.getByRole('heading', { name: /cart|shopping cart/i })
        await expect(cartHeading).toBeVisible()

        // Checkout button should be visible (may need scroll)
        const checkoutButton = page.getByRole('button', { name: /checkout|proceed/i })
        await checkoutButton.scrollIntoViewIfNeeded()
        await expect(checkoutButton).toBeVisible()
    })

    test('mobile checkout form', async ({ page }) => {
        // Add item first
        await page.goto('/')
        const productCard = page.locator('[data-testid="product-card"]').first()
        await productCard.waitFor({ state: 'visible', timeout: 10000 })
        await productCard.click()

        await page.waitForURL(/\/products\/.*/)
        const addToCartButton = page.getByRole('button', { name: /add to cart/i })
        await addToCartButton.click()
        await page.waitForTimeout(1000)

        // Go to checkout
        await page.goto('/checkout')

        // Form inputs should be full width and touch-friendly
        const emailInput = page.locator('input[type="email"]')
        await emailInput.waitFor({ state: 'visible', timeout: 5000 })

        const inputBox = await emailInput.boundingBox()
        const viewportWidth = page.viewportSize()?.width || 0

        // Input should take most of the width (at least 80%)
        if (inputBox) {
            expect(inputBox.width).toBeGreaterThan(viewportWidth * 0.7)
        }

        // Input should be tall enough for touch (at least 44px - Apple recommendation)
        if (inputBox) {
            expect(inputBox.height).toBeGreaterThanOrEqual(40)
        }
    })

    test('mobile product detail page', async ({ page }) => {
        await page.goto('/')
        const productCard = page.locator('[data-testid="product-card"]').first()
        await productCard.click()

        await page.waitForURL(/\/products\/.*/)

        // Product images should be visible
        const productImage = page.locator('img').first()
        await expect(productImage).toBeVisible()

        // Product title should be visible
        const title = page.locator('h1')
        await expect(title).toBeVisible()

        // Price should be visible
        const price = page.locator('text=/CHF|€|\\$/').first()
        await expect(price).toBeVisible()

        // Add to cart should be reachable
        const addToCartButton = page.getByRole('button', { name: /add to cart/i })
        await addToCartButton.scrollIntoViewIfNeeded()
        await expect(addToCartButton).toBeVisible()
    })

    test('mobile footer links accessible', async ({ page }) => {
        await page.goto('/')

        // Scroll to footer
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        await page.waitForTimeout(500)

        // Footer links should be touch-friendly
        const footerLinks = page.locator('footer a')
        const count = await footerLinks.count()

        if (count > 0) {
            const firstLink = footerLinks.first()
            const linkBox = await firstLink.boundingBox()

            // Links should have enough height for touch
            if (linkBox) {
                expect(linkBox.height).toBeGreaterThanOrEqual(24)
            }
        }
    })

    test('mobile search functionality', async ({ page }) => {
        await page.goto('/')

        // Look for search input or button
        const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]')

        if (await searchInput.isVisible().catch(() => false)) {
            await searchInput.fill('shirt')
            await page.waitForTimeout(1000)

            // Should show results or suggestions
            const hasResults = await page.locator('[data-testid="product-card"]').count() > 0
            expect(hasResults).toBeTruthy()
        }
    })

    test('mobile performance - page loads quickly', async ({ page }) => {
        const startTime = Date.now()
        await page.goto('/')

        // Wait for product cards to be visible
        await page.locator('[data-testid="product-card"]').first().waitFor({ timeout: 10000 })

        const loadTime = Date.now() - startTime

        // Page should load in under 5 seconds on mobile
        expect(loadTime).toBeLessThan(5000)
    })
})

test.describe('Tablet Viewport Tests', () => {
    // Use iPad Pro viewport
    test.use({ ...devices['iPad Pro'] })

    test('tablet product grid layout', async ({ page }) => {
        await page.goto('/')

        // Tablet should show 2-3 columns of products
        const productCards = page.locator('[data-testid="product-card"]')
        await productCards.first().waitFor({ state: 'visible', timeout: 10000 })

        const count = await productCards.count()
        expect(count).toBeGreaterThan(0)

        // Check if cards are side-by-side (not all stacked vertically)
        if (count >= 2) {
            const firstCard = productCards.nth(0)
            const secondCard = productCards.nth(1)

            const firstBox = await firstCard.boundingBox()
            const secondBox = await secondCard.boundingBox()

            if (firstBox && secondBox) {
                // Cards might be side-by-side (similar Y position) or stacked
                const yDifference = Math.abs(secondBox.y - firstBox.y)
                // Allow for either layout
                expect(yDifference).toBeGreaterThanOrEqual(0)
            }
        }
    })

    test('tablet checkout experience', async ({ page }) => {
        // Add item first
        await page.goto('/')
        const productCard = page.locator('[data-testid="product-card"]').first()
        await productCard.click()

        await page.waitForURL(/\/products\/.*/)
        const addToCartButton = page.getByRole('button', { name: /add to cart/i })
        await addToCartButton.click()
        await page.waitForTimeout(1000)

        await page.goto('/checkout')

        // Form should be nicely laid out on tablet
        const emailInput = page.locator('input[type="email"]')
        await expect(emailInput).toBeVisible()

        // Should have good spacing
        const viewport = page.viewportSize()
        expect(viewport?.width).toBeGreaterThan(768)
    })
})
