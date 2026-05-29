-- ============================================================
-- 00_create_demo_auth_users_note.sql
-- HƯỚNG DẪN TẠO TÀI KHOẢN DEMO TRONG SUPABASE AUTH
-- Dự án: Quản lý Homestay - StaySaga
-- MSSV: 2212387 - Đặng Nguyên Phúc Khang
-- ============================================================

/*
  LƯU Ý QUAN TRỌNG:
  -----------------
  Trong Supabase, bảng `public.profiles` có khóa ngoại tham chiếu đến bảng `auth.users` của hệ thống Auth.
  Do đó, bạn không thể chèn trực tiếp các thông tin profile mẫu nếu các tài khoản Auth chưa tồn tại.
  
  Để chạy dữ liệu mẫu (02_sample_data.sql) thành công, vui lòng chọn 1 trong 2 cách sau:
  
  CÁCH 1: TẠO TÀI KHOẢN QUA SUPABASE AUTH UI (Khuyên dùng cho ứng dụng chạy thực tế)
  ---------------------------------------------------------------------------------
  1. Vào trang Dashboard của dự án Supabase của bạn.
  2. Chọn phần "Authentication" -> "Users" từ menu trái.
  3. Chọn "Add User" -> "Create User" và tạo 3 tài khoản demo với email dưới đây (mật khẩu tùy chọn, ví dụ: 123456):
     - admin@staysaga.com
     - partner@staysaga.com
     - user@staysaga.com
     
     * Sau khi tạo, trigger `handle_new_user` trong Database sẽ tự động chèn 3 dòng tương ứng vào bảng `public.profiles`.
     
  4. Chạy file `02_sample_data.sql` trong SQL Editor:
     - File `02_sample_data.sql` đã được thiết kế thông minh để tự động tìm kiếm UUID của các email trên trong cơ sở dữ liệu và liên kết toàn bộ dữ liệu mẫu (Homestays, Bookings, Reviews, Messages) vào đúng các tài khoản này mà bạn không cần chỉnh sửa hay copy-paste thủ công.
     
  CÁCH 2: CHẠY DỮ LIỆU MẪU NHANH BỎ QUA AUTH (Khuyên dùng khi cần test nhanh Database)
  ---------------------------------------------------------------------------------
  Nếu bạn chỉ muốn seed dữ liệu vào database nhanh để kiểm tra cấu trúc bảng hoặc xem dữ liệu mà không cần tạo tài khoản Auth:
  - Hãy sử dụng file `02_sample_data_without_auth.sql` thay vì `02_sample_data.sql`.
  - File này sẽ tạm thời ngắt liên kết khóa ngoại với bảng `auth.users` để bạn chèn trực tiếp dữ liệu mẫu với UUID giả định nhanh chóng.
*/
