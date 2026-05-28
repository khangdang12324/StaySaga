# StaySaga - OWASP Security & Business Logic Abuse Manual

This document details tests for verifying **OWASP Top 10 vulnerabilities** and **Business Logic flaws** specific to the StaySaga booking platform.

---

## 1. Vulnerability Checklists & Payloads

### 1.1 SQL Injection (SQLi)
*   **Target Area**: Search box, Login field, `/api/bookings` filter parameter.
*   **Purpose**: Test if unsanitized parameters propagate directly into raw SQL query builders.
*   **Test Payloads**:
    *   Auth bypass attempt: `' OR '1'='1` or `' OR 1=1 --`
    *   Boolean-based check: `admin' AND 1=1 --`
    *   Time-based test: `Đà Lạt' AND pg_sleep(5) --`
*   **Verification Steps**:
    1. Enter `' OR '1'='1` in the login email text input field and submit.
    2. Check response. The application must deny the request (401/400) and NOT authenticate a user.
    3. Trigger a search for location: `Đà Lạt' AND pg_sleep(5) --`.
    4. Check request duration. If the server delays execution by exactly 5 seconds, it is vulnerable to time-based SQLi.
*   **Mitigation**: Parameterized queries via Supabase client JS / Prisma.

---

### 1.2 Cross-Site Scripting (XSS)
*   **Target Area**: Homestay description input (Host onboarding), Guest Review Comment, Profile Full Name.
*   **Purpose**: Verify if rendering inputs executes JavaScript within the client's browser context.
*   **Test Payloads**:
    *   Simple Alert tag: `<script>alert('XSS')</script>`
    *   Image Error execution: `<img src=x onerror=alert(document.cookie)>`
    *   HTML Attribute event: `" onmouseover="alert('XSS')`
*   **Verification Steps**:
    1. Log in as Guest, navigate to `/bookings/success` and review your finished stay.
    2. Paste `<img src=x onerror=alert(document.cookie)>` inside the comment box.
    3. Submit review, then open the public homestay detail listing page.
    4. If a modal displaying cookies triggers on screen load, the page is vulnerable to stored XSS.
*   **Mitigation**: Escaping markup using React virtual DOM or sanitizing input fields with libraries like `dompurify`.

---

### 1.3 Insecure Direct Object Reference (IDOR)
*   **Target Area**: `/api/bookings/[id]`, `/api/invoice/[id]`, `/host/properties/[id]/edit`
*   **Purpose**: Verify if shifting IDs exposes data belonging to another account.
*   **Verification Steps**:
    1. Log in as Guest A, inspect network traffic, and locate your booking detail request API endpoint.
    2. Log in as Guest B, copy one of your booking IDs (e.g. `f2f1e54d-2c29-4c07-a946-bfa105578ea2`).
    3. While authenticated under Guest A, attempt to query Guest B's booking URL: `GET /api/bookings/f2f1e54d-2c29-4c07-a946-bfa105578ea2`.
    4. Assert that the server returns a `403 Forbidden` or `404 Not Found` response, and does not leak the details.
*   **Mitigation**: Secure DB queries linking the user session ID to the query parameters (`owner_id = auth.uid()`).

---

### 1.4 CSRF (Cross-Site Request Forgery)
*   **Target Area**: State-modifying API POST/PUT requests (e.g. creating bookings, modifying rates, user settings change).
*   **Verification Steps**:
    1. Authenticate to the web application to establish active session cookies.
    2. Create a local mock HTML page containing a form that targets the API route:
       ```html
       <form action="http://localhost:3000/api/profile" method="POST">
         <input type="hidden" name="full_name" value="Attacker Profile Change" />
       </form>
       <script>document.forms[0].submit();</script>
       ```
    3. Load this HTML page in a separate browser tab.
    4. Verify if your user profile was updated. The request should be blocked.
*   **Mitigation**: Ensure REST APIs require header authorization (Bearer JWT) instead of relying on default session cookie propagation, or set `SameSite=Strict` cookies.

---

## 2. Business Logic Abuse Scenarios

| Logic Attack | Payload / Steps | Expected Secure Behavior | Risk |
|--------------|-----------------|--------------------------|------|
| **1. Client-Side Price Tamper** | POST `/api/bookings` with modified `"price_per_night": 100` parameter. | Backend ignores client price and pulls rate from the database. | Host loses revenue; bookings processed with fake prices. |
| **2. Overlapping Date Booking** | Send booking POST request directly to API for dates that are already booked (`checkin: 2026-06-10`, `checkout: 2026-06-12`). | DB transaction check returns `409 Conflict` (blocked by Postgres exclusion constraints). | Double booking; overbooking; logistics crash. |
| **3. Duplicate Coupon Abuse** | Re-submit active booking using coupon `FIRSTTIME` multiple times concurrently. | Coupon limits checked sequentially; system blocks duplicate usage. | Losses from discount exploitation. |
| **4. Arbitrary Role Escalation** | Register account sending parameter `"role": "ADMIN"`. | Payload role field filtered out; account registered strictly as `GUEST`. | Complete system takeover by unauthorized users. |
| **5. Fake Webhook Injection** | Send payment webhook callback with forged transaction parameters. | Webhook rejected due to missing/invalid payment signature verification. | Fraudulent bookings confirmed without payment. |
| **6. Cancel Saturated Window** | Request booking cancellation with full refund after checkout date. | State machine checks check-in date rules and denies cancellation/refund. | Policy bypass; illegal chargebacks. |
| **7. Excess Refund Request** | Request refund of 2,000,000 VND on an order that cost 1,200,000 VND. | Refund logic rejects request; refund sum capped at original transaction sum. | Direct financial theft. |
| **8. Arbitrary Deletion** | Host attempts to delete listing while bookings exist in the future. | Delete request blocked or homestay soft-deleted (hidden from search, bookings kept active). | Active customer bookings stranded. |
| **9. Stale Price Booking** | Guest stays on checkout screen while Host raises base room rate. | Checkout process checks and displays warning of rate change, or recalculates base. | Guests booking under outdated prices. |
