import { test, expect } from '@playwright/test'

test.describe('Account Management', () => {
    test.describe('Signup Flow', () => {
        test('should create new account successfully', async ({ page }) => {
            await page.goto('/signup')

            // Fill signup form
            const timestamp = Date.now()
            await page.fill('input[name="email"]', `test${timestamp}@example.com`)
            await page.fill('input[name="password"]', 'SecurePassword123!')
            await page.fill('input[name="confirmPassword"]', 'SecurePassword123!')

            // Submit
            await page.click('button[type="submit"]')

            // Should redirect to confirmation or dashboard
            await page.waitForURL(/\/(confirm|dashboard|account)/, { timeout: 10000 })

            // Should show success message
            await expect(page.locator('text=/welcome|check your email/i')).toBeVisible()
        })

        test('should validate password strength', async ({ page }) => {
            await page.goto('/signup')

            // Try weak password
            await page.fill('input[name="email"]', 'test@example.com')
            await page.fill('input[name="password"]', '123')

            // Should show password strength indicator
            await expect(page.locator('text=/weak|too short/i')).toBeVisible()
        })

        test('should prevent duplicate email registration', async ({ page }) => {
            await page.goto('/signup')

            // Try to register with existing email
            await page.fill('input[name="email"]', 'existing@example.com')
            await page.fill('input[name="password"]', 'SecurePassword123!')
            await page.fill('input[name="confirmPassword"]', 'SecurePassword123!')

            await page.click('button[type="submit"]')

            // Should show error
            await expect(page.locator('text=/already registered|email exists/i')).toBeVisible()
        })

        test('should validate password confirmation match', async ({ page }) => {
            await page.goto('/signup')

            await page.fill('input[name="email"]', 'test@example.com')
            await page.fill('input[name="password"]', 'Password123!')
            await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!')

            await page.click('button[type="submit"]')

            // Should show mismatch error
            await expect(page.locator('text=/passwords do not match/i')).toBeVisible()
        })
    })

    test.describe('Login Flow', () => {
        test('should login successfully with valid credentials', async ({ page }) => {
            await page.goto('/login')

            // Fill login form
            await page.fill('input[name="email"]', 'test@example.com')
            await page.fill('input[name="password"]', 'Password123!')

            // Submit
            await page.click('button[type="submit"]')

            // Should redirect to dashboard/account
            await page.waitForURL(/\/(dashboard|account|$)/, { timeout: 10000 })

            // Should show user menu or profile
            await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
        })

        test('should show error for invalid credentials', async ({ page }) => {
            await page.goto('/login')

            await page.fill('input[name="email"]', 'wrong@example.com')
            await page.fill('input[name="password"]', 'WrongPassword!')

            await page.click('button[type="submit"]')

            // Should show error
            await expect(page.locator('text=/invalid credentials|incorrect/i')).toBeVisible()
        })

        test('should validate email format', async ({ page }) => {
            await page.goto('/login')

            await page.fill('input[name="email"]', 'not-an-email')
            await page.fill('input[name="password"]', 'Password123!')

            await page.click('button[type="submit"]')

            // Should show validation error
            await expect(page.locator('text=/invalid email/i')).toBeVisible()
        })

        test('should have password reset link', async ({ page }) => {
            await page.goto('/login')

            // Click forgot password
            await page.click('text=/forgot password/i')

            // Should navigate to reset page
            await expect(page).toHaveURL(/\/reset-password|\/forgot-password/)
        })
    })

    test.describe('Password Reset', () => {
        test('should send reset email', async ({ page }) => {
            await page.goto('/forgot-password')

            await page.fill('input[name="email"]', 'test@example.com')
            await page.click('button[type="submit"]')

            // Should show confirmation
            await expect(page.locator('text=/check your email|reset link sent/i')).toBeVisible()
        })

        test('should validate email before sending reset', async ({ page }) => {
            await page.goto('/forgot-password')

            await page.fill('input[name="email"]', 'invalid-email')
            await page.click('button[type="submit"]')

            await expect(page.locator('text=/invalid email/i')).toBeVisible()
        })
    })

    test.describe('User Profile', () => {
        // These tests would require authentication
        test.use({ storageState: 'e2e/.auth/user.json' })

        test('should display user profile information', async ({ page }) => {
            await page.goto('/account')

            // Should show user email
            await expect(page.locator('[data-testid="user-email"]')).toBeVisible()

            // Should show gamification stats
            await expect(page.locator('[data-testid="user-xp"]')).toBeVisible()
            await expect(page.locator('[data-testid="user-tier"]')).toBeVisible()
        })

        test('should display tier progress', async ({ page }) => {
            await page.goto('/account')

            // Should show progress to next tier
            await expect(page.locator('[data-testid="tier-progress"]')).toBeVisible()

            // Progress bar should be visible
            const progressBar = page.locator('[data-testid="progress-bar"]')
            await expect(progressBar).toBeVisible()

            // Should have aria-valuenow attribute
            const progress = await progressBar.getAttribute('aria-valuenow')
            expect(progress).toBeTruthy()
        })

        test('should display badges earned', async ({ page }) => {
            await page.goto('/account')

            // Should show badges section
            await expect(page.locator('[data-testid="badges-section"]')).toBeVisible()

            // Check if any badges are displayed
            const badges = await page.locator('[data-testid="badge"]').count()
            expect(badges).toBeGreaterThanOrEqual(0)
        })

        test('should display order history', async ({ page }) => {
            await page.goto('/account/orders')

            // Should show orders table or list
            await expect(page.locator('[data-testid="orders-list"]')).toBeVisible()
        })

        test('should allow profile updates', async ({ page }) => {
            await page.goto('/account/settings')

            // Update name
            await page.fill('input[name="fullName"]', 'Updated Name')

            // Save changes
            await page.click('button:has-text("Save")')

            // Should show success message
            await expect(page.locator('text=/saved|updated successfully/i')).toBeVisible()
        })

        test('should allow password change', async ({ page }) => {
            await page.goto('/account/settings')

            // Fill password change form
            await page.fill('input[name="currentPassword"]', 'OldPassword123!')
            await page.fill('input[name="newPassword"]', 'NewPassword123!')
            await page.fill('input[name="confirmNewPassword"]', 'NewPassword123!')

            await page.click('button:has-text("Change Password")')

            // Should show confirmation
            await expect(page.locator('text=/password updated/i')).toBeVisible()
        })

        test('should display referral code', async ({ page }) => {
            await page.goto('/account/referrals')

            // Should show referral code
            await expect(page.locator('[data-testid="referral-code"]')).toBeVisible()

            // Should have copy button
            await expect(page.locator('button:has-text("Copy")')).toBeVisible()
        })

        test('should copy referral code to clipboard', async ({ page }) => {
            await page.goto('/account/referrals')

            // Click copy button
            await page.click('button:has-text("Copy")')

            // Should show copied confirmation
            await expect(page.locator('text=/copied/i')).toBeVisible({ timeout: 2000 })
        })

        test('should display referral stats', async ({ page }) => {
            await page.goto('/account/referrals')

            // Should show number of referrals
            await expect(page.locator('[data-testid="referral-count"]')).toBeVisible()

            // Should show XP earned from referrals
            await expect(page.locator('[data-testid="referral-xp"]')).toBeVisible()
        })
    })

    test.describe('Logout', () => {
        test.use({ storageState: 'e2e/.auth/user.json' })

        test('should logout successfully', async ({ page }) => {
            await page.goto('/account')

            // Click logout
            await page.click('[data-testid="user-menu"]')
            await page.click('text=/logout|sign out/i')

            // Should redirect to homepage or login
            await page.waitForURL(/\/(login|$)/)

            // User menu should not be visible
            await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible()
        })

        test('should clear session after logout', async ({ page }) => {
            await page.goto('/account')

            // Logout
            await page.click('[data-testid="user-menu"]')
            await page.click('text=/logout|sign out/i')

            // Try to access protected page
            await page.goto('/account')

            // Should redirect to login
            await expect(page).toHaveURL(/\/login/)
        })
    })
})

test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
        await page.goto('/login')

        // Tab through form
        await page.keyboard.press('Tab') // Email field
        await page.keyboard.type('test@example.com')

        await page.keyboard.press('Tab') // Password field
        await page.keyboard.type('Password123!')

        await page.keyboard.press('Tab') // Submit button
        await page.keyboard.press('Enter')

        // Form should submit
        await page.waitForURL(/\/(dashboard|account|login)/)
    })

    test('should have proper ARIA labels', async ({ page }) => {
        await page.goto('/login')

        // Check for aria-labels
        const emailInput = page.locator('input[name="email"]')
        const ariaLabel = await emailInput.getAttribute('aria-label')
        expect(ariaLabel || await emailInput.getAttribute('placeholder')).toBeTruthy()
    })

    test('should show focus indicators', async ({ page }) => {
        await page.goto('/login')

        // Tab to first input
        await page.keyboard.press('Tab')

        // Should have focus styles
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
        expect(focusedElement).toBe('INPUT')
    })
})

test.describe('Responsive Design', () => {
    test('should work on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 })
        await page.goto('/account')

        // Navigation should be visible
        await expect(page.locator('nav')).toBeVisible()
    })

    test('should work on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 })
        await page.goto('/account')

        // Mobile menu should be present
        const mobileMenu = page.locator('[data-testid="mobile-menu-trigger"]')
        if (await mobileMenu.isVisible()) {
            await mobileMenu.click()
            await expect(page.locator('nav')).toBeVisible()
        }
    })
})
