# StaySaga - Detailed Test Cases

This document lists comprehensive test cases for the StaySaga booking platform across 20 modules.

---

## Module 1: Authentication (AUTH)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-AUTH-001 | Guest | Register | High | None | Valid email, strong password, full name | 1. Go to `/register`<br>2. Fill in form<br>3. Submit | Account created; role set to Guest; redirect to onboarding. | Positive | Yes |
| TC-AUTH-002 | Guest | Register | High | None | Email already registered | 1. Enter duplicate email<br>2. Fill form<br>3. Submit | Show "Email already registered" error; no duplicate user. | Negative | Yes |
| TC-AUTH-003 | Guest | Register | Medium | None | Malformed email | 1. Enter `invalid-email`<br>2. Submit | Form block; API returns 400 validation error. | Negative | Yes |
| TC-AUTH-004 | Guest | Register | Medium | None | Short password | 1. Enter 4-character password<br>2. Submit | Show validation error "Min length is 8 characters". | Negative | Yes |
| TC-AUTH-005 | Guest | Register | Medium | None | Weak password (no symbols) | 1. Enter password `abcdefgh`<br>2. Submit | Reject or prompt user depending on security guidelines. | Edge | Yes |
| TC-AUTH-006 | Guest | Register | High | None | XSS script payload | 1. Enter `<script>alert(1)</script>` as full name<br>2. Submit | Value sanitized or html-escaped; no XSS execution. | Security | Yes |
| TC-AUTH-007 | Guest | Login | High | Existing account | Correct email/password | 1. Go to `/login`<br>2. Fill details<br>3. Submit | Logged in; session created; redirect to homepage. | Positive | Yes |
| TC-AUTH-008 | Guest | Login | High | Existing account | Incorrect password | 1. Enter right email, wrong password<br>2. Submit | "Invalid credentials" error; no session generated. | Negative | Yes |
| TC-AUTH-009 | Guest | Login | High | Account locked | Valid credentials | 1. Login with locked account | Blocked; show message "Account has been locked". | Negative | Yes |
| TC-AUTH-010 | Guest | Logout | High | Logged in | None | 1. Click logout button | Session terminated; redirected to homepage/login. | Positive | Yes |
| TC-AUTH-011 | Guest | Reset Pwd | Medium | Existing account | Valid registered email | 1. Request reset link | Reset email sent containing temporary secure token. | Positive | Yes |
| TC-AUTH-012 | Guest | Reset Pwd | Medium | None | Non-existent email | 1. Request reset link | Show successful trigger message to prevent email enumeration. | Security | Yes |
| TC-AUTH-013 | Guest | Session | High | Logged in | Expired session token | 1. Attempt access to protected page after expiration | Redirect to login page with `next` query param. | Negative | Yes |
| TC-AUTH-014 | Host | Register | High | Guest account | Valid host onboarding details | 1. Onboard as host | Profile role upgraded to Host; redirect to `/host`. | Positive | Yes |
| TC-AUTH-015 | Guest | Register | Medium | None | Unicode name check | 1. Register with name `Phúc Khang Đặng Nguyễn` | Registration succeeds; name displays correctly on UI. | Edge | No |

---

## Module 2: Authorization & RBAC (AUTH-RBAC)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-RBAC-016 | Guest | Role Check | High | Logged in as Guest | Protected `/admin` routes | 1. Access `/admin` | Access denied (403 or redirect to `/login`). | Security | Yes |
| TC-RBAC-017 | Guest | Role Check | High | Logged in as Guest | Protected `/host` dashboard | 1. Access `/host` | Redirected to `/host/onboard` or home page. | Security | Yes |
| TC-RBAC-018 | Host | Role Check | High | Logged in as Host | Protected `/admin` routes | 1. Access `/admin` | Access denied (403 or redirect to page). | Security | Yes |
| TC-RBAC-019 | Host | RBAC Check | High | Logged in as Host | Other host's property ID | 1. Send update request for foreign homestay ID | API rejects with 403 Forbidden. | Security | Yes |
| TC-RBAC-020 | Host | RBAC Check | High | Logged in as Host | Other host's booking ID | 1. View detail of other host's booking | API returns 404/403; data is protected. | Security | Yes |
| TC-RBAC-021 | Guest | RBAC Check | High | Logged in as Guest | Other guest's booking ID | 1. View detail via URL manipulation | API returns 404/403. | Security | Yes |
| TC-RBAC-022 | Admin | Role Check | High | Logged in as Admin | All routes | 1. Access `/admin`, `/host`, `/` | Full access granted on all dashboards. | Positive | Yes |
| TC-RBAC-023 | Guest | DB Access | High | Logged in as Guest | Direct SQL request bypass | 1. Fetch `profiles` table via Supabase client | RLS blocks unauthorized queries. | Security | Yes |
| TC-RBAC-024 | Host | DB Access | High | Logged in as Host | Direct SQL update client | 1. Update own role to `ADMIN` | RLS blocks update; operation rejected. | Security | Yes |
| TC-RBAC-025 | Guest | API Bypass | High | None | Direct POST to booking endpoint | 1. POST request without auth headers | Request blocked with 401 Unauthorized. | Security | Yes |
| TC-RBAC-026 | Admin | System edit | High | Logged in as Admin | Super admin settings | 1. Edit system global settings | Configuration updated successfully. | Positive | Yes |
| TC-RBAC-027 | Guest | Public Access| Medium | None | Public homestays directory | 1. View `/homestays` index | List displayed; no auth required. | Positive | Yes |
| TC-RBAC-028 | Guest | Public detail| Medium | None | Public homestay slug | 1. View `/homestays/[slug]` | Details page rendered; no auth required. | Positive | Yes |
| TC-RBAC-029 | Guest | Direct URL | High | Logged in as Guest | `/host/revenue` url | 1. Go to `/host/revenue` | Redirect to `/host/onboard`. | Security | Yes |
| TC-RBAC-030 | Guest | Direct URL | High | Logged in as Guest | `/admin/users` url | 1. Go to `/admin/users` | Redirect to `/login`. | Security | Yes |

---

## Module 3: Search Engine (SEARCH)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-SEARCH-031| Guest | Keyword | High | None | Location: "Đà Lạt" | 1. Enter location Đà Lạt<br>2. Click Search | Displays homestays in Đà Lạt only. | Positive | Yes |
| TC-SEARCH-032| Guest | Fuzzy Match | Medium | None | Location: "Da Lat" | 1. Enter location Da Lat<br>2. Search | Displays same homestays (normalizes diacritics). | Edge | Yes |
| TC-SEARCH-033| Guest | Spaces | Low | None | Location: "  Vũng  Tàu  " | 1. Enter location with spaces<br>2. Search | Trimmed and matched correctly to Vũng Tàu. | Edge | Yes |
| TC-SEARCH-034| Guest | SQLi Payload | High | None | Location: `' OR 1=1 --` | 1. Enter payload in search input<br>2. Search | Empty result or validation error; no SQL injection. | Security | Yes |
| TC-SEARCH-035| Guest | Dates | High | None | Check-in/out: today + 2 days | 1. Enter dates<br>2. Search | Only returns properties with free availability calendars. | Positive | Yes |
| TC-SEARCH-036| Guest | Expired Date | High | None | Check-in in the past | 1. Select yesterday as check-in | Blocked on calendar interface (past dates disabled). | Negative | Yes |
| TC-SEARCH-037| Guest | Date logic | High | None | Check-out before check-in | 1. Check-out < check-in date | Calendar blocks selection; throws validation error. | Negative | Yes |
| TC-SEARCH-038| Guest | Date limit | Medium | None | Same day check-in/out | 1. Select checkout same as check-in | Blocked or counts as 0 nights (requires at least 1 night). | Edge | Yes |
| TC-SEARCH-039| Guest | Guests limit | High | None | 5 guests | 1. Input 5 guests<br>2. Search | Excludes rooms with capacity < 5. | Positive | Yes |
| TC-SEARCH-040| Guest | Zero guests | Medium | None | 0 guests | 1. Set guests to 0 | Auto-clamp to 1 or throw validation warning. | Negative | Yes |
| TC-SEARCH-041| Guest | HTML bypass | High | None | `<script>` in search | 1. Input script tag<br>2. Search | Sanitized; input treated as plain text string. | Security | Yes |
| TC-SEARCH-042| Guest | Non-existent | Medium | None | Location: "Mars" | 1. Enter non-existent place | Displays "No properties found matching your search". | Positive | Yes |
| TC-SEARCH-043| Guest | Partial Search| Medium | None | Location: "Đà" | 1. Search Đà | Suggests/matches Đà Lạt, Đà Nẵng. | Positive | Yes |
| TC-SEARCH-044| Guest | Large query | Low | None | 500-char location | 1. Paste very long text | Clipped or validation error triggered safely. | Edge | No |
| TC-SEARCH-045| Guest | Active status| High | None | Location: "Đà Lạt" | 1. Search | Does not list unapproved or deactivated homestays. | Positive | Yes |

---

## Module 4: Filter & Sort Algorithms (FILTERS)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-FILT-046 | Guest | Price Range | High | Active search | Min: 200k, Max: 600k | 1. Slide price filter | Shows listings with price/night inside this range. | Positive | Yes |
| TC-FILT-047 | Guest | Price Edge | Medium | Active search | Min > Max | 1. Set min 500k, max 200k | Throw UI error or sync values automatically. | Edge | Yes |
| TC-FILT-048 | Guest | Price Zero | Medium | Active search | Min: 0, Max: 0 | 1. Set range to 0 | No listings shown (unless free rooms are available). | Edge | Yes |
| TC-FILT-049 | Guest | Amenities | High | Active search | Wifi, Pool | 1. Check Wifi & Pool filters | Shows listings containing BOTH Wifi and Pool. | Positive | Yes |
| TC-FILT-050 | Guest | Amenities OR | Medium | Active search | Wifi, Pets Allowed | 1. Check both checkboxes | Matches system's AND/OR logic rules correctly. | Positive | Yes |
| TC-FILT-051 | Guest | Rating Filter | High | Active search | Rating >= 4.0 | 1. Select rating filter | Shows listings with average reviews rating >= 4. | Positive | Yes |
| TC-FILT-052 | Guest | Rating empty | Medium | Active search | Rating >= 5.0 | 1. Select rating filter | If no homestay matches, display "No matching results". | Positive | Yes |
| TC-FILT-053 | Guest | Sort price asc| High | Active search | None | 1. Sort by Price: Low to High | Properties ordered with lowest price first. | Positive | Yes |
| TC-FILT-054 | Guest | Sort price desc| High | Active search | None | 1. Sort by Price: High to Low | Properties ordered with highest price first. | Positive | Yes |
| TC-FILT-055 | Guest | Sort rating | High | Active search | None | 1. Sort by Rating | Properties ordered descending by average rating. | Positive | Yes |
| TC-FILT-056 | Guest | Multi-filter | High | Active search | Price 200k-500k + Wifi | 1. Apply price and amenities | Correct intersect subset returned. | Positive | Yes |
| TC-FILT-057 | Guest | Clear filters | Medium | Filters applied | None | 1. Click "Clear all filters" | Filters reset; full search index restored. | Positive | Yes |
| TC-FILT-058 | Guest | Sort popular | Medium | Active search | None | 1. Sort by Popularity | Ordered by booking counts/views index. | Positive | Yes |
| TC-FILT-059 | Guest | Distance sort | Low | GPS coordinates | None | 1. Sort by Distance | Ordered ascending by distance to center. | Positive | Yes |
| TC-FILT-060 | Guest | UI Response | Medium | Active search | Toggle fast | 1. Rapidly check filters | Filters update dynamically; no race conditions in async fetch. | Performance| No |

---

## Module 5: Homestay & Property Details (DETAIL)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-DTL-061  | Guest | View Page | High | Active property | Valid Slug | 1. Click property name | Renders images, title, description, rooms, rules. | Positive | Yes |
| TC-DTL-062  | Guest | Missing Slug | Medium | None | Random slug string | 1. Navigate to `/homestays/invalid-slug` | Renders 404 page gracefully. | Negative | Yes |
| TC-DTL-063  | Guest | Suspended | High | Suspended property | Suspended Homestay ID | 1. Access detail page | Guest blocked with "Homestay temporarily unavailable". | Security | Yes |
| TC-DTL-064  | Guest | Draft | High | Draft property | Draft Homestay ID | 1. Access detail page | Guest blocked (unapproved properties hidden). | Security | Yes |
| TC-DTL-065  | Guest | No Images | Medium | Property has no images| Homestay ID | 1. Access detail page | Renders fallback placeholder image; layout clean. | Edge | No |
| TC-DTL-066  | Guest | Bad Images URL| Medium | Broken image URLs | Homestay ID | 1. Access detail page | Broken image replaced with fallback; page does not crash. | Edge | No |
| TC-DTL-067  | Guest | Description XSS| High | Malicious description | Script payload in desc | 1. View detail page | Description elements render as text; no code runs. | Security | Yes |
| TC-DTL-068  | Guest | Price check | High | Property has custom prices| Select weekend dates | 1. Choose weekend dates | Prices list updates to show weekend rate, not base rate. | Positive | Yes |
| TC-DTL-069  | Guest | Map | Medium | Lat/Lng coordinates | Location marker | 1. View location map | Map element loads centering coordinates correctly. | Positive | No |
| TC-DTL-070  | Guest | Reviews List | High | Property has reviews | Customer ratings | 1. Scroll to reviews | Displays rating score, breakdown, comment list, dates. | Positive | Yes |
| TC-DTL-071  | Guest | Rooms list | High | Rooms configured | Inventory count | 1. Check room selection | Lists room capacity, beds, private amenities. | Positive | Yes |
| TC-DTL-072  | Guest | Owner Profile | Medium | Owner profile completed| Owner info | 1. Check host profile box | Displays owner name, registration date, credentials. | Positive | Yes |
| TC-DTL-073  | Guest | Dynamic Calendar| High | Custom calendar active | Blocked dates | 1. Inspect calendar | Blocked dates are grayed out and unclickable. | Positive | Yes |
| TC-DTL-074  | Guest | Amenities icons| Low | Amenities checked | Icon list | 1. Check amenities display | Icons match the respective amenities tags (e.g. pool, AC). | Positive | No |
| TC-DTL-075  | Host | Live preview | Medium | Own listing | ID | 1. Click preview in dashboard | Host can view their own listing details even if pending. | Positive | Yes |

---

## Module 6: Booking Workflow (BOOKING)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-BKG-076  | Guest | Checkout Form | High | Logged in, select dates| Valid dates | 1. Click Book Room | Opens checkout form with contact info pre-filled. | Positive | Yes |
| TC-BKG-077  | Guest | Guest limit | High | Logged in | 5 guests for capacity 4 | 1. Try checkout | Blocked; warning says "Guests count exceeds capacity". | Negative | Yes |
| TC-BKG-078  | Guest | Contact validate| Medium | Logged in | Blank email/name | 1. Clear fields<br>2. Click Book | Throws form field validation errors. | Negative | Yes |
| TC-BKG-079  | Guest | Terms check | Medium | Logged in | Terms checkbox unchecked| 1. Try checkout | Blocked; requires accepting rules and terms. | Negative | Yes |
| TC-BKG-080  | Guest | Booking check | High | Room already booked | Overlapping dates | 1. Force checkout page via POST | Rejected by backend check; returns 409 Conflict. | Security | Yes |
| TC-BKG-081  | Guest | Check-in limit | Medium | Logged in | Check-in > 1 year out | 1. Choose distant date | Blocked or throws error depending on max window rules. | Edge | Yes |
| TC-BKG-082  | Guest | Unauthenticated| High | Guest logged out | Valid dates | 1. Click Book | Redirected to `/login` with `next` parameter. | Positive | Yes |
| TC-BKG-083  | Guest | DB fields check| High | Logged in | Booking payload | 1. Complete booking | Record inserts into `bookings` table with correct FKs. | Positive | Yes |
| TC-BKG-084  | Guest | Overlap borders| High | Checkin same day checkout| Day boundary | 1. Book check-in date equal to previous checkout date | Booking succeeds; same-day turnaround is allowed. | Edge | Yes |
| TC-BKG-085  | Guest | Back button | High | Payment page | Nav back | 1. Click back on gateway<br>2. Re-checkout | No duplicate booking entries created in database. | Edge | No |
| TC-BKG-086  | Guest | Multi-room | Medium | Multiple rooms available| Select 2 different rooms | 1. Checkout | Booking registers details for both rooms; sum correct. | Positive | Yes |
| TC-BKG-087  | Guest | Special Request| Low | Logged in | "Late check-in request" | 1. Input message in notes | Message saved and visible to Host in order details. | Positive | Yes |
| TC-BKG-088  | Guest | Blocked account| High | Locked Guest | Valid login state | 1. Attempt checkout | Blocked; API denies request as account is inactive. | Security | Yes |
| TC-BKG-089  | Guest | Price mismatch | High | Stale price on browser | Old price | 1. Force old checkout sum | Backend recalculates price; payment amount must be correct. | Security | Yes |
| TC-BKG-090  | Guest | Booking state | High | Logged in | Initial checkout | 1. Create order | Initial state set to `PENDING` (awaiting payment). | Positive | Yes |

---

## Module 7: Payment Integration & Webhooks (PAYMENT)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-PAY-091  | Guest | Gateway redirect| High | Checkout completed | Valid card metadata | 1. Choose Card payment | Redirected to secure payment gateway interface. | Positive | Yes |
| TC-PAY-092  | Guest | Payment Success | High | Redirected to gateway | Test card success | 1. Complete payment | Webhook fires; booking state updates to `PAID` / `CONFIRMED`.| Positive | Yes |
| TC-PAY-093  | Guest | Payment Failed | High | Redirected to gateway | Test card declined | 1. Fail payment | Webhook fires; booking stays `PENDING` or set to `FAILED`.| Negative | Yes |
| TC-PAY-094  | Guest | Double click | High | Checkout completed | Double click submit | 1. Click pay twice | Button disabled on first click; single transaction sent. | Edge | No |
| TC-PAY-095  | Guest | Webhook network | High | Payment success | Network timeout | 1. Block webhook return | System handles retries; webhook resolved eventually. | Edge | Yes |
| TC-PAY-096  | Guest | Webhook replay | High | Paid booking | Replay webhook packet | 1. Re-send success webhook | Idempotent check; no duplicate database credits/entries. | Security | Yes |
| TC-PAY-097  | Guest | Fake webhook | High | None | Fake Stripe signature | 1. Send forged webhook | Signature verification fails; event ignored; logs threat. | Security | Yes |
| TC-PAY-098  | Guest | Amount tamper | High | Checkout | Edit html price | 1. Submit modified sum | Reject checkout or override with backend computed sum. | Security | Yes |
| TC-PAY-099  | Guest | Partial payment | High | Checkout | Edit API payload | 1. Send payload with lower fee | Rejected; amount must match exact invoice total. | Security | Yes |
| TC-PAY-100  | Guest | Payment timeout | Medium | Checkout pending | No payment for 15 mins | 1. Leave page blank | Order expires; database reservation cleared. | Edge | Yes |
| TC-PAY-101  | Guest | Currency check | Medium | Multi-currency config | VND vs USD rates | 1. Check billing conversion | Correct conversion rates and formatting shown on billing. | Edge | Yes |
| TC-PAY-102  | Guest | Payment Log | Medium | Payment processed | Transaction ID | 1. Query DB payments table | Transaction metadata, amount, provider logged correctly. | Positive | Yes |
| TC-PAY-103  | Guest | Card format | Medium | Checkout form | Invalid card number | 1. Enter bad card digits | Client-side validation blocks payment execution. | Negative | Yes |
| TC-PAY-104  | Guest | Gateway crash | High | Checkout | Payment gateway 500 | 1. Trigger payment fail | Graceful warning: "Payment service is down, try later". | Edge | Yes |
| TC-PAY-105  | Guest | Refund request | High | Cancelled booking | Stripe refund API | 1. System cancels booking | Webhook triggers refund process at Stripe; status logged. | Positive | Yes |

---

## Module 8: Cancellation Policies (CANCEL)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-CAN-106  | Guest | Free cancel | High | Booking paid, policy free | check-in > 48h | 1. Click Cancel | Booking status: `CANCELLED`. Refund amount: 100%. | Positive | Yes |
| TC-CAN-107  | Guest | Paid cancel | High | Booking paid, policy strict| check-in < 24h | 1. Click Cancel | Warning shows cancellation fee. Refund: 0% or partial. | Negative | Yes |
| TC-CAN-108  | Guest | Cancel boundaries| Medium | Booking paid | check-in exactly 48h | 1. Cancel booking | Applies policy strictly based on hourly timezone diffs. | Edge | Yes |
| TC-CAN-109  | Guest | Cancel completed| High | Completed booking | Historical booking | 1. Attempt cancel | Option disabled/rejected (completed bookings cannot cancel).| Negative | Yes |
| TC-CAN-110  | Host | Host Cancel | High | Confirmed booking | Emergency | 1. Cancel booking as Host | Booking cancelled; guest refunded 100%; notification sent. | Positive | Yes |
| TC-CAN-111  | Admin | Admin Force Cancel| High | Active booking | Violation | 1. Admin cancels order | Booking cancelled; refund triggers; audit log updated. | Positive | Yes |
| TC-CAN-112  | Guest | Cancel unpaid | High | Unpaid booking | Pending status | 1. Cancel booking | Reservation cleared instantly; status set to `CANCELLED`. | Positive | Yes |
| TC-CAN-113  | Guest | Duplicate cancel| Medium | Cancelled booking | Re-send cancel POST | 1. Send cancellation again | Returns error "Booking is already cancelled". | Negative | Yes |
| TC-CAN-114  | Guest | Calendar check | High | Cancelled booking | check-in dates | 1. Search same dates | Cancelled dates are now open and available for search. | Positive | Yes |
| TC-CAN-115  | Guest | Policy HTML | Low | Policy details | Description text | 1. View policy page | Accurate policy parameters (time limits, percentages) shown. | Positive | No |

---

## Module 9: Refund Processing (REFUND)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-RFD-116  | Guest | Auto-refund | High | Cancelled free booking | Paid booking | 1. Cancel booking | Status changes to `REFUNDED`; Stripe refund triggered. | Positive | Yes |
| TC-RFD-117  | Guest | Partial refund | High | Cancelled strict booking | Fee applied | 1. Cancel booking | Refund record matches total minus fee. | Positive | Yes |
| TC-RFD-118  | Admin | Manual refund | High | Refund discrepancy | Custom amount | 1. Input custom refund | System executes partial/custom refund to card. | Positive | Yes |
| TC-RFD-119  | Guest | Excess refund | High | Refund processing | Forged payload | 1. Request refund > paid | Rejected; refund amount cannot exceed total paid. | Security | Yes |
| TC-RFD-120  | Guest | Refund check | Medium | Refund completed | Provider ref | 1. Check database | Refund status, time, reference ID saved in payments ledger. | Positive | Yes |
| TC-RFD-121  | Guest | Failed Refund | High | Cancelled booking | Gateway timeout | 1. Request refund | Booking cancelled; status: `REFUND_FAILED`; log admin alert. | Edge | Yes |
| TC-RFD-122  | Admin | Retry refund | Medium | Failed refund | Retry button | 1. Click retry refund | Webhook calls stripe again; completes successfully. | Positive | Yes |
| TC-RFD-123  | Guest | Multiple refund| High | Refunded booking | Click refund again | 1. Resend refund request | Blocked; total refunded reaches cap. | Security | Yes |
| TC-RFD-124  | Guest | Notification | Medium | Refund processed | Email confirmation | 1. Check inbox | Guest receives invoice/refund success receipt email. | Positive | Yes |
| TC-RFD-125  | Guest | Unpaid refund | High | Awaiting payment booking| Cancel request | 1. Cancel booking | Status: `CANCELLED`; no gateway refund request made. | Positive | Yes |

---

## Module 10: Reviews & Ratings Calculations (REVIEWS)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-REV-126  | Guest | Post Review | High | Completed booking | Rating: 5, Comment | 1. Fill review form | Review saved; rating score updated for homestay. | Positive | Yes |
| TC-REV-127  | Guest | Review early | High | Pending booking | Review payload | 1. POST review via API | Rejected; booking status must be `COMPLETED` to review. | Negative | Yes |
| TC-REV-128  | Guest | Duplicate review| High | Reviewed booking | Second review payload| 1. Try review again | Blocked; each booking ID can only have one review. | Negative | Yes |
| TC-REV-129  | Guest | Rating range | Medium | Completed booking | Rating: 6 | 1. Submit rating 6 | Validation block; score must be between 1 and 5. | Edge | Yes |
| TC-REV-130  | Guest | Rating avg check| High | Multiple reviews | 5-star & 3-star | 1. Post both reviews | Homestay average rating updates to exactly 4.0. | Positive | Yes |
| TC-REV-131  | Guest | Rating avg float| Medium | Multiple reviews | 5-star, 5-star, 4-star | 1. Post reviews | Avg rating calculates to 4.67 (no decimal formatting errors).| Edge | Yes |
| TC-REV-132  | Guest | Review XSS | High | Completed booking | `<script>alert(1)</script>`| 1. Submit review | Text rendered without execution on homestay detail page. | Security | Yes |
| TC-REV-133  | Guest | Edit review | Medium | Own review | Updated comment | 1. Edit review text | Comment updated; old rating replaced; logs change. | Positive | Yes |
| TC-REV-134  | Guest | Edit review RBAC| High | Other user's review | Edited comment | 1. Attempt edit | API rejects with 403 Forbidden. | Security | Yes |
| TC-REV-135  | Host | Reply review | Medium | Review on own listing | Host reply | 1. Submit reply text | Reply linked to review; renders below guest rating. | Positive | Yes |
| TC-REV-136  | Host | Reply foreign | High | Review on other listing| Host reply | 1. Attempt reply | Blocked with 403 Forbidden. | Security | Yes |
| TC-REV-137  | Admin | Delete review | Medium | Spam review | Delete button | 1. Click delete | Review hidden from public page; rating recalculated. | Positive | Yes |
| TC-REV-138  | Guest | Emoji support | Low | Completed booking | Emoji text | 1. Submit review with emoji| Review saves and renders emoji correctly. | Positive | No |
| TC-REV-139  | Guest | Empty comment | Medium | Completed booking | Rating only, no text | 1. Submit review | Succeeds; displays review score with empty text label. | Positive | Yes |
| TC-REV-140  | Guest | Deleted property| Medium | Homestay soft-deleted | Review access | 1. Try post review | Blocked; parent property no longer exists. | Negative | Yes |

---

## Module 11: Guest Dashboard (GUEST-DASH)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-GDSH-141 | Guest | View Bookings | High | Bookings exist | None | 1. Open dashboard | Lists all bookings: ID, dates, status, cost. | Positive | Yes |
| TC-GDSH-142 | Guest | Foreign booking| High | Logged in as Guest A | Guest B booking ID | 1. Access detailed view | Returns 404/403. Access denied. | Security | Yes |
| TC-GDSH-143 | Guest | Update profile| Medium | Logged in | New name, phone | 1. Edit profile fields | Data updated in database; changes persist. | Positive | Yes |
| TC-GDSH-144 | Guest | Profile SQLi | High | Logged in | SQL payload in name | 1. Edit profile | No SQL execution; name stored as raw string safely. | Security | Yes |
| TC-GDSH-145 | Guest | Favorites list| Medium | Homestays liked | Favorite status | 1. Click heart icon<br>2. View dashboard | Property appears in Favorites tab. | Positive | Yes |
| TC-GDSH-146 | Guest | Pagination | Medium | > 10 bookings | Pages | 1. Click page 2 | Displays next page of bookings; page indicators correct. | Positive | Yes |
| TC-GDSH-147 | Guest | Notification badge| Medium | Unread messages | Unread count | 1. View navbar badge | Unread badge count matches unread database messages count. | Positive | Yes |
| TC-GDSH-148 | Guest | Invoice PDF | Medium | Paid booking | PDF download | 1. Click Download Invoice| PDF generated with guest details, price, payment ref. | Positive | No |
| TC-GDSH-149 | Guest | Edit contact | Medium | Logged in | Blank fields | 1. Submit blank fields | Throws validation error; profile details unchanged. | Negative | Yes |
| TC-GDSH-150 | Guest | Account delete| Medium | Logged in | Delete account | 1. Confirm delete | Account deactivated/soft-deleted; active bookings alert. | Edge | Yes |

---

## Module 12: Host Dashboard - Stats & Revenue (HOST-DASH)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-HDSH-151 | Host | Revenue Calc | High | Multiple bookings paid | Paid vs cancelled | 1. View dashboard stats | Total revenue sum equals sum of `CONFIRMED`/`PAID` orders. | Positive | Yes |
| TC-HDSH-152 | Host | Cancelled Rev | High | Cancelled bookings | Fees applied | 1. View dashboard stats | Cancelled booking revenue shows only the cancellation fee. | Edge | Yes |
| TC-HDSH-153 | Host | Guest counts | Medium | Bookings today | Check-ins | 1. View stats | "Khách đến" count matches database check-ins for today. | Positive | Yes |
| TC-HDSH-154 | Host | Reviews score | Medium | Reviews posted | Avg rating | 1. View stats | Average rating matches score computed across own properties. | Positive | Yes |
| TC-HDSH-155 | Host | View Bookings | High | Bookings active | None | 1. Go to Host Bookings | Displays detailed table of bookings for own properties. | Positive | Yes |
| TC-HDSH-156 | Host | Foreign listings| High | Logged in as Host A | Host B properties | 1. Open listings view | Only own properties listed; Host B properties hidden. | Security | Yes |
| TC-HDSH-157 | Host | Accept Booking | High | Pending booking | Accept action | 1. Click Approve booking| Booking status updates to `CONFIRMED`. | Positive | Yes |
| TC-HDSH-158 | Host | Reject Booking | High | Pending booking | Reject action | 1. Click Reject booking | Status updates to `REJECTED`; automatic refund triggers. | Positive | Yes |
| TC-HDSH-159 | Host | Set Out of Order| Medium | Room inventory | Out of order calendar | 1. Block room on calendar| Guest search page hides room for blocked dates. | Positive | Yes |
| TC-HDSH-160 | Host | Bulk rates | Low | Calendar management | Date range | 1. Update rates for month| Price modified for entire selected range. | Positive | Yes |
| TC-HDSH-161 | Host | Chart rendering| Low | Month data | Revenue chart | 1. Load dashboard | Bar/line chart renders correct dataset; no visual overlap.| Positive | No |
| TC-HDSH-162 | Host | Messages unread| Medium | Unread messages | Count | 1. Check inbox badge | Badge count matches actual unread messages count. | Positive | Yes |
| TC-HDSH-163 | Host | Export CSV | Low | Active listings | CSV download | 1. Click download | CSV file generated with correct property inventory lists. | Positive | No |
| TC-HDSH-164 | Host | Check-out trigger| Medium | Completed checkout | Mark check-out | 1. Click checkout | Order status changes to `COMPLETED`; guest can review. | Positive | Yes |
| TC-HDSH-165 | Host | No-show trigger | Medium | Check-in day passed | Mark no-show | 1. Click no-show | Status changes to `NO_SHOW`; room inventory re-opened. | Positive | Yes |

---

## Module 13: Admin Dashboard (ADMIN-DASH)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-ADSH-166 | Admin | View Users | High | Users exist | User list | 1. Go to /admin/users | Lists profiles: ID, email, role, lock status. | Positive | Yes |
| TC-ADSH-167 | Admin | Search User | Medium | Users exist | Email target | 1. Search email | Returns correct matching profile record. | Positive | Yes |
| TC-ADSH-168 | Admin | Lock User | High | Active user | Lock action | 1. Click Lock user | User locked; active login sessions revoked. | Positive | Yes |
| TC-ADSH-169 | Admin | Unlock User | High | Locked user | Unlock action | 1. Click Unlock user | Account active; user can login again. | Positive | Yes |
| TC-ADSH-170 | Admin | Approve Homestay| High | Pending homestay | Approve action | 1. Click Approve | Status sets to `APPROVED`; listing public. | Positive | Yes |
| TC-ADSH-171 | Admin | Reject Homestay | High | Pending homestay | Reject action | 1. Click Reject | Status set to `REJECTED`; host notified. | Positive | Yes |
| TC-ADSH-172 | Admin | Hide Review | Medium | Live review | Hide action | 1. Click Hide review | Review status set to `HIDDEN`; hidden from public. | Positive | Yes |
| TC-ADSH-173 | Admin | View Logs | Medium | System actions done | Log history | 1. Check audit log page| Displays lists of admin actions, targets, times. | Positive | Yes |
| TC-ADSH-174 | Admin | Revoke Host | High | Active host | Change role to Guest | 1. Update role | Role changes to Guest; host dashboard blocked. | Positive | Yes |
| TC-ADSH-175 | Admin | Global Revenue | High | Bookings completed | Revenue index | 1. Open dashboard | Displays cumulative system sales count and revenues. | Positive | Yes |
| TC-ADSH-176 | Admin | Overlapping fix | High | Double-booking alert | Order IDs | 1. Force cancel one | System cancels overlapping order; resolves conflict. | Positive | Yes |
| TC-ADSH-177 | Admin | Delete user | Medium | Active user | Delete action | 1. Delete user | User profile removed or soft-deleted safely. | Positive | Yes |
| TC-ADSH-178 | Admin | Audit SQLi | High | Audit logs page | Query injection | 1. Search log actions | Safe from SQL injection; logs display query strings text. | Security | Yes |
| TC-ADSH-179 | Admin | Block Host | High | Active host | Block action | 1. Block host profile | All properties owned by this host hidden from search. | Positive | Yes |
| TC-ADSH-180 | Admin | Add setting | Medium | System configurations| VAT rate modification | 1. Change VAT to 10% | Global calculation formulas update to 10% tax. | Positive | Yes |

---

## Module 14: REST API Endpoints (API)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-API-181  | Guest | Auth check | High | No token | GET `/api/bookings` | 1. Send request | Returns 401 Unauthorized. | Security | Yes |
| TC-API-182  | Guest | Schema validate| Medium | Logged in | Empty booking body | 1. POST `/api/bookings` | Returns 400 Bad Request; validation fields listed. | Negative | Yes |
| TC-API-183  | Guest | Invalid payload| Medium | Logged in | String in integer guest| 1. POST `/api/bookings` | Returns 400 Bad Request. | Negative | Yes |
| TC-API-184  | Guest | Non-existent ID| Medium | Logged in | Fake room uuid | 1. POST `/api/bookings` | Returns 404 Not Found. | Negative | Yes |
| TC-API-185  | Guest | Overlap check | High | Logged in | Overlapping dates | 1. POST `/api/bookings` | Returns 409 Conflict. | Security | Yes |
| TC-API-186  | Guest | Rate Limiting | Medium | None | Fast repeated requests | 1. Send 100 requests/sec | Returns 429 Too Many Requests. | Performance| Yes |
| TC-API-187  | Guest | Security scan | High | None | SQLi payload in slug | 1. GET `/api/homestays/...` | Returns 400 or 404; no DB information leaked. | Security | Yes |
| TC-API-188  | Guest | Output filter | High | Logged in | View other profile | 1. GET `/api/users/other-id`| Sensitive parameters (password hash, email) filtered out. | Security | Yes |
| TC-API-189  | Guest | Pagination | Low | None | `limit=10&page=2` | 1. GET `/api/homestays` | Returns records 11 to 20; counts match database total. | Positive | Yes |
| TC-API-190  | Guest | CORS check | Medium | External browser | Origin header | 1. Options request | Blocked if external origin not allowed in policies. | Security | Yes |
| TC-API-191  | Guest | Method check | Medium | None | POST `/api/homestays/id`| 1. Send POST request | Returns 405 Method Not Allowed. | Negative | Yes |
| TC-API-192  | Guest | Json injection | High | Logged in | Duplicate keys in payload| 1. Send JSON payload | Parsed correctly without crashing parser; rejects junk. | Security | Yes |
| TC-API-193  | Guest | Message send | Medium | Active booking | POST `/api/messages` | 1. Send message | Message saved; receiver receives notification. | Positive | Yes |
| TC-API-194  | Guest | Msg validation | Medium | Active booking | Blank message | 1. Send blank string | Returns 400 Bad Request. | Negative | Yes |
| TC-API-195  | Guest | Invalid route | Low | None | GET `/api/random-route` | 1. Send request | Returns 404 Not Found. | Negative | Yes |

---

## Module 15: Database Constraints & Concurrency (DB-CONCUR)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-DBC-196  | Guest | Double booking | Critical| Two checkouts open | Guest A & B checkouts | 1. A and B click pay/book | Only one succeeds; other rejected; no duplicate booking. | Security | Yes |
| TC-DBC-197  | Guest | Date overlap DB| High | Direct query | Overlapping dates | 1. Force insert booking | Rejected by database constraint/trigger (exclusion check). | Security | Yes |
| TC-DBC-198  | Guest | Price check DB | High | Direct query | Price = -100 | 1. Insert room negative price| Database throws check constraint violation error. | Security | Yes |
| TC-DBC-199  | Guest | Rating scale DB| Medium | Direct query | Rating = 6 | 1. Insert review rating 6 | Throws check constraint violation error. | Security | Yes |
| TC-DBC-200  | Guest | FK validation | Medium | Direct query | Orphan booking profile | 1. Insert booking invalid FK | Rejected; constraint violation error. | Security | Yes |
| TC-DBC-201  | Guest | Email unique DB| High | Direct query | Duplicate email insert | 1. Insert duplicate email | Database throws unique index violation error. | Security | Yes |
| TC-DBC-202  | Guest | Room count check| High | Room full | Booking index max | 1. Try book | System returns error; database blocks overflow booking. | Negative | Yes |
| TC-DBC-203  | Host | Soft delete check| Medium | Deleted listing | Booking future | 1. Select deleted homestay | Homestay record marked as soft-deleted; bookings remain. | Edge | Yes |
| TC-DBC-204  | Guest | Concurrent msg | Low | Messaging session | Rapid chat sends | 1. Send multiple messages | Messages saved in correct chronological order index. | Edge | Yes |
| TC-DBC-205  | Guest | Transaction roll| High | Failed invoice | Payment fail | 1. Process payment | Booking creation rolled back if payment record write fails. | Security | Yes |

---

## Module 16: Security & OWASP Top 10 (SECURITY)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-SEC-206  | Guest | SQLi check | High | Login form | `' OR '1'='1` | 1. Enter query in login | Rejects auth; raw query not run. | Security | Yes |
| TC-SEC-207  | Guest | XSS review | High | Review post | `<img src=x onerror=alert(1)>`| 1. Submit review | Renders as plain string; no script executed. | Security | Yes |
| TC-SEC-208  | Guest | CSRF post | High | Logged in | External form post | 1. Submit from local html | Request blocked by CORS / CSRF protection tokens. | Security | Yes |
| TC-SEC-209  | Guest | IDOR profile | High | Logged in as Guest A | Guest B profile ID | 1. Attempt edit profile | API returns 403 Forbidden. | Security | Yes |
| TC-SEC-210  | Guest | IDOR invoice | High | Logged in as Guest A | Guest B invoice PDF | 1. Attempt download URL | API returns 403 or 404. | Security | Yes |
| TC-SEC-211  | Guest | Path Traversal | High | File Upload | `../../etc/passwd` filename| 1. Upload photo | File renamed; extension checked; path traversal blocked. | Security | Yes |
| TC-SEC-212  | Guest | Script Upload | High | File Upload | `test.php` file | 1. Upload PHP script | Upload rejected; only images allowed (MIME/Extension). | Security | Yes |
| TC-SEC-213  | Guest | Sensitive logs | High | System logs | Error logs | 1. Trigger errors | Logs do not record plain passwords or full credit cards. | Security | Yes |
| TC-SEC-214  | Guest | Session hijack | High | Logged in | Modified JWT signature | 1. Access protected route | Rejected; JWT signature verification failed. | Security | Yes |
| TC-SEC-215  | Guest | Brute Force login| High | None | Fast login requests | 1. Send 10 wrong logins | Account lock or captcha prompted; rate limit block. | Security | Yes |
| TC-SEC-216  | Guest | Mass assignment | High | Register | Payload: `role=admin` | 1. Submit registration | Role saved as Guest; extra parameters ignored. | Security | Yes |
| TC-SEC-217  | Guest | SSRF checkout | High | Link input | Malicious target URL | 1. Enter url in payload | Rejected or sanitized; backend does not call request. | Security | Yes |
| TC-SEC-218  | Guest | Clickjacking | Medium | Web index | Iframe wrapper | 1. Load site in iframe | Blocked by X-Frame-Options or Content-Security-Policy. | Security | Yes |
| TC-SEC-219  | Guest | Password plain | High | Database query | User accounts | 1. Query profiles | Password hashes (bcrypt/argon2) stored; no plain text. | Security | Yes |
| TC-SEC-220  | Guest | HTTP security | High | Production server | SSL | 1. Check HTTP headers | Strict-Transport-Security (HSTS), Secure cookie set. | Security | Yes |

---

## Module 17: Load & Performance (PERF)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-PRF-221  | Guest | Search response| High | 10k homestays in DB | Valid Search | 1. Search Đà Lạt | Response times under 1.5 seconds; database indices optimized. | Perf | Yes |
| TC-PRF-222  | Guest | Detail page | Medium | 50 high-res photos | Select homestay | 1. Open detail page | Lazy load active; page interactive in < 2 seconds. | Perf | No |
| TC-PRF-223  | Guest | Concurrency search| High | 100 concurrent users| Active search calls | 1. Simulate concurrent load| Response time stays stable; server handles peak requests. | Perf | Yes |
| TC-PRF-224  | Host | Dashboard load | Medium | > 1000 orders | Open page | 1. Load Host dashboard | Page loads in under 1 second using server-side pagination. | Perf | Yes |
| TC-PRF-225  | Guest | Lighthouse check| Medium | Production deployment| Home page | 1. Run Lighthouse test | Performance score >= 80, SEO score >= 90. | Perf | Yes |
| TC-PRF-226  | Guest | Memory leaks | Low | Active session | Fast navigation | 1. Click pages repeatedly | Memory usage stays stable; no client-side leak/crash. | Perf | No |
| TC-PRF-227  | Guest | DB lock timeout | High | Heavy concurrent writes| Booking inserts | 1. Send parallel bookings | Transactions queue correctly; no database lock timeout crash.| Perf | Yes |
| TC-PRF-228  | Guest | Cache check | Medium | Static homestays list | Re-load search | 1. Search location | Repeated queries cached or served fast. | Perf | Yes |
| TC-PRF-229  | Guest | Image compression| Low | High-res photos upload| 10MB photo | 1. Upload photo | Host uploads compressed version; file footprint reduced. | Perf | Yes |
| TC-PRF-230  | Guest | Bundle size | Medium | Production build | JS payloads | 1. Inspect script sizes | Core JS bundles optimized (code splitting, tree shaking). | Perf | Yes |

---

## Module 18: Responsive UI Layouts (RESPONSIVE)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-RES-231  | Guest | Desktop view | High | Screen size 1920x1080 | Home page | 1. View page | Full grid, sidebar filters, navbar list fully visible. | Positive | No |
| TC-RES-232  | Guest | Mobile view | High | Screen size 390x844 | Home page | 1. View page | Layout switches to 1-column; navbar links in hamburger menu.| Positive | No |
| TC-RES-233  | Guest | Tablet view | Medium | Screen size 768x1024 | Home page | 1. View page | Sidebar filter collapsable; text sizes scale correctly. | Positive | No |
| TC-RES-234  | Guest | Calendar Mobile| High | Mobile viewport | Calendar pick | 1. Select dates on mobile | Calendar inputs do not overflow screen boundaries. | Edge | No |
| TC-RES-235  | Guest | Search mobile | High | Mobile viewport | Search form | 1. Fill details and search | Button easily clickable; layout is comfortable. | Positive | No |
| TC-RES-236  | Host | Host Mobile UI | Medium | Mobile viewport | Revenue stats charts | 1. View dashboard charts | Charts fit within viewport width; data readable. | Positive | No |
| TC-RES-237  | Admin | Admin Mobile UI| Medium | Mobile viewport | Admin users table | 1. View table | Tables wrap or have responsive horizontal scroll enabled. | Positive | No |
| TC-RES-238  | Guest | Small mobile | Low | Screen size 320px | Checkout form | 1. View checkout | Inputs aligned; text does not overflow; layout clean. | Edge | No |
| TC-RES-239  | Guest | Modal mobile | Medium | Mobile viewport | Confirmation modal | 1. Trigger modal | Modal centered; content scrollable; close button visible. | Positive | No |
| TC-RES-240  | Guest | Button overlap | Medium | All screen sizes | Hover / click action | 1. Check layout links | No overlapping text blocks or overlay buttons. | Positive | No |

---

## Module 19: Email & Notifications (NOTIFY)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-NTF-241  | Guest | Register email | Medium | Active SMTP | Valid registration | 1. Register account | Verification/Welcome email received containing profile link.| Positive | Yes |
| TC-NTF-242  | Guest | Booking confirm| High | Active SMTP | Paid booking | 1. Complete booking | Order confirmation email received with transaction code. | Positive | Yes |
| TC-NTF-243  | Guest | Cancel notify | High | Active SMTP | Cancelled booking | 1. Cancel booking | Cancellation confirmation email sent to guest. | Positive | Yes |
| TC-NTF-244  | Host | Host alert | High | Active SMTP | New booking | 1. Guest books room | Host receives email notification of new reservation. | Positive | Yes |
| TC-NTF-245  | Guest | Pwd change email| Medium | Active SMTP | Password updated | 1. Update password | Guest receives security email notifying of password update. | Security | Yes |
| TC-NTF-246  | Guest | Failed email queue| Low | SMTP server offline | Booking complete | 1. Complete booking | Order succeeds; mailer retries or logs failure; no crash. | Edge | Yes |
| TC-NTF-247  | Host | Message notify | Medium | Messaging session | Message payload | 1. Send guest message | Host receives message indicator badge update in real-time. | Positive | Yes |
| TC-NTF-248  | Guest | Refund notify | High | Active SMTP | Refund completed | 1. Process refund | Guest receives email notification of refund details. | Positive | Yes |
| TC-NTF-249  | Host | Verification status| Medium | Active SMTP | Listing approved | 1. Approve property | Host receives email notifying listing is live. | Positive | Yes |
| TC-NTF-250  | Guest | Account lock notify| Medium | Active SMTP | Account locked | 1. Admin locks account| User receives notification explaining reason. | Positive | Yes |

---

## Module 20: Regression Testing Checklist (REGRESSION)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-REG-251  | Guest | Basic path | High | Fresh release build | Search and book | 1. Search -> Select -> Checkout -> Pay | Core flow completes from start to finish with no errors. | Positive | Yes |
| TC-REG-252  | Guest | Auth gate check| High | Fresh release build | Protected route URL | 1. Access `/host` / `/admin` | Authentication gates check roles correctly; redirects run. | Security | Yes |
| TC-REG-253  | Host | Listing wizard | High | Fresh release build | Onboarding steps | 1. Complete listing form | Host can navigate wizard and publish property. | Positive | Yes |
| TC-REG-254  | Admin | User lock check| High | Fresh release build | Lock button | 1. Lock a test profile | Locked profile cannot sign in; active sessions terminated. | Security | Yes |
| TC-REG-255  | Guest | Overlap check | High | Fresh release build | Overlapping dates | 1. Attempt book blocked | Database blocks duplicate bookings for same dates. | Security | Yes |
| TC-REG-256  | Guest | Payment webhook| High | Fresh release build | Paid callback | 1. Trigger Stripe webhook| Webhook updates order status to PAID. | Positive | Yes |
| TC-REG-257  | Guest | Review check | Medium | Fresh release build | Completed order | 1. Submit review | Review saved; score changes; comment lists update. | Positive | Yes |
| TC-REG-258  | Guest | Responsive check| Medium | Fresh release build | Viewport resizing | 1. Resize screen | Layout fits viewports; calendar pick blocks clickable. | Positive | No |
| TC-REG-259  | Guest | API security | High | Fresh release build | Direct endpoint GET | 1. Request foreign profile| API blocks with 403; parameters clean. | Security | Yes |
| TC-REG-260  | Guest | Date logic check| High | Fresh release build | Past date selection | 1. Select checkout < checkin| Forms block checkout; calendar fields display validation error.| Negative | Yes |

---

## Module 21: Business Logic Edge Cases (BIZ-EDGE)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-BIZ-261  | Guest | 365-day Booking | Medium | Logged in | 1-year booking | 1. Try checkout | Allowed or blocked based on host's maximum stay limits. | Edge | Yes |
| TC-BIZ-262  | Guest | Leap year booking| Medium | Logged in | Feb 28 - Mar 1 (Leap) | 1. Book room | Correctly counts stay as 2 nights; pricing calculates right.| Edge | Yes |
| TC-BIZ-263  | Guest | Month overlap | Medium | Logged in | Jan 31 - Feb 1 | 1. Book room | Correctly counts stay as 1 night. | Edge | Yes |
| TC-BIZ-264  | Guest | DST shift | Low | Logged in | Day of DST shift | 1. Book room | Stay counts as exactly 1 night (no hour mismatch issues). | Edge | Yes |
| TC-BIZ-265  | Host | Change active price| High | Paid bookings exist | Change base price | 1. Edit room price | Historical bookings retain checkout price; new rates apply.| Positive | Yes |
| TC-BIZ-266  | Host | Soft-delete active| High | Bookings in future | Delete property | 1. Delete property | Block hard-delete; property hidden; active bookings valid. | Edge | Yes |
| TC-BIZ-267  | Admin | Hide property bookings| High | Bookings in future | Hide property | 1. Hide property | Property hidden from search; active bookings stay intact. | Edge | Yes |
| TC-BIZ-268  | Guest | Refund currency | Low | Paid booking | Exchange rate shift | 1. Request refund | Refund processed in original transaction fee amount. | Edge | Yes |
| TC-BIZ-269  | Guest | Coupon expiration| Medium | Logged in | Expired coupon | 1. Apply coupon | Rejected with warning "Coupon has expired". | Negative | Yes |
| TC-BIZ-270  | Guest | Coupon double use| Medium | Logged in | Used coupon code | 1. Apply coupon code | Rejected with warning "Coupon already used". | Negative | Yes |
| TC-BIZ-271  | Guest | Coupon over-limit| Medium | Logged in | Coupon code | 1. Apply coupon | Coupon discount capped at max discount value. | Edge | Yes |
| TC-BIZ-272  | Guest | Refund over-limit| High | Paid booking | Refund payload | 1. Try refund > total | Blocked; refund sum cannot exceed initial paid invoice sum. | Security | Yes |
| TC-BIZ-273  | Guest | Checkout crash refresh| Medium | Processing payment | Page refresh | 1. Refresh page | Order state remains unchanged; no duplicate order created. | Edge | No |
| TC-BIZ-274  | Guest | Rapid click booking| High | Logged in | Click checkout | 1. Double click submit | Single order created; submit button disabled immediately. | Edge | No |
| TC-BIZ-275  | Guest | Overlap dates exact| High | Checkout date X | Book checkin date X | 1. Select checkout date X | Allowed; rooms are free for check-in on previous checkout day.| Positive | Yes |

---

## Module 22: Timezone & Date Border Cases (TIME-DATE)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-TZ-276   | Guest | UTC conversion | High | Active database | Check-in date | 1. Book room | Date saved correctly in database matching local UTC timezone.| Positive | Yes |
| TC-TZ-277   | Guest | Client TZ shift | Medium | Guest in GMT-5 | Location GMT+7 | 1. Search and book | Search dates align with hotel local time (VND time), not client. | Edge | Yes |
| TC-TZ-278   | Guest | Midnight booking| Medium | Check-in past midnight| Time 00:05 | 1. Try book for same night| Booking logic handles date rollover (allows checking in). | Edge | Yes |
| TC-TZ-279   | Guest | Date boundaries| Medium | End of year | Dec 31 - Jan 1 | 1. Book room | Calculated as 1 night; prices pull correct season values. | Edge | Yes |
| TC-TZ-280   | Guest | Leap day year | Low | Database calendar | Feb 29 | 1. View availability | Feb 29 available and selectable in calendar. | Edge | Yes |
| TC-TZ-281   | Host | Block custom date| High | Calendar view | Block specific date | 1. Block date | Date removed from guest availability calendar instantly. | Positive | Yes |
| TC-TZ-282   | Host | Unblock date | High | Blocked date | Unblock action | 1. Unblock date | Date restores availability; searchable by guests. | Positive | Yes |
| TC-TZ-283   | Guest | Checkout same day| Medium | Logged in | Checkin equal checkout | 1. Select same-day | Blocked; minimum stay is 1 night. | Negative | Yes |
| TC-TZ-284   | Guest | Past date API | High | Direct query | Past dates in payload | 1. Post to booking API | Rejected; dates cannot be in the past. | Security | Yes |
| TC-TZ-285   | Guest | Long stay limit| Low | Logged in | 60 days stay | 1. Try book | Succeeded or blocked depending on maximum stay policy. | Positive | Yes |

---

## Module 23: Data Validation Boundaries (DATA-BOUND)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-DAT-286  | Guest | Name length | Low | Register | 200-character name | 1. Register account | Succeeded or blocked gracefully (database schema safe). | Edge | Yes |
| TC-DAT-287  | Guest | Special chars | Low | Register | Name with special symbol| 1. Register account | Saved successfully; text escaped on display. | Edge | Yes |
| TC-DAT-288  | Host | Desc length | Medium | Create property | 10,000 chars desc | 1. Submit property | Description saved without crashing UI or database fields. | Edge | Yes |
| TC-DAT-289  | Host | Negative price | High | Room creation | Price: -500k | 1. Create room | Rejected; price must be positive. | Negative | Yes |
| TC-DAT-290  | Host | High price limit| Medium | Room creation | Price: 999,999,999k | 1. Create room | Blocked or validation warning triggered (within reasonable limit).| Edge | Yes |
| TC-DAT-291  | Host | Capacity limit | Medium | Room creation | Capacity: 100 guests | 1. Create room | Allowed or validation limit triggered. | Edge | Yes |
| TC-DAT-292  | Guest | Emoji review | Low | Post review | Emoji text | 1. Submit review | Review saved; emoji renders properly (utf8mb4 encoding ok). | Edge | No |
| TC-DAT-293  | Host | Image file size| Medium | Upload images | 20MB image file | 1. Upload file | Rejected; maximum image file size is 5MB. | Negative | Yes |
| TC-DAT-294  | Host | Image format | Medium | Upload images | Document.pdf | 1. Upload file | Rejected; only image file types allowed. | Negative | Yes |
| TC-DAT-295  | Host | Coordinates check| Medium | Address setup | Lat: 100, Lng: 200 | 1. Enter coordinates | Rejected; latitude [-90, 90] and longitude [-180, 180] checked. | Negative | Yes |

---

## Module 24: Integration Scenarios (INTEGRATION)

| Test Case ID | Role | Feature | Priority | Preconditions | Test Data | Steps | Expected Result | Type | Auto |
|--------------|------|---------|----------|---------------|-----------|-------|-----------------|------|------|
| TC-INT-296  | Guest | End to End Flow| High | Logged in | Search & checkout | 1. Search location<br>2. Select room<br>3. Pay | Order is CONFIRMED; guest, host, admin ledgers updated. | Positive | Yes |
| TC-INT-297  | Host | Create to Live | High | Logged in Host | Create property wizard | 1. Complete wizard<br>2. Admin approves | Property displays in guest search query. | Positive | Yes |
| TC-INT-298  | Guest | Book to Review | High | Active booking | Complete stay | 1. Checkout passes<br>2. Post review | Average rating updates; comment displays under details. | Positive | Yes |
| TC-INT-299  | Host | Cancel Refund | High | Paid booking | Host cancels booking | 1. Cancel booking | Status CANCELLED; guest receives confirmation; Stripe refund. | Positive | Yes |
| TC-INT-300  | Admin | Lock Host Flow | High | Active listings exist | Lock host account | 1. Lock host account | Listings hidden; active bookings remain; host login blocked. | Security | Yes |
