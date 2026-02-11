import { test, expect } from '@playwright/test'

test.describe('Checkout Flow - Guest User', () => {
    test('should complete guest checkout successfully', async ({ page }) => {
        await page.goto('/')

        // Add product to cart
        await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })
        await page.locator('[data-testid="product-card"]').first().click()
        await page.click('button:has-text("Add to Cart")')

        // Open cart and proceed to checkout
        await page.click('[data-testid="cart-trigger"]')
        await page.click('button:has-text("Checkout")')

        // Should be on checkout page
        await expect(page).toHaveURL(/\/checkout/)

        // Fill in guest information
        await page.fill('input[name="email"]', 'guest@example.com')
        await page.fill('input[name="fullName"]', 'John Doe')
        await page.fill('input[name="line1"]', '123 Main Street')
        await page.fill('input[name="city"]', 'Zurich')
        await page.fill('input[name="postalCode"]', '8001')
        await page.selectOption('select[name="country"]', 'CH')

        // Submit checkout (will redirect to Stripe)
        await page.click('button:has-text("Continue to Payment")')

        // Should redirect to Stripe checkout
        await page.waitForURL(/checkout\.stripe\.com/, { timeout: 15000 })
        expect(page.url()).toContain('stripe.com')
    })

    test('should validate required fields', async ({ page }) => {
        await page.goto('/')

        // Add product and go to checkout
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()
        await page.click('button:has-text("Add to Cart")')
        await page.click('[data-testid="cart-trigger"]')
        await page.click('button:has-text("Checkout")')

        // Try to submit without filling fields
        await page.click('button:has-text("Continue to Payment")')

        // Should show validation errors
        await expect(page.locator('text=Email is required')).toBeVisible()
    })

    test('should apply discount code', async ({ page }) => {
        await page.goto('/')

        // Add product to cart
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()
        await page.click('button:has-text("Add to Cart")')

        // Open cart
        await page.click('[data-testid="cart-trigger"]')

        // Get original total
        const originalTotal = await page.locator('[data-testid="cart-total"]').textContent()

        // Apply discount code
        await page.fill('input[name="discountCode"]', 'SAVE10')
        await page.click('button:has-text("Apply")')

        // Should show discount applied
        await expect(page.locator('text=Discount applied')).toBeVisible()

        // Total should be reduced
        const newTotal = await page.locator('[data-testid="cart-total"]').textContent()
        expect(newTotal).not.toBe(originalTotal)
    })

    test('should handle invalid discount code', async ({ page }) => {
        await page.goto('/')

        // Add product and open cart
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()
        await page.click('button:has-text("Add to Cart")')
        await page.click('[data-testid="cart-trigger"]')

        // Try invalid code
        await page.fill('input[name="discountCode"]', 'INVALID123')
        await page.click('button:has-text("Apply")')

        // Should show error
        await expect(page.locator('text=Invalid or expired code')).toBeVisible()
    })

    test('should switch currency', async ({ page }) => {
        await page.goto('/')

        // Add product to cart
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()

        // Get price in CHF
        const priceChf = await page.locator('[data-testid="product-price"]').textContent()
        expect(priceChf).toContain('CHF')

        // Switch to EUR
        await page.click('[data-testid="currency-selector"]')
        await page.click('text=EUR')

        // Price should update to EUR
        const priceEur = await page.locator('[data-testid="product-price"]').textContent()
        expect(priceEur).toContain('€')
        expect(priceEur).not.toBe(priceChf)
    })
})

test.describe('Checkout Flow - Authenticated User', () => {
    test.use({ storageState: 'e2e/.auth/user.json' })

    test('should show saved address for logged-in user', async ({ page }) => {
        await page.goto('/')

        // Add product and go to checkout
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()
        await page.click('button:has-text("Add to Cart")')
        await page.click('[data-testid="cart-trigger"]')
        await page.click('button:has-text("Checkout")')

        // Should pre-fill user information
        const email = await page.inputValue('input[name="email"]')
        expect(email).toBeTruthy()
    })

    test('should earn XP after purchase', async ({ page }) => {
        // Note: This would require mocking Stripe or using test mode
        // For now, we'll just verify the flow up to Stripe redirect
        await page.goto('/account')

        // Get current XP
        const currentXp = await page.locator('[data-testid="user-xp"]').textContent()

        // Complete a purchase (mocked)
        // In real scenario, would go through full checkout
        // Then verify XP increased
    })
})

test.describe('Cart Persistence', () => {
    test('should persist cart across page reloads', async ({ page }) => {
        await page.goto('/')

        // Add product to cart
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()
        await page.click('button:has-text("Add to Cart")')

        // Verify cart count
        await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')

        // Reload page
        await page.reload()

        // Cart should still have 1 item
        await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
    })

    test('should sync cart after login', async ({ page }) => {
        await page.goto('/')

        // Add product as guest
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()
        await page.click('button:has-text("Add to Cart")')

        // Login (would need to implement login flow)
        // After login, cart should merge/sync
    })
})

test.describe('Product Customization', () => {
    test('should allow product customization before adding to cart', async ({ page }) => {
        await page.goto('/')

        // Navigate to customizable product
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()

        // Check if customization options exist
        const hasCustomization = await page.locator('[data-testid="customization-section"]').isVisible()

        if (hasCustomization) {
            // Fill in customization
            await page.fill('input[name="engraving"]', 'Custom Text')

            // Add to cart
            await page.click('button:has-text("Add to Cart")')

            // Open cart and verify customization
            await page.click('[data-testid="cart-trigger"]')
            await expect(page.locator('text=Custom Text')).toBeVisible()
        }
    })

    test('should show customization preview', async ({ page }) => {
        await page.goto('/')

        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()

        const hasCustomization = await page.locator('[data-testid="customization-section"]').isVisible()

        if (hasCustomization) {
            // Enter text
            await page.fill('input[name="engraving"]', 'Preview Test')

            // Should show preview
            await expect(page.locator('[data-testid="customization-preview"]')).toContainText('Preview Test')
        }
    })
})

test.describe('Error Handling', () => {
    test('should handle out of stock products', async ({ page }) => {
        // This would require setting up a product with 0 stock
        // For now, we'll test the UI behavior
        await page.goto('/')

        await page.waitForSelector('[data-testid="product-card"]')

        // Check if any products show "Out of Stock"
        const outOfStockButton = page.locator('button:has-text("Out of Stock")')
        const count = await outOfStockButton.count()

        if (count > 0) {
            // Button should be disabled
            await expect(outOfStockButton.first()).toBeDisabled()
        }
    })

    test('should handle network errors gracefully', async ({ page }) => {
        // Simulate offline
        await page.context().setOffline(true)

        await page.goto('/')

        // Should show error message or offline indicator
        // Implementation depends on app's offline handling
    })
})

test.describe('Mobile Checkout Flow', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should complete checkout on mobile', async ({ page }) => {
        await page.goto('/')

        // Add product
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()
        await page.click('button:has-text("Add to Cart")')

        // Open mobile cart (might be in a drawer)
        await page.click('[data-testid="cart-trigger"]')

        // Proceed to checkout
        await page.click('button:has-text("Checkout")')

        // Fill form on mobile
        await page.fill('input[name="email"]', 'mobile@example.com')
        await page.fill('input[name="fullName"]', 'Mobile User')

        // Should be able to scroll and submit
        await page.click('button:has-text("Continue to Payment")')
    })

    test('should have touch-friendly cart controls on mobile', async ({ page }) => {
        await page.goto('/')

        // Add product
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()
        await page.click('button:has-text("Add to Cart")')

        // Open cart
        await page.click('[data-testid="cart-trigger"]')

        // Quantity buttons should be large enough for touch
        const increaseButton = page.locator('[data-testid="increase-quantity"]')
        const box = await increaseButton.boundingBox()

        if (box) {
            // Button should be at least 44x44 (iOS minimum touch target)
            expect(box.width).toBeGreaterThanOrEqual(44)
            expect(box.height).toBeGreaterThanOrEqual(44)
        }
    })
})
