============================================================
DỰ ÁN: StaySaga - Quản lý Homestay
Sinh viên: Đặng Nguyên Phúc Khang - MSSV: 2212387
Môn: Quản lý Homestay
============================================================

HƯỚNG DẪN CHẠY SQL SCRIPTS
============================================================
Bộ mã nguồn này hỗ trợ 2 cách tiếp cận để thiết lập cơ sở dữ liệu Supabase:

------------------------------------------------------------
CÁCH 1: THIẾT LẬP ĐẦY ĐỦ CÓ AUTH (Khuyên dùng cho chạy thực tế)
------------------------------------------------------------
Chạy theo thứ tự sau:

Bước 1: Chạy Schema (Cấu trúc bảng)
   - Mở Supabase Dashboard -> SQL Editor.
   - Sao chép toàn bộ nội dung file: 01_schema.sql và nhấn Run.
   - File này sẽ khởi tạo toàn bộ cấu trúc bảng, RLS policies, triggers,
     functions, indexes, storage buckets và publication realtime.

Bước 2: Tạo các tài khoản Auth mẫu
   - Đọc hướng dẫn chi tiết trong file: 00_create_demo_auth_users_note.sql
   - Tạo 3 tài khoản Auth trên giao diện Supabase Auth UI (Authentication -> Users):
     1. admin@staysaga.com   (Tài khoản quản trị viên)
     2. partner@staysaga.com (Tài khoản đối tác / chủ nhà)
     3. user@staysaga.com    (Tài khoản khách du lịch)

Bước 3: Chạy dữ liệu mẫu tự động ánh xạ
   - Sao chép toàn bộ nội dung file: 02_sample_data.sql và nhấn Run.
   - Script này sẽ tự động tìm kiếm các tài khoản đã tạo ở Bước 2
     và gắn toàn bộ dữ liệu mẫu (Homestays, Rooms, Bookings, Reviews, Messages...)
     vào đúng các tài khoản đó mà không cần copy UUID thủ công.

------------------------------------------------------------
CÁCH 2: THIẾT LẬP NHANH KHÔNG AUTH (Dành cho việc test database nhanh)
------------------------------------------------------------
Nếu bạn muốn chạy thử nghiệm nhanh database local mà không muốn tạo tài khoản Auth:

Bước 1: Chạy Schema (Cấu trúc bảng)
   - Chạy file: 01_schema.sql trong SQL Editor.

Bước 2: Chạy dữ liệu mẫu không phụ thuộc Auth
   - Chạy file: 02_sample_data_without_auth.sql trong SQL Editor.
   - Script này sẽ tạm ngắt liên kết khóa ngoại với bảng `auth.users`
     để chèn trực tiếp các profiles mẫu với UUID giả định nhanh chóng.

============================================================
DANH SÁCH FILE NỘP:
============================================================
- 01_schema.sql : Khởi tạo cấu trúc bảng, trigger, RLS, index (Đã sửa role và booking status)
- 00_create_demo_auth_users_note.sql : Hướng dẫn tạo tài khoản demo trong Auth
- 02_sample_data.sql : Seed dữ liệu tự động liên kết với Supabase Auth (Đã sửa)
- 02_sample_data_without_auth.sql : Seed dữ liệu nhanh không cần Supabase Auth (Mới)
- README.txt : Hướng dẫn chạy này
============================================================
