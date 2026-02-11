# Test Coverage Requirements

## Overview

This document defines the test coverage requirements for the ecommerce_premium project.

## Coverage Targets

### Overall Coverage
- **Minimum:** 70% statement coverage
- **Target:** 80% statement coverage
- **Aspirational:** 90%+ statement coverage

### By Category

#### Critical Paths (90%+ required)
- Cart operations (`src/actions/cart.ts`)
- Gamification logic (`src/lib/gamification.ts`)
- Currency conversion (`src/lib/currency.ts`)
- Discount validation (`src/actions/checkout.ts`)

#### Business Logic (80%+ required)
- Checkout flow
- Order creation
- User authentication
- Payment processing

#### Utilities (70%+ required)
- Helper functions
- Formatting utilities
- Validation functions

## Test Distribution

### Current Status ✅

**Total Tests: 166**

| Type | Count | Coverage |
|------|-------|----------|
| Unit Tests | 89 | Critical paths |
| Integration Tests | 29 | Multi-component flows |
| E2E Tests | 48 | User journeys |

### Breakdown by Module

#### Unit Tests (89)
- ✅ Gamification: 38 tests (100% coverage)
- ✅ Currency: 30 tests (100% coverage)
- ✅ Checkout Validation: 15 tests (validation logic)
- ✅ Cart Actions: 6 tests (96.55% coverage)

#### Integration Tests (29)
- ✅ Auth Integration: 15 tests
- ✅ Webhook Handling: 14 tests

#### E2E Tests (48)
- ✅ Product Browsing: 5 tests
- ✅ Checkout Flow: 21 tests
- ✅ Account Management: 27 tests

## Coverage Enforcement

### CI/CD Pipeline

Tests run on:
- Every pull request
- Pushes to `main` and `develop`
- Nightly builds

### Failure Conditions

The CI pipeline will **fail** if:
1. Overall coverage drops below 70%
2. Any critical path drops below 90%
3. Any test fails
4. TypeScript type errors exist
5. ESLint errors exist

### Coverage Reports

- **Codecov:** Automatic upload on CI runs
- **Local:** Run `npm run test:coverage` and view `coverage/index.html`

## Adding New Code

### Requirements for New Features

When adding new code, ensure:

1. **Unit tests** for all new functions
2. **Integration tests** for new flows
3. **E2E tests** for new user journeys
4. Coverage doesn't drop below thresholds

### Example Checklist

- [ ] Unit tests written
- [ ] Integration tests added (if applicable)
- [ ] E2E tests created (if user-facing)
- [ ] Coverage report reviewed
- [ ] All tests passing locally
- [ ] CI pipeline passing

## Monitoring Coverage

### View Current Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open in browser
open coverage/index.html
```

### Coverage by File

Check `coverage/coverage-summary.json` for detailed metrics:

```json
{
  "total": {
    "lines": { "pct": 75.5 },
    "statements": { "pct": 74.2 },
    "functions": { "pct": 80.1 },
    "branches": { "pct": 70.3 }
  }
}
```

## Exceptions

### Files Excluded from Coverage

- Configuration files (`*.config.ts`)
- Type definitions (`*.d.ts`)
- Test files (`**/__tests__/**`, `**/*.test.ts`, `**/*.spec.ts`)
- Build output (`.next/`, `dist/`)
- Node modules

### Low-Priority Coverage

Some files may have lower coverage requirements:
- UI components (covered by E2E tests)
- Middleware (integration tested)
- API routes (webhook tested)

## Improvement Plan

### Short-term Goals (Next Sprint)
- [ ] Increase overall coverage to 75%
- [ ] Add missing integration tests for order flow
- [ ] Expand E2E tests for edge cases

### Long-term Goals (Next Quarter)
- [ ] Achieve 80% overall coverage
- [ ] 100% coverage on all critical paths
- [ ] Performance testing suite
- [ ] Visual regression testing

## Resources

- [TESTING.md](./TESTING.md) - Complete testing guide
- [Vitest Coverage](https://vitest.dev/guide/coverage.html)
- [Codecov Dashboard](https://codecov.io/)

---

**Last Updated:** February 10, 2026  
**Maintained by:** Development Team
