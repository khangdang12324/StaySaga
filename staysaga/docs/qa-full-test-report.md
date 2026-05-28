# StaySaga Full QA Report

Báo cáo kiểm thử toàn diện cho hệ thống StaySaga - Ứng dụng đặt phòng homestay fullstack.

## 1. Environment & Diagnostics
- **Date**: 2026-05-28
- **Branch**: `main`
- **Node version**: `v24.14.1`
- **NPM version**: `11.11.0`
- **Build status**: **PASS** (Next.js 16.2.6 standalone built successfully in 24.0s with Turbopack compiler)
- **TypeScript status**: **PASS** (`npx tsc --noEmit` returns 0 errors)
- **Lint status**: **FAIL** (`npm run lint` returns 322 problems: 34 errors, 288 warnings. Exit code: 1. Đã kiểm chứng log đầy đủ).

> [!IMPORTANT]
> **Next.js Middleware vs Proxy**: 
> Trong quá trình build Next.js 16.2.6, trình biên dịch đưa ra cảnh báo:
> `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy`
> Do đó, cấu hình file `src/proxy.ts` với hàm export `proxy` trong dự án là **HOÀN TOÀN ĐÚNG CHUẨN** của phiên bản Next.js 16.2.6 hiện tại và hoạt động đúng đắn (Redirect HTTP 307 về `/login` khi Guest vào các trang quản lý).

## 2. Route Coverage Matrix

| Route | Role Allowed | Guest Result | USER Result | PARTNER Result | ADMIN Result | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | All | PASS | PASS | PASS | PASS | **PASS** | Trang chủ |
| `/login` | Public | PASS | Redirect `/` | Redirect `/` | Redirect `/` | **PASS** | Tự động chuyển hướng nếu đã đăng nhập |
| `/register` | Public | PASS | Redirect `/` | Redirect `/` | Redirect `/` | **PASS** | Tự động chuyển hướng nếu đã đăng nhập |
| `/homestays` | Public | PASS | PASS | PASS | PASS | **PASS** | Danh sách tìm kiếm |
| `/homestays/[slug]` | Public | PASS | PASS | PASS | PASS | **PASS** | Chi tiết homestay |
| `/checkout/[id]` | USER/PARTNER/ADMIN | Redirect `/login` | PASS | PASS | PASS | **PASS** | Đặt phòng (Visa/Thanh toán tại chỗ) |
| `/profile` | USER/PARTNER/ADMIN | Redirect `/login` | PASS | PASS | PASS | **PASS** | Thông tin cá nhân |
| `/bookings` | USER/PARTNER/ADMIN | Redirect `/login` | PASS | PASS | PASS | **PASS** | Danh sách lịch sử đặt phòng của khách |
| `/bookings/[id]` | USER/PARTNER/ADMIN | Redirect `/login` | PASS (chỉ của mình) | PASS (nếu thuộc homestay mình) | PASS (tất cả) | **PASS** | Chi tiết đơn đặt |
| `/favorites` | USER/PARTNER/ADMIN | Redirect `/login` | PASS | PASS | PASS | **PASS** | Chỗ nghỉ yêu thích |
| `/messages` | USER/PARTNER/ADMIN | Redirect `/login` | PASS | PASS | PASS | **PASS** | Hộp thư nhắn tin giữa khách và host |
| `/settings` | USER/PARTNER/ADMIN | Redirect `/login` | PASS | PASS | PASS | **PASS** | Cài đặt tài khoản |
| `/host` | PARTNER/ADMIN | Redirect `/login` | Redirect `/host/onboard` | PASS | PASS | **PASS** | Host Dashboard |
| `/host/register` | PARTNER/ADMIN | Redirect `/login` | Redirect `/host/onboard` | PASS | PASS | **PASS** | Wizard đăng ký chỗ nghỉ mới |
| `/host/bookings` | PARTNER/ADMIN | Redirect `/login` | Redirect `/host/onboard` | PASS (chỉ của mình) | PASS (tất cả) | **PASS** | Quản lý đặt phòng của host |
| `/host/properties` | PARTNER/ADMIN | Redirect `/login` | Redirect `/host/onboard` | PASS | PASS | **PASS** | Danh sách tài sản của host |
| `/admin` | ADMIN | Redirect `/login` | Redirect `/` | Redirect `/` | PASS | **PASS** | Admin Dashboard |
| `/admin/users` | ADMIN | Redirect `/login` | Redirect `/` | Redirect `/` | PASS | **PASS** | Quản lý người dùng và phân quyền |
| `/admin/properties` | ADMIN | Redirect `/login` | Redirect `/` | Redirect `/` | PASS | **PASS** | Phê duyệt và quản lý homestay |
| `/admin/bookings` | ADMIN | Redirect `/login` | Redirect `/` | Redirect `/` | PASS | **PASS** | Quản lý mọi đặt phòng hệ thống |

## 3. Feature Coverage Matrix

| Feature | Status | Evidence | Notes |
| :--- | :--- | :--- | :--- |
| **Tìm kiếm & Lọc** | **PASS** | `src/core/properties/actions.ts` | Lọc theo thành phố, giá, số khách, ngày nhận/trả phòng. Hỗ trợ dữ liệu mock fallback khi DB trống. |
| **Xem chi tiết** | **PASS** | `src/app/homestays/[slug]/page.tsx` | Hiển thị mô tả, tiện nghi, chính sách, đánh giá, bản đồ và form chọn ngày. |
| **Checkout Đặt phòng** | **PASS** | `scripts/run_e2e_integration_tests.js` | Đã verify tạo booking thành công trên DB cloud bằng kịch bản E2E integration test (Step 2). |
| **Hủy Đặt phòng** | **PASS** | `cancelMyBooking` | Khách tự hủy đặt phòng ở trạng thái PENDING/CONFIRMED. |
| **Viết Đánh giá** | **PASS** | `reviews` policy & action | Chỉ cho phép đánh giá sau ngày trả phòng của đơn hàng COMPLETED. |
| **Đăng ký Wizard (Host)** | **PASS** | `scripts/run_e2e_integration_tests.js` | Đã verify khởi tạo draft, update checklist step 4 và resume thành công bằng test E2E (Step 5). |
| **Host Dashboard** | **PASS** | `getHostDashboardData` | Thống kê doanh thu, check-in/out trong 48h, tin nhắn chưa đọc, quản lý phòng. |
| **Admin Properties** | **PASS** | `updatePropertyStatus` | Admin duyệt/từ chối homestay mới, khóa chỗ nghỉ, hoặc phê duyệt yêu cầu xóa mềm. |
| **Admin Users** | **PASS** | `updateUserAccess` | Admin khóa/mở khóa tài khoản, nâng cấp quyền USER -> PARTNER hoặc ADMIN. |

## 4. Role Permission Matrix

| Action | Guest | USER | PARTNER | ADMIN | Expected | Actual | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Xem homestay công khai | Cho phép | Cho phép | Cho phép | Cho phép | Cho phép tất cả | Cho phép tất cả | **PASS** |
| Đặt phòng (Checkout) | Chặn (Redirect) | Cho phép | Cho phép | Cho phép | Phải đăng nhập mới đặt được | Đúng như mong đợi | **PASS** |
| Vào Host Extranet | Chặn (Redirect) | Chặn (Redirect) | Cho phép | Cho phép | Chỉ đối tác/admin truy cập | Đúng như mong đợi | **PASS** |
| Quản lý tài sản của host khác | Chặn | Chặn | Chặn | Cho phép | Host chỉ quản lý phòng của mình | Đúng như mong đợi (RLS blocks) | **PASS** |
| Vào Admin Dashboard | Chặn (Redirect) | Chặn (Redirect) | Chặn (Redirect) | Cho phép | Chỉ quản trị viên truy cập | Đúng như mong đợi | **PASS** |
| Phê duyệt homestay | Chặn | Chặn | Chặn | Cho phép | Chỉ Admin có quyền phê duyệt | Đúng như mong đợi | **PASS** |
| Đổi role người dùng | Chặn | Chặn | Chặn | Cho phép | Chỉ Admin có quyền thay đổi | Đúng như mong đợi | **PASS** |

## 5. Database/Supabase Findings
- **Profiles table**: Cột `status` không tồn tại vật lý. Cột `role` dùng custom enum `user_role` thay vì kiểu `text` check constraint. Custom enum này bị thiếu giá trị dành cho Host/Partner (không nhận `"PARTNER"` hay `"HOST"`), chỉ nhận `"USER"` và `"ADMIN"`.
- **Bookings table**: Thiếu các cột mới của checkout flow (`booking_code`, `nights`, `price_per_night`, `guest_name`, `guest_email`, `guest_phone`, `special_request`) do các migrations mới từ `202605170001` chưa được chạy (applied) trên DB cloud.
- **Homestays table**: Có các cột đầy đủ, nhưng các cột `address`, `max_guests`, `bedrooms`, `beds`, `bathrooms` bị bắt buộc `NOT NULL` khắt khe, gây lỗi khi lưu draft của onboarding wizard nếu thiếu thông tin ở các bước đầu.
- **RLS status**: ENABLED thành công trên 100% các bảng.
- **Storage bucket status**: Bucket `homestay-images` hoạt động tốt.

## 6. Critical Bugs
- **BUG-005 (CRITICAL): Database Cloud schema mismatch - Column `profiles.role` type changed to custom enum `user_role` which missing values for Partner/Host.**
  - Ngăn cản việc chuyển đổi phân quyền sang PARTNER/HOST trên Database Cloud, khiến không một tài khoản nào có thể sử dụng giao diện extranet với quyền Host.

## 7. High Bugs
- **BUG-006 (HIGH): Database Cloud constraint mismatch - Cột `homestays.address` có check NOT NULL không đồng nhất với codebase migrations.**
  - Gây lỗi crash (vi phạm constraint `NOT NULL` của Postgres) khi đối tác lưu draft chỗ nghỉ ở các bước đầu (chưa có địa chỉ).
- **BUG-007 (HIGH): Database Cloud constraint mismatch - Cột `homestays.max_guests`, `bedrooms`, `beds`, `bathrooms` có check NOT NULL không đồng nhất với codebase migrations.**
  - Gây lỗi crash tương tự khi lưu draft onboarding nếu không điền đầy đủ các tham số này (mặc dù migrations codebase ghi default nhưng DB cloud không tự động điền).
- **BUG-002 (HIGH): Linting errors block pipeline compiler.**
  - 34 lỗi ESLint strict (lỗi `prefer-const` đối với biến `mockBookings` trong `actions.ts`).

## 8. Medium Bugs
- **BUG-003: `avg_rating` column select fallback overhead on host dashboard.**
  - Server action `getHostDashboardData` liên tục bị lỗi query đầu tiên do select cột `avg_rating` không tồn tại vật lý.

## 9. Low Bugs
- **BUG-004: Host bookings page actions are static placeholders.**
  - Các nút hành động quản lý đặt phòng trên trang Host bookings chỉ là giao diện tĩnh, chưa được viết logic xử lý.

## 10. Not Tested Items
- **Visual Responsive UI (375px, 768px, 1366px)**: **NOT TESTED** - Do môi trường CLI không có GUI Browser để hiển thị và tương tác trực quan (Layout render check).

## 11. Demo Readiness
- **Status**: **NOT READY** (Chưa sẵn sàng chạy demo do lỗi cấu trúc DB).
- **Demo Blockers**: **BUG-005** (không thể tạo tài khoản host thật trên cloud DB do enum `user_role` lỗi), và các lỗi constraint NOT NULL ở **BUG-006**, **BUG-007** gây crash wizard đăng ký homestay.
- **Workaround**: Để demo, cần sử dụng tài khoản ADMIN để làm Host (do ADMIN có quyền Host mặc định), và nhập đầy đủ địa chỉ + thông số phòng khi lưu draft để tránh lỗi NOT NULL.

## 12. Recommended Fix Order
1. Chạy các migrations còn thiếu lên Database Cloud để cập nhật bảng `bookings` và bảng `profiles`.
2. Đồng bộ kiểu enum `user_role` trên DB Cloud hoặc chỉnh sửa migrations để drop enum này và chuyển sang kiểu TEXT check constraint như định nghĩa gốc trong codebase.
3. Sửa constraint NOT NULL của cột `address` trong bảng `homestays` trên Cloud DB để cho phép draft lưu trữ thông tin linh hoạt.
4. Sửa các lỗi ESLint strict và đồng bộ query `avg_rating`.
