# Testing Guide - Ecommerce Premium

Complete guide for testing the DarkMonkey e-commerce platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Test Suite Structure](#test-suite-structure)
3. [Running Tests](#running-tests)
4. [Unit Tests](#unit-tests)
5. [Integration Tests](#integration-tests)
6. [E2E Tests](#e2e-tests)
7. [Coverage Requirements](#coverage-requirements)
8. [Best Practices](#best-practices)
9. [CI/CD Integration](#cicd-integration)
10. [Troubleshooting](#troubleshooting)

---

## Overview

**Total Test Coverage: 166 tests**

- **89 Unit Tests** - Fast, isolated component testing
- **29 Integration Tests** - Multi-component interaction testing
- **48 E2E Tests** - Full user journey testing

**Frameworks:**

- **Vitest** - Unit and integration tests
- **Playwright** - End-to-end tests
- **Testing Library** - React component testing

---

## Test Suite Structure

```
dark_monkey_app/
├── src/
│   ├── actions/__tests__/
│   │   ├── cart.test.ts                    # Cart actions (6 tests)
│   │   ├── checkout-validation.test.ts     # Checkout validation (15 tests)
│   │   └── auth-integration.test.ts        # Auth flows (15 tests)
│   ├── lib/__tests__/
│   │   ├── gamification.test.ts            # XP & tiers (38 tests)
│   │   └── currency.test.ts                # Pricing & conversion (30 tests)
│   └── app/api/webhooks/__tests__/
│       └── stripe-webhook.test.ts          # Webhook handling (14 tests)
├── e2e/
│   ├── product-browsing.spec.ts            # Product flows (5 tests)
│   ├── checkout-flow.spec.ts               # Checkout journeys (21 tests)
│   └── account-management.spec.ts          # Account features (27 tests)
├── vitest.config.ts                        # Vitest configuration
├── vitest.setup.ts                         # Test setup & mocks
└── playwright.config.ts                    # Playwright configuration
```

---

## Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Run all unit/integration tests
npm test

# Run in watch mode
npm test -- --watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- cart.test.ts

# Run tests matching pattern
npm test -- --grep "gamification"
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode
npm run test:e2e:ui

# Run specific browser
npm run test:e2e -- --project=chromium

# Run specific test file
npm run test:e2e -- checkout-flow.spec.ts

# Debug mode
npm run test:e2e -- --debug
```

### Run All Tests

```bash
# Run everything (unit + integration + E2E)
npm test && npm run test:e2e
```

---

## Unit Tests

### What to Test

✅ **Pure Functions**

- Gamification calculations (XP, tiers)
- Currency conversions
- Price formatting
- Utility functions

✅ **Business Logic**

- Cart operations (add, update, remove)
- Discount validation
- Stock management
- Order calculations

### Example: Testing Gamification

```typescript
import { describe, it, expect } from 'vitest'
import { getTierForXp, xpForPurchase } from '../gamification'

describe('Gamification', () => {
  it('should calculate correct tier for XP', () => {
    expect(getTierForXp(0)).toBe('bronze')
    expect(getTierForXp(100)).toBe('silver')
    expect(getTierForXp(500)).toBe('gold')
    expect(getTierForXp(2000)).toBe('vip')
  })

  it('should award XP for purchases', () => {
    expect(xpForPurchase(10000)).toBe(100) // 100 CHF = 100 XP
    expect(xpForPurchase(500)).toBe(10) // 5 CHF = 10 XP (minimum)
  })
})
```

### Coverage Targets

- **Critical paths:** 90%+ coverage
- **Business logic:** 80%+ coverage
- **Utilities:** 70%+ coverage

---

## Integration Tests

### What to Test

✅ **Multi-Component Flows**

- Authentication (login, signup, logout)
- Order creation with webhooks
- Payment processing
- Email notifications

✅ **External Integrations**

- Stripe webhooks
- Supabase database operations
- Printful order creation
- Resend email sending

### Example: Testing Auth Flow

```typescript
import { describe, it, expect, vi } from 'vitest'

describe('Authentication', () => {
  it('should login with valid credentials', async () => {
    const { createClient } = await import('@/lib/supabase/server')

    vi.mocked(createClient).mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: { email: 'test@example.com' } },
          error: null,
        }),
      },
    } as any)

    const supabase = await createClient()
    const result = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result.data?.user?.email).toBe('test@example.com')
  })
})
```

### Mocking Strategy

- **Supabase:** Mock `createClient` for database operations
- **Stripe:** Mock webhook events and API calls
- **Printful:** Mock order creation responses
- **Resend:** Mock email sending

---

## E2E Tests

### What to Test

✅ **User Journeys**

- Browse products → Add to cart → Checkout
- Signup → Login → View profile
- Apply discount → Complete purchase
- Customize product → Add to cart

✅ **Cross-Browser**

- Chromium (Chrome/Edge)
- Firefox
- Mobile Chrome

✅ **Viewports**

- Desktop (1280x720)
- Tablet (768x1024)
- Mobile (375x667)

### Example: Testing Checkout Flow

```typescript
import { test, expect } from '@playwright/test'

test('should complete guest checkout', async ({ page }) => {
  await page.goto('/')

  // Add product to cart
  await page.waitForSelector('[data-testid="product-card"]')
  await page.locator('[data-testid="product-card"]').first().click()
  await page.click('button:has-text("Add to Cart")')

  // Proceed to checkout
  await page.click('[data-testid="cart-trigger"]')
  await page.click('button:has-text("Checkout")')

  // Fill checkout form
  await page.fill('input[name="email"]', 'guest@example.com')
  await page.fill('input[name="fullName"]', 'John Doe')

  // Submit
  await page.click('button:has-text("Continue to Payment")')

  // Should redirect to Stripe
  await expect(page).toHaveURL(/stripe\.com/)
})
```

### Test Data Attributes

Use `data-testid` attributes for stable selectors:

```tsx
<button data-testid="add-to-cart">Add to Cart</button>
<div data-testid="cart-count">{itemCount}</div>
<input data-testid="email-input" name="email" />
```

---

## Coverage Requirements

### Overall Targets

- **Unit Tests:** 70%+ statement coverage
- **Integration Tests:** Critical paths covered
- **E2E Tests:** All major user journeys

### Critical Paths (90%+ coverage required)

- ✅ Cart operations
- ✅ Gamification (XP, tiers)
- ✅ Currency conversion
- ✅ Discount validation

### View Coverage Report

```bash
npm run test:coverage
open coverage/index.html
```

---

## Best Practices

### 1. Test Naming

```typescript
// ✅ Good: Descriptive, behavior-focused
it('should award 10 XP minimum for purchases under 10 CHF', () => {})

// ❌ Bad: Implementation-focused
it('should call xpForPurchase function', () => {})
```

### 2. Arrange-Act-Assert

```typescript
it('should calculate discount correctly', () => {
  // Arrange
  const subtotal = 10000
  const discountPercent = 10

  // Act
  const discount = calculateDiscount(subtotal, discountPercent)

  // Assert
  expect(discount).toBe(1000)
})
```

### 3. Test Independence

```typescript
// ✅ Good: Each test is independent
beforeEach(() => {
  vi.clearAllMocks()
})

// ❌ Bad: Tests depend on each other
let userId: string
it('should create user', () => {
  userId = 'user-123'
})
it('should fetch user', () => {
  fetchUser(userId)
}) // Depends on previous test
```

### 4. Mock External Dependencies

```typescript
// ✅ Good: Mock external services
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(),
}))

// ❌ Bad: Real API calls in tests
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
```

### 5. Meaningful Assertions

```typescript
// ✅ Good: Specific assertions
expect(result.data?.tier).toBe('silver')
expect(result.data?.total_xp).toBe(250)

// ❌ Bad: Vague assertions
expect(result.data).toBeTruthy()
```

---

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:

- ✅ Pull requests
- ✅ Pushes to `main`
- ✅ Nightly builds

### Workflow Steps

1. **Install dependencies**
2. **Run unit tests** with coverage
3. **Run integration tests**
4. **Run E2E tests** (Chromium only in CI)
5. **Upload coverage** to Codecov
6. **Fail if coverage drops** below threshold

### Local Pre-Commit

```bash
# Run before committing
npm test && npm run test:e2e
```

---

## Troubleshooting

### Common Issues

#### 1. Tests Timeout

```bash
# Increase timeout in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  },
})
```

#### 2. E2E Tests Fail Locally

```bash
# Make sure dev server is running
npm run dev

# Then run E2E tests in another terminal
npm run test:e2e
```

#### 3. Mock Not Working

```typescript
// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})

// Reset modules if needed
beforeEach(() => {
  vi.resetModules()
})
```

#### 4. Playwright Browser Issues

```bash
# Reinstall browsers
npx playwright install

# Install system dependencies
npx playwright install-deps
```

### Debug Mode

```bash
# Vitest debug
npm test -- --reporter=verbose

# Playwright debug
npm run test:e2e -- --debug

# Playwright headed mode
npm run test:e2e -- --headed
```

---

## Quick Reference

### Test Commands

| Command                 | Description                |
| ----------------------- | -------------------------- |
| `npm test`              | Run unit/integration tests |
| `npm test -- --watch`   | Watch mode                 |
| `npm run test:ui`       | Vitest UI                  |
| `npm run test:coverage` | Coverage report            |
| `npm run test:e2e`      | E2E tests                  |
| `npm run test:e2e:ui`   | Playwright UI              |

### Coverage Thresholds

| Type           | Target |
| -------------- | ------ |
| Critical paths | 90%+   |
| Business logic | 80%+   |
| Utilities      | 70%+   |
| Overall        | 70%+   |

### Test Distribution

| Type        | Count   | Purpose                |
| ----------- | ------- | ---------------------- |
| Unit        | 89      | Fast, isolated testing |
| Integration | 29      | Multi-component flows  |
| E2E         | 48      | Full user journeys     |
| **Total**   | **166** | Complete coverage      |

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Project Implementation Plan](./implementation_plan.md)
- [Test Walkthrough](./walkthrough.md)

---

**Last Updated:** February 10, 2026  
**Test Suite Version:** 1.0.0
