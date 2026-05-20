# extract_booking.js — Hướng dẫn sử dụng

Mục đích: trích xuất thông tin danh sách từ trang kết quả Booking.com đã lưu (HTML) và xuất ra JSON/CSV; tuỳ chọn import vào Supabase.

Yêu cầu trước khi chạy

- Node.js (v16+)
- Cài phụ thuộc:

```bash
npm install cheerio
# nếu muốn import vào Supabase
npm install @supabase/supabase-js
```

Chạy cơ bản (với file HTML đã lưu):

```bash
node staysaga/scripts/extract_booking.js /path/to/booking-list-page.html ./out
```

Kết quả

- `./out/booking_listings.json` — mảng các listing với trường: `id`, `title`, `room_name`, `price`, `original_price`, `discounted_price`, `price_currency`, `image_src`, `image_local_path`, `image_public_path`, `rating`, `reviews_count`, `remaining_rooms`, `prepayment_policy`, `free_cancellation`, `no_prepayment`, `bed_info`, `availability_text`, `link`, `source_page_title`, `source_page_description`.
- `./out/booking_listings.csv` — cùng dữ liệu ở dạng CSV.

Import trực tiếp vào Supabase

- Đặt biến môi trường `SUPABASE_URL` và `SUPABASE_KEY` (project API URL và service key):

Windows (PowerShell):

```powershell
$env:SUPABASE_URL = "https://xyz.supabase.co"
$env:SUPABASE_KEY = "your-service-key"
node staysaga/scripts/extract_booking.js /path/to/booking.html ./out --import
```

Linux / macOS:

```bash
export SUPABASE_URL="https://xyz.supabase.co"
export SUPABASE_KEY="your-service-key"
node staysaga/scripts/extract_booking.js /path/to/booking.html ./out --import
```

Ghi chú import

- Script chèn vào bảng `listings_imports`. Tạo bảng này trong Supabase trước khi import với các cột phù hợp (ví dụ: `title text`, `room_name text`, `price integer`, ...).
- Import xảy ra theo lô (batches) 100 bản ghi.

Lưu ý pháp lý & kỹ thuật

- Hãy đảm bảo bạn có quyền thu thập và sử dụng dữ liệu từ Booking.com. Việc crawling/live-scraping có thể vi phạm điều khoản dịch vụ.
- Script hiện hoạt trên HTML đã lưu (không render JS). Nếu trang cần JS để hiển thị dữ liệu, cân nhắc sử dụng `puppeteer`/`playwright` để render trước.

Tiếp theo gợi ý

- Muốn tôi: (A) sao chép JSON vào `src/data/`, (B) thêm kiểm tra và retry/rate-limit, (C) tạo trang admin Next.js để review trước khi import? Trả lời A/B/C hoặc nhiều lựa chọn.
