-- ============================================================
-- 02_sample_data_without_auth.sql
-- PHIÊN BẢN SEED DỮ LIỆU KHÔNG PHỤ THUỘC SUPABASE AUTH
-- Dự án: Quản lý Homestay - StaySaga
-- MSSV: 2212387 - Đặng Nguyên Phúc Khang
-- ============================================================

-- Để chèn dữ liệu mẫu mà không cần tạo trước tài khoản trong hệ thống Auth,
-- chúng ta tạm thời xóa ràng buộc khóa ngoại tham chiếu từ public.profiles đến auth.users.
-- LƯU Ý: Cách này chỉ khuyên dùng khi test nhanh cơ sở dữ liệu trên môi trường phát triển local.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- ============================================================
-- 1. PROFILES (Người dùng mẫu - UUID Giả Định)
-- ============================================================
INSERT INTO public.profiles (id, full_name, email, phone, role, status, locale, avatar_url)
VALUES
  -- Admin
  ('a0000000-0000-0000-0000-000000000001', 'Nguyễn Văn Admin', 'admin@staysaga.com', '0901000001', 'ADMIN', 'ACTIVE', 'vi', NULL),
  -- Đối tác (Partner/Host)
  ('b0000000-0000-0000-0000-000000000001', 'Trần Thị Hoa (Partner)', 'partner@staysaga.com', '0912000001', 'PARTNER', 'ACTIVE', 'vi', NULL),
  -- Khách (User)
  ('c0000000-0000-0000-0000-000000000001', 'Phạm Quốc Bảo (User)', 'user@staysaga.com', '0933000001', 'USER', 'ACTIVE', 'vi', NULL)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  status = EXCLUDED.status;


-- ============================================================
-- 2. AMENITIES (Tiện ích)
-- ============================================================
INSERT INTO public.amenities (key, name) VALUES
  ('wifi', 'Wi-Fi miễn phí'),
  ('parking', 'Bãi đỗ xe miễn phí'),
  ('kitchen', 'Bếp riêng'),
  ('pool', 'Hồ bơi'),
  ('bbq', 'Khu BBQ'),
  ('garden', 'Sân vườn'),
  ('ac', 'Điều hòa'),
  ('breakfast', 'Bữa sáng miễn phí'),
  ('hot_water', 'Nước nóng 24/7'),
  ('balcony', 'Ban công')
ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name;


-- ============================================================
-- 3. HOMESTAYS (Chỗ nghỉ)
-- ============================================================
INSERT INTO public.homestays (
  id, owner_id, slug, name, title, description,
  property_type, address, city, district, country,
  price_per_night, base_price_per_night,
  max_guests, bedrooms, beds, bathrooms,
  avg_rating, is_active, status,
  contact_phone, contact_email, owner_name,
  policies, registration_checklist, booking_mode
) VALUES
  (
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'villa-hoa-sen-dalat',
    'Villa Hoa Sen Đà Lạt',
    'Villa Hoa Sen Đà Lạt',
    'Villa rộng rãi với view đồi thông tuyệt đẹp, nằm ngay trung tâm Đà Lạt. Phù hợp cho gia đình và nhóm bạn nghỉ dưỡng cuối tuần.',
    'villa',
    '15 Đường Trần Hưng Đạo',
    'Đà Lạt',
    'Phường 3',
    'Vietnam',
    850000.00, 850000.00,
    6, 3, 4, 2,
    4.70, true, 'APPROVED',
    '0912000001', 'partner@staysaga.com', 'Trần Thị Hoa',
    '{"checkInFrom": "14:00", "checkInTo": "22:00", "checkOutFrom": "06:00", "checkOutTo": "12:00", "freeCancellation": true}'::jsonb,
    '{"basic": true, "location": true, "images": true, "rooms": true, "pricing": true, "amenities": true, "policies": true}'::jsonb,
    'INSTANT'
  ),
  (
    'd0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'homestay-huong-bien-vungtau',
    'Homestay Hướng Biển Vũng Tàu',
    'Homestay Hướng Biển Vũng Tàu',
    'Homestay view biển cực đẹp, cách bãi Sau chỉ 200m. Phòng sạch sẽ, tiện nghi đầy đủ cho kỳ nghỉ thoải mái.',
    'homestay',
    '88 Đường Thuỳ Vân',
    'Vũng Tàu',
    'Phường Thắng Tam',
    'Vietnam',
    450000.00, 450000.00,
    4, 2, 2, 1,
    4.50, true, 'APPROVED',
    '0912000001', 'partner@staysaga.com', 'Trần Thị Hoa',
    '{"checkInFrom": "14:00", "checkInTo": "20:00", "checkOutFrom": "07:00", "checkOutTo": "11:00", "freeCancellation": false}'::jsonb,
    '{"basic": true, "location": true, "images": true, "rooms": true, "pricing": true, "amenities": true, "policies": true}'::jsonb,
    'REQUEST'
  ),
  (
    'd0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'penthouse-saigon-center',
    'Penthouse Sài Gòn Center',
    'Penthouse Sài Gòn Center',
    'Căn hộ penthouse cao cấp tại trung tâm Quận 1, TP.HCM. View toàn cảnh thành phố, nội thất sang trọng, hồ bơi sân thượng.',
    'apartment',
    '12 Đường Nguyễn Huệ',
    'Hồ Chí Minh',
    'Quận 1',
    'Vietnam',
    1500000.00, 1500000.00,
    4, 2, 2, 2,
    4.90, true, 'APPROVED',
    '0912000001', 'partner@staysaga.com', 'Trần Thị Hoa',
    '{"checkInFrom": "15:00", "checkInTo": "23:00", "checkOutFrom": "06:00", "checkOutTo": "12:00", "freeCancellation": true}'::jsonb,
    '{"basic": true, "location": true, "images": true, "rooms": true, "pricing": true, "amenities": true, "policies": true}'::jsonb,
    'INSTANT'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  is_active = EXCLUDED.is_active;


-- ============================================================
-- 4. ROOMS (Phòng / Loại phòng)
-- ============================================================
INSERT INTO public.rooms (id, homestay_id, name, max_guests, bed_type, bed_count, bathroom_count, private_bathroom, price_per_night, quantity, status)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Phòng Đôi Deluxe', 2, 'double', 1, 1, true, 850000.00, 2, 'ACTIVE'),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'Phòng View Biển', 2, 'double', 1, 1, true, 450000.00, 3, 'ACTIVE'),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'Suite Penthouse', 2, 'king', 1, 2, true, 1500000.00, 1, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 5. HOMESTAY_IMAGES (Ảnh chỗ nghỉ)
-- ============================================================
INSERT INTO public.homestay_images (id, homestay_id, url, alt, sort_order)
VALUES
  ('f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'Villa Đà Lạt - Mặt tiền', 0),
  ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'Villa Đà Lạt - Phòng khách', 1),
  ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 'Homestay Vũng Tàu - View biển', 0),
  ('f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'Homestay Vũng Tàu - Phòng ngủ', 1),
  ('f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'Penthouse Sài Gòn - Toàn cảnh', 0)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 6. HOMESTAY_AMENITIES (Gắn tiện ích cho chỗ nghỉ)
-- ============================================================
INSERT INTO public.homestay_amenities (homestay_id, amenity_id)
SELECT h.id, a.id
FROM (VALUES
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'wifi'),
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'parking'),
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'kitchen'),
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'garden'),
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'ac'),
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'breakfast'),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'wifi'),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'ac'),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'hot_water'),
  ('d0000000-0000-0000-0000-000000000003'::uuid, 'wifi'),
  ('d0000000-0000-0000-0000-000000000003'::uuid, 'pool'),
  ('d0000000-0000-0000-0000-000000000003'::uuid, 'ac'),
  ('d0000000-0000-0000-0000-000000000003'::uuid, 'balcony')
) AS v(homestay_id, amenity_key)
JOIN public.homestays h ON h.id = v.homestay_id
JOIN public.amenities a ON a.key = v.amenity_key
ON CONFLICT (homestay_id, amenity_id) DO NOTHING;


-- ============================================================
-- 7. BOOKINGS (Đơn đặt phòng)
-- ============================================================
INSERT INTO public.bookings (
  id, user_id, homestay_id, room_id,
  check_in_date, check_out_date, guests,
  total_price, status, payment_status,
  nights, price_per_night,
  guest_name, guest_email, guest_phone,
  booking_code
) VALUES
  -- Booking 1: Bảo đặt Villa Đà Lạt - Đã hoàn thành
  (
    '10000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    '2026-04-10', '2026-04-13', 2,
    2550000.00, 'COMPLETED', 'PAID',
    3, 850000.00,
    'Phạm Quốc Bảo', 'user@staysaga.com', '0933000001',
    'BK-20260410-1000'
  ),
  -- Booking 2: Bảo đặt Penthouse Sài Gòn - Đã xác nhận
  (
    '10000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000003',
    '2026-06-15', '2026-06-18', 2,
    4500000.00, 'CONFIRMED', 'PAID',
    3, 1500000.00,
    'Phạm Quốc Bảo', 'user@staysaga.com', '0933000001',
    'BK-20260615-1001'
  ),
  -- Booking 3: Bảo đặt Homestay Vũng Tàu - Đang chờ
  (
    '10000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'e0000000-0000-0000-0000-000000000002',
    '2026-07-01', '2026-07-04', 3,
    1350000.00, 'PENDING', 'UNPAID',
    3, 450000.00,
    'Phạm Quốc Bảo', 'user@staysaga.com', '0933000001',
    'BK-20260701-1002'
  )
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8. REVIEWS (Đánh giá)
-- ============================================================
INSERT INTO public.reviews (id, user_id, homestay_id, booking_id, rating, comment, status)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    5,
    'Villa rất đẹp, view đồi thông tuyệt vời! Chủ nhà thân thiện, phòng sạch sẽ và tiện nghi đầy đủ.',
    'VISIBLE'
  )
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 9. SITE_SETTINGS (Cài đặt trang web)
-- ============================================================
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'StaySaga'),
  ('hero_title', 'Khám phá những điểm lưu trú tuyệt vời nhất Việt Nam'),
  ('hero_subtitle', 'Đặt homestay, villa và căn hộ nghỉ dưỡng theo phong cách hiện đại với StaySaga.'),
  ('featured_destinations', 'Đà Lạt,Hồ Chí Minh,Hội An,Phú Quốc,Vũng Tàu'),
  ('accent_color', 'rose'),
  ('hero_image', '/images/hero-bg.jpg')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- ============================================================
-- 10. BOOKING_MESSAGES (Tin nhắn mẫu)
-- ============================================================
INSERT INTO public.booking_messages (id, booking_id, sender_id, sender_role, message, is_read)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'USER',
    'Chào chủ nhà, tôi muốn hỏi về giờ check-in sớm (12:00) có được không ạ?',
    true
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'PARTNER',
    'Chào bạn, bạn có thể check-in sớm từ 12:00, không phát sinh phụ phí nhé! Chúc bạn chuyến đi vui vẻ.',
    true
  )
ON CONFLICT (id) DO NOTHING;
