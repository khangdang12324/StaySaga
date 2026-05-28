# StaySaga QA Bug List

Danh sách chi tiết các lỗi phát hiện được trong quá trình QA dự án StaySaga.

---

## BUG-001: Next.js Middleware vs Proxy.ts naming confusion (Resolved - Next.js 16 feature)
- **Severity**: Low (No action required)
- **Role**: All Roles (Guest, User, Partner, Admin)
- **Route**: All Protected Routes
- **Verification**: 
  - Trong Next.js 16.2.6, trình biên dịch đưa ra cảnh báo: `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.`
  - Do đó, việc dự án sử dụng `src/proxy.ts` là **hoàn toàn chính xác** và là quy chuẩn mới nhất của Next.js 16.
  - Test HTTP cho thấy Guest truy cập `/admin`, `/host`, và `/bookings` đều bị redirect 307 về `/login` thành công (do Server Components RequireAuth hoặc proxy chặn).

---

## BUG-002: ESLint strict compiler errors in server actions
- **Severity**: High
- **Role**: Build / Pipeline System
- **Route**: N/A
- **Steps to reproduce**:
  1. Chạy lệnh kiểm tra cú pháp nguồn: `npm run lint`.
- **Expected**: Không có lỗi ESLint ở mức `error`.
- **Actual**: Báo lỗi `34 errors` và `288 warnings` làm gián đoạn pipeline build nghiêm ngặt.
- **Evidence**:
  - `src/core/bookings/actions.ts` dòng 620, 697, 846: `mockBookings` is never reassigned. Use 'const' instead.
  - `src/core/host/actions.ts` dòng 256: `imageError` is never reassigned. Use 'const' instead.
- **Likely cause**: Khai báo biến bằng `let` nhưng không gán lại giá trị mới trong suốt vòng đời của hàm.
- **Suggested fix**: Đổi khai báo `let` thành `const` cho các biến nêu trên.
- **Must fix before demo**: **No** (Do build đã bỏ qua lỗi lint vì cấu hình `ignoreBuildErrors: true` trong `next.config.ts`, nhưng cần thiết cho mã nguồn chuẩn hóa).

---

## BUG-003: `avg_rating` field select fallback overhead on host dashboard
- **Severity**: Medium
- **Role**: Host / Partner
- **Route**: `/host` (Host dashboard)
- **Steps to reproduce**:
  1. Đăng nhập với tài khoản Host / Partner.
  2. Truy cập trang `/host` để hiển thị danh sách chỗ nghỉ.
  3. Xem log console của Next.js server.
- **Expected**: Query select dữ liệu homestay thành công ở câu lệnh đầu tiên.
- **Actual**: Gây ra lỗi `column homestays.avg_rating does not exist` ở console do database cloud không có cột này vật lý. Server action phải liên tục chạy cơ chế catch-fallback (`fetchHostListings` loops) để thử câu lệnh select khác không chứa `avg_rating`.
- **Evidence**: Hàm `fetchHostListings` trong `src/core/host/actions.ts:352-370` phải duyệt qua 7 dạng chuỗi SELECT để tìm câu lệnh thành công.
- **Likely cause**: Cấu trúc database đã chuyển đổi sang bảng `reviews` riêng biệt và loại bỏ cột `avg_rating` vật lý trên `homestays`, nhưng mã nguồn server action lấy dữ liệu chưa được cập nhật tối ưu.
- **Suggested fix**: Bỏ cột `avg_rating` khỏi chuỗi SELECT mặc định của `extendedSelect` trong `fetchHostListings` hoặc dùng hàm tính toán dynamically.
- **Must fix before demo**: **No** (Vì cơ chế fallback tự động vẫn giúp trang hoạt động bình thường, chỉ bị chậm hiệu năng).

---

## BUG-004: Host bookings page actions are static placeholders
- **Severity**: Low
- **Role**: Host / Partner
- **Route**: `/host/bookings`
- **Steps to reproduce**:
  1. Đăng nhập tài khoản Host và vào `/host/bookings`.
  2. Nhấp vào các nút "Đổi giá & ngày đặt phòng" hoặc "Yêu cầu hủy đặt phòng".
- **Expected**: Hệ thống mở form cập nhật hoặc gửi yêu cầu lên server.
- **Actual**: Không có bất kỳ phản hồi nào, nút bấm hoàn toàn tĩnh.
- **Evidence**: Mã nguồn trong `src/app/(host)/host/bookings/page.tsx` từ dòng 390-400 hiển thị các nút này chỉ là thẻ HTML tĩnh không có event handler hay form action.
- **Likely cause**: Chức năng chưa được phát triển xong, chỉ xây dựng giao diện tĩnh làm placeholder.
- **Suggested fix**: Thêm logic client-side modal hoặc liên kết với Server Actions để hoàn thiện chức năng.
- **Must fix before demo**: **No**

---

## BUG-005: Custom enum `user_role` in DB Cloud missing Partner/Host value
- **Severity**: Critical (Demo Blocker)
- **Role**: Host / Partner
- **Route**: `/host/*`
- **Steps to reproduce**:
  1. Chạy lệnh cập nhật role cho một user bất kỳ sang `"PARTNER"` hoặc `"HOST"` bằng client service role.
- **Expected**: Update thành công để user có thể đăng nhập vào Extranet.
- **Actual**: Database ném lỗi `invalid input value for enum user_role: "PARTNER"` (hoặc `"HOST"`), ngăn chặn việc gán quyền host.
- **Evidence**: Kết quả chạy E2E test: `invalid input value for enum user_role: "PARTNER"`. Chỉ chấp nhận `"USER"` và `"ADMIN"`.
- **Likely cause**: DB Cloud được định cấu hình enum `user_role` thủ công nhưng thiếu giá trị hoặc chưa cập nhật theo migrations của dự án.
- **Suggested fix**: Sửa đổi enum `user_role` trong Postgres trên Cloud để add thêm các label `'PARTNER'`, hoặc chuyển cột `role` về kiểu `text` check constraint như codebase migrations.
- **Must fix before demo**: **Yes**

---

## BUG-006: `homestays.address` NOT NULL constraint mismatch in DB Cloud
- **Severity**: High (Demo Blocker)
- **Role**: Host / Partner
- **Route**: `/host/register` (Wizard onboarding)
- **Steps to reproduce**:
  1. Đăng nhập vào Extranet với quyền Host.
  2. Bắt đầu wizard đăng ký homestay mới và click Tiếp theo ở bước 1 (chưa điền địa chỉ).
- **Expected**: Hệ thống lưu draftState thành công vào database.
- **Actual**: Database ném lỗi `null value in column "address" of relation "homestays" violates not-null constraint`, làm wizard bị crash và kẹt không lưu được.
- **Evidence**: Trả về lỗi `23502 - null value in column "address"` khi chạy test E2E.
- **Likely cause**: DB Cloud áp dụng constraint `NOT NULL` cho `address` trong khi migrations dự án quy định cho phép NULL đối với các dòng draft.
- **Suggested fix**: Thay đổi cột `address` trên bảng `homestays` của DB Cloud thành `NULLABLE` (cho phép NULL).
- **Must fix before demo**: **Yes**

---

## BUG-007: `homestays.max_guests`, `bedrooms`, `beds`, `bathrooms` NOT NULL constraint mismatch in DB Cloud
- **Severity**: High (Demo Blocker)
- **Role**: Host / Partner
- **Route**: `/host/register`
- **Steps to reproduce**:
  1. Bắt đầu wizard đăng ký và lưu draft khi chưa điền thông tin phòng.
- **Expected**: Hệ thống lưu draft thành công.
- **Actual**: Database ném lỗi `null value in column "max_guests" violates not-null constraint` (tương tự cho bedrooms, beds, bathrooms), gây crash onboarding.
- **Evidence**: Trả về lỗi `23502` cho `max_guests` khi chạy test E2E.
- **Likely cause**: DB Cloud không kích hoạt các giá trị default (như default 2 đối với max_guests) hoặc bắt buộc check null trước.
- **Suggested fix**: Đảm bảo các cột này cho phép NULL hoặc kích hoạt đúng giá trị default trên DB Cloud.
- **Must fix before demo**: **Yes**
