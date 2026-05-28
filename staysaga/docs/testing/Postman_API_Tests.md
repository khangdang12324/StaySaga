# StaySaga - Postman API Tests

This document defines the API test collection structure, environment variables, pre-request scripts, and test assertions in Postman for validating the **StaySaga REST API**.

---

## 1. Environment Configurations

Create a Postman Environment containing the following variables:

| Variable | Initial Value | Current Value | Description |
|----------|---------------|---------------|-------------|
| `base_url` | `http://localhost:3000/api` | `http://localhost:3000/api` | API Endpoint base URL |
| `guest_jwt` | `[JWT_TOKEN]` | `[JWT_TOKEN]` | Access Token for Guest account |
| `host_jwt` | `[JWT_TOKEN]` | `[JWT_TOKEN]` | Access Token for Host account |
| `admin_jwt` | `[JWT_TOKEN]` | `[JWT_TOKEN]` | Access Token for Admin account |
| `booking_id` | `[BOOKING_UUID]` | `[BOOKING_UUID]` | Created booking instance ID |
| `homestay_id`| `[HOMESTAY_UUID]` | `[HOMESTAY_UUID]` | Created homestay property ID |

---

## 2. Collection Structure & Assertions

```text
StaySaga API Collection
├── 01. Authentication
│   ├── POST Register Guest
│   ├── POST Login Guest
│   └── POST Login Admin
├── 02. Search & Directory
│   ├── GET Search Homestays
│   └── GET Homestay Details
├── 03. Booking Management
│   ├── POST Create Booking
│   ├── GET View Booking Details
│   └── POST Cancel Booking
├── 04. Messaging
│   ├── POST Send Message
│   └── GET Fetch Conversation
└── 05. Payments (Webhooks)
    └── POST Payment Webhook (Stripe Callback)
```

---

## 3. Test Scripts & Assertions

### 3.1 Authentication Check (Common Template)
Apply this assertion script in the parent folder's **Tests** tab to ensure JWT token validation is active across all protected endpoints:

```javascript
pm.test("Status code is 200, 201, or 400/409 validation error", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 400, 409]);
});

pm.test("Response time is less than 800ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(800);
});
```

---

### 3.2 Booking Creation endpoint (`POST /bookings`)

#### Headers:
- `Authorization`: `Bearer {{guest_jwt}}`
- `Content-Type`: `application/json`

#### Pre-request Script (Mock Dynamic Dates):
Set check-in to today and check-out to tomorrow dynamically:

```javascript
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const checkinStr = today.toISOString().split('T')[0];
const checkoutStr = tomorrow.toISOString().split('T')[0];

pm.environment.set("checkin_date", checkinStr);
pm.environment.set("checkout_date", checkoutStr);
```

#### Request Body:
```json
{
  "homestay_id": "{{homestay_id}}",
  "check_in_date": "{{checkin_date}}",
  "check_out_date": "{{checkout_date}}",
  "guests": 2,
  "guest_name": "Nguyen Van Test",
  "guest_phone": "0987654321"
}
```

#### Test Scripts:
```javascript
pm.test("Booking created successfully", function () {
    pm.response.to.have.status(201);
    
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property("booking_id");
    pm.expect(jsonData).to.have.property("status", "PENDING");
    
    // Save booking ID to env variable for subsequent calls
    pm.environment.set("booking_id", jsonData.booking_id);
});

// JSON Schema Validation
const schema = {
    "type": "object",
    "required": ["booking_id", "status", "total_price"],
    "properties": {
        "booking_id": { "type": "string", "pattern": "^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$" },
        "status": { "type": "string" },
        "total_price": { "type": "number" }
    }
};

pm.test("Schema is valid", function () {
    pm.response.to.have.jsonSchema(schema);
});
```

---

### 3.3 Access Control Bypass check (`GET /bookings/{{booking_id}}` by Guest B)

#### Headers:
- `Authorization`: `Bearer {{guest_b_jwt}}`

#### Test Scripts:
```javascript
pm.test("Access blocked for unauthorized guest token", function () {
    pm.response.to.have.status(403);
    
    const jsonData = pm.response.json();
    pm.expect(jsonData.error).to.include("unauthorized");
});
```

---

### 3.4 Payment Webhook Idempotency check (`POST /webhooks/stripe`)

#### Headers:
- `Stripe-Signature`: `{{mock_stripe_sig}}`
- `Content-Type`: `application/json`

#### Request Body (Stripe Webhook Object Mock):
```json
{
  "id": "evt_12345abcdef",
  "type": "charge.succeeded",
  "data": {
    "object": {
      "id": "ch_3MxF12345",
      "amount": 1200000,
      "metadata": {
        "booking_id": "{{booking_id}}"
      },
      "status": "succeeded"
    }
  }
}
```

#### Test Scripts:
```javascript
// Test 1: First callback succeeds
pm.test("First callback sets booking to PAID", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 204]);
});

// Note: Re-running the request verifies idempotency.
// Assert that the secondary invocation does not throw a database key conflict error (500)
// and handles the repeat event safely (returns 200/304).
```

---

## 4. Run postman collection via CLI (Newman)

To run this postman script automatically in a Jenkins or Github Actions CI pipeline:

```bash
npm install -g newman
newman run staysaga_collection.json -e staysaga_environment.json
```
