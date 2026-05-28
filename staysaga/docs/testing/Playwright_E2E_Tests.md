# StaySaga - Playwright E2E Automation Tests

This document contains automated End-to-End (E2E) test specifications for Playwright. The tests cover multi-role authentication, checkout flows, concurrency check for double-booking prevention, and authorization bypass checks.

---

## 1. Setup & Installation

Before running the tests, ensure Playwright is installed in your workspace:

```bash
npm install -D @playwright/test
npx playwright install
```

Create a `playwright.config.ts` configuration file:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1, // Concurrency tests require serialized execution for database assertions
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

---

## 2. Test Specifications

Create `tests/auth.spec.ts` for multi-role credential verification:

### 2.1 Multi-Role Authentication Spec (`tests/auth.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Multi-Role Authentication & Access Gates', () => {

  test('Guest can login and view guest dashboard but not admin dashboard', async ({ page }) => {
    // 1. Go to login page
    await page.goto('/login');
    await page.fill('input[type="email"]', 'guest@staysaga.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // 2. Assert redirect to homepage/dashboard
    await expect(page).toHaveURL('/');
    await page.goto('/profile');
    await expect(page.locator('h1')).toContainText('Hồ sơ cá nhân');

    // 3. Try to access host/admin and verify redirection
    await page.goto('/admin');
    await expect(page).not.toHaveURL('/admin');
  });

  test('Host can login and view host portal but not admin panel', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'host@staysaga.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/');
    
    // Go to host page
    await page.goto('/host');
    await expect(page.locator('h1')).toContainText('Trang chủ Nhóm chỗ nghỉ');

    // Access admin page
    await page.goto('/admin');
    await expect(page).not.toHaveURL('/admin');
  });

  test('Admin can access the administrator control panel', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@staysaga.com');
    await page.fill('input[type="password"]', 'AdminPassword123!');
    await page.click('button[type="submit"]');

    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Trang quản trị');
  });
});
```

### 2.2 Booking Checkout Spec (`tests/booking.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Booking Checkout & Payment Integration Flow', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate as a guest
    await page.goto('/login');
    await page.fill('input[type="email"]', 'guest@staysaga.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('Guest can search, select a homestay, and complete checkout payment', async ({ page }) => {
    // 1. Search for homestay
    await page.goto('/homestays');
    await page.fill('input[placeholder*="Tìm kiếm"]', 'Đà Lạt');
    await page.click('button:has-text("Tìm kiếm")');

    // 2. Select first homestay card
    const firstCard = page.locator('.homestay-card').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // 3. Select room and choose dates on Detail Page
    await page.click('button:has-text("Đặt phòng")');

    // 4. Fill guest details
    await expect(page).toHaveURL(/\/checkout/);
    await page.fill('input[name="guest_name"]', 'Nguyễn Văn A');
    await page.fill('input[name="guest_phone"]', '0912345678');
    await page.check('input[type="checkbox"]'); // Accept terms
    
    // 5. Submit booking to Stripe Payment simulator
    await page.click('button:has-text("Thanh toán")');

    // 6. Assert success page redirection
    await expect(page).toHaveURL(/\/bookings\/success/);
    await expect(page.locator('h2')).toContainText('Đặt phòng thành công');
  });
});
```

### 2.3 Double-Booking Prevention Concurrency Spec (`tests/concurrency.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Concurrency Double-Booking Prevention', () => {

  test('System prevents overlapping bookings for the same room on the same dates', async ({ browser }) => {
    // 1. Setup two parallel browser contexts
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 2. Log in both contexts with different accounts
    await pageA.goto('/login');
    await pageA.fill('input[type="email"]', 'guestA@staysaga.com');
    await pageA.fill('input[type="password"]', 'Password123!');
    await pageA.click('button[type="submit"]');

    await pageB.goto('/login');
    await pageB.fill('input[type="email"]', 'guestB@staysaga.com');
    await pageB.fill('input[type="password"]', 'Password123!');
    await pageB.click('button[type="submit"]');

    // 3. Navigate both pages to same property checkout page with identical dates
    const testCheckoutURL = '/checkout/target-room-id?checkin=2026-06-10&checkout=2026-06-15';
    await pageA.goto(testCheckoutURL);
    await pageB.goto(testCheckoutURL);

    // 4. Fill checkout forms for both
    await pageA.fill('input[name="guest_name"]', 'Guest A');
    await pageA.fill('input[name="guest_phone"]', '0911111111');
    await pageA.check('input[type="checkbox"]');

    await pageB.fill('input[name="guest_name"]', 'Guest B');
    await pageB.fill('input[name="guest_phone"]', '0922222222');
    await pageB.check('input[type="checkbox"]');

    // 5. Trigger pay submit concurrently
    const [responseA, responseB] = await Promise.all([
      pageA.click('button:has-text("Thanh toán")'),
      pageB.click('button:has-text("Thanh toán")'),
    ]);

    // 6. Assert one booking succeeded and one failed with validation conflict
    // One page should succeed and reach the success page, while the other fails.
    const urlA = pageA.url();
    const urlB = pageB.url();

    const successA = urlA.includes('/bookings/success');
    const successB = urlB.includes('/bookings/success');

    // Assert strictly one context succeeded
    expect(successA !== successB).toBeTruthy();

    if (!successA) {
      await expect(pageA.locator('.error-message')).toContainText('đã được đặt');
    }
    if (!successB) {
      await expect(pageB.locator('.error-message')).toContainText('đã được đặt');
    }

    await contextA.close();
    await contextB.close();
  });
});
```

### 2.4 Access Control Bypass / IDOR Spec (`tests/security.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Insecure Direct Object Reference (IDOR) & RBAC Gates', () => {

  test('Guest cannot access other guest private booking data via direct API calls', async ({ page }) => {
    // 1. Authenticate as Guest A
    await page.goto('/login');
    await page.fill('input[type="email"]', 'guestA@staysaga.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // 2. Send fetch API request directly to foreign booking ID
    const foreignBookingId = 'f2f1e54d-2c29-4c07-a946-bfa105578ea2'; // Guest B booking ID
    const response = await page.evaluate(async (id) => {
      const res = await fetch(`/api/bookings/${id}`);
      return { status: res.status };
    }, foreignBookingId);

    // 3. Assert access forbidden
    expect(response.status).toBe(403);
  });

  test('Host A cannot edit Host B property information via API requests', async ({ page }) => {
    // 1. Authenticate as Host A
    await page.goto('/login');
    await page.fill('input[type="email"]', 'hostA@staysaga.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // 2. Perform direct PUT to a property ID owned by Host B
    const foreignPropertyId = 'c73a77a5-00d5-40a3-8531-679c8c042b47';
    const response = await page.evaluate(async (id) => {
      const res = await fetch(`/api/homestays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hacked by Host A' }),
      });
      return { status: res.status };
    }, foreignPropertyId);

    // 3. Assert access forbidden
    expect(response.status).toBe(403);
  });
});
```

---

## 3. Running Automated Tests

Run the full suite:

```bash
npx playwright test
```

Generate the test reports:

```bash
npx playwright show-report
```
