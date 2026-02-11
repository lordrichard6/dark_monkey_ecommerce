import { test, expect } from '@playwright/test'

test.describe('Product Browsing', () => {
    test('should display products on homepage', async ({ page }) => {
        await page.goto('/')

        // Wait for products to load
        await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })

        // Check that products are displayed
        const products = await page.locator('[data-testid="product-card"]').count()
        expect(products).toBeGreaterThan(0)
    })

    test('should navigate to product detail page', async ({ page }) => {
        await page.goto('/')

        // Wait for products
        await page.waitForSelector('[data-testid="product-card"]')

        // Click first product
        await page.locator('[data-testid="product-card"]').first().click()

        // Should be on product detail page
        await expect(page).toHaveURL(/\/products\//)

        // Should show product details
        await expect(page.locator('h1')).toBeVisible()
    })

    test('should add product to cart', async ({ page }) => {
        await page.goto('/')

        // Navigate to a product
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()

        // Add to cart
        await page.click('button:has-text("Add to Cart")')

        // Cart should update
        await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
    })
})

test.describe('Cart Functionality', () => {
    test('should update cart quantity', async ({ page }) => {
        await page.goto('/')

        // Add product to cart
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()
        await page.click('button:has-text("Add to Cart")')

        // Open cart
        await page.click('[data-testid="cart-trigger"]')

        // Increase quantity
        await page.click('[data-testid="increase-quantity"]')

        // Should show 2 items
        await expect(page.locator('[data-testid="item-quantity"]')).toContainText('2')
    })

    test('should remove item from cart', async ({ page }) => {
        await page.goto('/')

        // Add product to cart
        await page.waitForSelector('[data-testid="product-card"]')
        await page.locator('[data-testid="product-card"]').first().click()
        await page.click('button:has-text("Add to Cart")')

        // Open cart
        await page.click('[data-testid="cart-trigger"]')

        // Remove item
        await page.click('[data-testid="remove-item"]')

        // Cart should be empty
        await expect(page.locator('text=Your cart is empty')).toBeVisible()
    })
})
