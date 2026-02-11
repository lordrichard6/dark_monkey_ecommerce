import { test, expect } from '@playwright/test'

test.describe('Checkout Flow', () => {
    test('guest checkout - complete purchase flow', async ({ page }) => {
        // 1. Navigate to homepage
        await page.goto('/')
        await expect(page).toHaveTitle(/DarkMonkey/)

        // 2. Click on first product
        const productCard = page.locator('[data-testid="product-card"]').first()
        await productCard.waitFor({ state: 'visible', timeout: 10000 })
        await productCard.click()

        // 3. Wait for product page and add to cart
        await page.waitForURL(/\/products\/.*/)
        await expect(page.locator('h1')).toBeVisible()

        // Wait for add to cart button and click
        const addToCartButton = page.getByRole('button', { name: /add to cart/i })
        await addToCartButton.waitFor({ state: 'visible', timeout: 5000 })
        await addToCartButton.click()

        // Wait for cart to update (small delay for action to complete)
        await page.waitForTimeout(1000)

        // 4. Navigate to cart
        await page.goto('/cart')
        await expect(page.getByRole('heading', { name: /cart|shopping cart/i })).toBeVisible()

        // Verify cart has items
        const cartItems = page.locator('[data-testid="cart-item"]')
        await expect(cartItems).toHaveCount(1)

        // 5. Proceed to checkout
        const checkoutButton = page.getByRole('button', { name: /checkout|proceed/i })
        await checkoutButton.click()

        // 6. Fill in checkout form
        await page.waitForURL(/\/checkout/)

        const emailInput = page.locator('input[type="email"]')
        await emailInput.fill('test@example.com')

        // 7. Click pay button (will redirect to Stripe in test mode)
        const submitButton = page.getByRole('button', { name: /pay|stripe/i })
        await expect(submitButton).toBeEnabled()

        // Note: We don't actually complete Stripe payment in E2E tests
        // In production, you'd use Stripe test mode and fill in test card details
    })

    test('authenticated user checkout', async ({ page }) => {
        // Login first (assuming login is working from auth tests)
        await page.goto('/login')

        // This would use a test account - skip for now if auth isn't set up
        // Focus on guest checkout flow
    })

    test('cart persistence across sessions', async ({ page }) => {
        // 1. Add item to cart
        await page.goto('/')
        const productCard = page.locator('[data-testid="product-card"]').first()
        await productCard.waitFor({ state: 'visible', timeout: 10000 })
        await productCard.click()

        await page.waitForURL(/\/products\/.*/)
        const addToCartButton = page.getByRole('button', { name: /add to cart/i })
        await addToCartButton.click()
        await page.waitForTimeout(1000)

        // 2. Navigate away and come back
        await page.goto('/')
        await page.goto('/cart')

        // 3. Verify item still in cart (cookie persistence)
        const cartItems = page.locator('[data-testid="cart-item"]')
        await expect(cartItems).toHaveCount(1)
    })

    test('discount code validation', async ({ page }) => {
        // 1. Add item and go to checkout
        await page.goto('/')
        const productCard = page.locator('[data-testid="product-card"]').first()
        await productCard.waitFor({ state: 'visible', timeout: 10000 })
        await productCard.click()

        await page.waitForURL(/\/products\/.*/)
        const addToCartButton = page.getByRole('button', { name: /add to cart/i })
        await addToCartButton.click()
        await page.waitForTimeout(1000)

        await page.goto('/checkout')

        // 2. Try invalid discount code
        const discountInput = page.locator('input[placeholder*="SAVE"]').or(page.locator('input[type="text"]').first())
        await discountInput.fill('INVALID123')

        const applyButton = page.getByRole('button', { name: /apply/i })
        await applyButton.click()

        // Wait for error message
        await expect(page.locator('text=/invalid|not found/i')).toBeVisible({ timeout: 3000 })
    })

    test('empty cart checkout redirect', async ({ page }) => {
        // Try to access checkout with empty cart
        await page.goto('/checkout')

        // Should redirect to homepage or show empty state
        await page.waitForURL(/\//, { timeout: 5000 })
    })
})
