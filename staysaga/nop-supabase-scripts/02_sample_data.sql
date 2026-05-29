-- ============================================================
-- 02_sample_data.sql
-- CẢNH BÁO: File sample_data cần chạy sau khi đã tạo các user trong Supabase Auth, hoặc cần thay UUID mẫu bằng auth.users.id thật.
-- Xem hướng dẫn chi tiết tại file 00_create_demo_auth_users_note.sql
-- ============================================================
-- Dự án: Quản lý Homestay - StaySaga
-- MSSV: 2212387 - Đặng Nguyên Phúc Khang
-- ============================================================

DO $$
DECLARE
  v_admin_id uuid;
  v_partner_id uuid;
  v_user_id uuid;
  
  -- UUIDs cho Homestays
  v_homestay_dalat uuid := 'd0000000-0000-0000-0000-000000000001';
  v_homestay_vungtau uuid := 'd0000000-0000-0000-0000-000000000002';
  v_homestay_saigon uuid := 'd0000000-0000-0000-0000-000000000003';
  v_homestay_hoian uuid := 'd0000000-0000-0000-0000-000000000004';
  
  -- UUIDs cho Rooms
  v_room_dalat uuid := 'e0000000-0000-0000-0000-000000000001';
  v_room_vungtau uuid := 'e0000000-0000-0000-0000-000000000002';
  v_room_saigon uuid := 'e0000000-0000-0000-0000-000000000003';
  v_room_hoian uuid := 'e0000000-0000-0000-0000-000000000004';
  
  -- UUIDs cho Bookings
  v_booking_1 uuid := '10000000-0000-0000-0000-000000000001';
  v_booking_2 uuid := '10000000-0000-0000-0000-000000000002';
  v_booking_3 uuid := '10000000-0000-0000-0000-000000000003';
  
  -- Amenity IDs
  v_wifi_id uuid;
  v_parking_id uuid;
  v_kitchen_id uuid;
  v_pool_id uuid;
  v_bbq_id uuid;
  v_garden_id uuid;
  v_ac_id uuid;
  v_breakfast_id uuid;
  v_hot_water_id uuid;
  v_balcony_id uuid;
BEGIN
  -- 1. LẤY UUID CỦA CÁC USER ĐÃ TẠO TRONG AUTH
  SELECT id INTO v_admin_id FROM public.profiles WHERE email = 'admin@staysaga.com';
  SELECT id INTO v_partner_id FROM public.profiles WHERE email = 'partner@staysaga.com';
  SELECT id INTO v_user_id FROM public.profiles WHERE email = 'user@staysaga.com';

  -- Kiểm tra sự tồn tại của các tài khoản Auth
  IF v_admin_id IS NULL OR v_partner_id IS NULL OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'CẢNH BÁO: Không tìm thấy các tài khoản demo admin@staysaga.com, partner@staysaga.com, user@staysaga.com. Vui lòng tạo chúng trong Supabase Auth UI trước khi chạy script này.';
  END IF;

  -- 2. CẬP NHẬT THÔNG TIN PROFILES (đã được trigger tự động tạo khi đăng ký Auth)
  UPDATE public.profiles
  SET full_name = 'Nguyễn Văn Admin', phone = '0901000001', role = 'ADMIN', status = 'ACTIVE'
  WHERE id = v_admin_id;

  UPDATE public.profiles
  SET full_name = 'Trần Thị Hoa (Partner)', phone = '0912000001', role = 'PARTNER', status = 'ACTIVE'
  WHERE id = v_partner_id;

  UPDATE public.profiles
  SET full_name = 'Phạm Quốc Bảo (User)', phone = '0933000001', role = 'USER', status = 'ACTIVE'
  WHERE id = v_user_id;

  -- 3. CHÈN TIỆN ÍCH (AMENITIES)
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

  -- Lấy ID tiện ích để liên kết
  SELECT id INTO v_wifi_id FROM public.amenities WHERE key = 'wifi';
  SELECT id INTO v_parking_id FROM public.amenities WHERE key = 'parking';
  SELECT id INTO v_kitchen_id FROM public.amenities WHERE key = 'kitchen';
  SELECT id INTO v_pool_id FROM public.amenities WHERE key = 'pool';
  SELECT id INTO v_bbq_id FROM public.amenities WHERE key = 'bbq';
  SELECT id INTO v_garden_id FROM public.amenities WHERE key = 'garden';
  SELECT id INTO v_ac_id FROM public.amenities WHERE key = 'ac';
  SELECT id INTO v_breakfast_id FROM public.amenities WHERE key = 'breakfast';
  SELECT id INTO v_hot_water_id FROM public.amenities WHERE key = 'hot_water';
  SELECT id INTO v_balcony_id FROM public.amenities WHERE key = 'balcony';

  -- 4. CHÈN CHỖ NGHỈ (HOMESTAYS) - Liên kết với v_partner_id làm chủ sở hữu
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
      v_homestay_dalat, v_partner_id, 'villa-hoa-sen-dalat',
      'Villa Hoa Sen Đà Lạt', 'Villa Hoa Sen Đà Lạt',
      'Villa rộng rãi với view đồi thông tuyệt đẹp, nằm ngay trung tâm Đà Lạt. Phù hợp cho gia đình và nhóm bạn nghỉ dưỡng cuối tuần.',
      'villa', '15 Đường Trần Hưng Đạo', 'Đà Lạt', 'Phường 3', 'Vietnam',
      850000.00, 850000.00, 6, 3, 4, 2,
      4.70, true, 'APPROVED', '0912000001', 'partner@staysaga.com', 'Trần Thị Hoa',
      '{"checkInFrom": "14:00", "checkInTo": "22:00", "checkOutFrom": "06:00", "checkOutTo": "12:00", "freeCancellation": true}'::jsonb,
      '{"basic": true, "location": true, "images": true, "rooms": true, "pricing": true, "amenities": true, "policies": true}'::jsonb,
      'INSTANT'
    ),
    (
      v_homestay_vungtau, v_partner_id, 'homestay-huong-bien-vungtau',
      'Homestay Hướng Biển Vũng Tàu', 'Homestay Hướng Biển Vũng Tàu',
      'Homestay view biển cực đẹp, cách bãi Sau chỉ 200m. Phòng sạch sẽ, tiện nghi đầy đủ cho kỳ nghỉ thoải mái.',
      'homestay', '88 Đường Thuỳ Vân', 'Vũng Tàu', 'Phường Thắng Tam', 'Vietnam',
      450000.00, 450000.00, 4, 2, 2, 1,
      4.50, true, 'APPROVED', '0912000001', 'partner@staysaga.com', 'Trần Thị Hoa',
      '{"checkInFrom": "14:00", "checkInTo": "20:00", "checkOutFrom": "07:00", "checkOutTo": "11:00", "freeCancellation": false}'::jsonb,
      '{"basic": true, "location": true, "images": true, "rooms": true, "pricing": true, "amenities": true, "policies": true}'::jsonb,
      'REQUEST'
    ),
    (
      v_homestay_saigon, v_partner_id, 'penthouse-saigon-center',
      'Penthouse Sài Gòn Center', 'Penthouse Sài Gòn Center',
      'Căn hộ penthouse cao cấp tại trung tâm Quận 1, TP.HCM. View toàn cảnh thành phố, nội thất sang trọng, hồ bơi sân thượng.',
      'apartment', '12 Đường Nguyễn Huệ', 'Hồ Chí Minh', 'Quận 1', 'Vietnam',
      1500000.00, 1500000.00, 4, 2, 2, 2,
      4.90, true, 'APPROVED', '0912000001', 'partner@staysaga.com', 'Trần Thị Hoa',
      '{"checkInFrom": "15:00", "checkInTo": "23:00", "checkOutFrom": "06:00", "checkOutTo": "12:00", "freeCancellation": true}'::jsonb,
      '{"basic": true, "location": true, "images": true, "rooms": true, "pricing": true, "amenities": true, "policies": true}'::jsonb,
      'INSTANT'
    )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active;

  -- 5. CHÈN PHÒNG (ROOMS)
  INSERT INTO public.rooms (id, homestay_id, name, max_guests, bed_type, bed_count, bathroom_count, private_bathroom, price_per_night, quantity, status)
  VALUES
    (v_room_dalat, v_homestay_dalat, 'Phòng Đôi Deluxe', 2, 'double', 1, 1, true, 850000.00, 2, 'ACTIVE'),
    (v_room_vungtau, v_homestay_vungtau, 'Phòng View Biển', 2, 'double', 1, 1, true, 450000.00, 3, 'ACTIVE'),
    (v_room_saigon, v_homestay_saigon, 'Suite Penthouse', 2, 'king', 1, 2, true, 1500000.00, 1, 'ACTIVE')
  ON CONFLICT (id) DO NOTHING;

  -- 6. CHÈN ẢNH CHỖ NGHỈ (HOMESTAY_IMAGES)
  INSERT INTO public.homestay_images (id, homestay_id, url, alt, sort_order)
  VALUES
    ('f0000000-0000-0000-0000-000000000001', v_homestay_dalat, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'Villa Đà Lạt - Mặt tiền', 0),
    ('f0000000-0000-0000-0000-000000000002', v_homestay_dalat, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'Villa Đà Lạt - Phòng khách', 1),
    ('f0000000-0000-0000-0000-000000000003', v_homestay_vungtau, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 'Homestay Vũng Tàu - View biển', 0),
    ('f0000000-0000-0000-0000-000000000004', v_homestay_vungtau, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'Homestay Vũng Tàu - Phòng ngủ', 1),
    ('f0000000-0000-0000-0000-000000000005', v_homestay_saigon, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'Penthouse Sài Gòn - Toàn cảnh', 0)
  ON CONFLICT (id) DO NOTHING;

  -- 7. GẮN TIỆN ÍCH CHO CHỖ NGHỈ (HOMESTAY_AMENITIES)
  INSERT INTO public.homestay_amenities (homestay_id, amenity_id) VALUES
    (v_homestay_dalat, v_wifi_id),
    (v_homestay_dalat, v_parking_id),
    (v_homestay_dalat, v_kitchen_id),
    (v_homestay_dalat, v_garden_id),
    (v_homestay_dalat, v_ac_id),
    (v_homestay_dalat, v_breakfast_id),
    (v_homestay_vungtau, v_wifi_id),
    (v_homestay_vungtau, v_ac_id),
    (v_homestay_vungtau, v_hot_water_id),
    (v_homestay_saigon, v_wifi_id),
    (v_homestay_saigon, v_pool_id),
    (v_homestay_saigon, v_ac_id),
    (v_homestay_saigon, v_balcony_id)
  ON CONFLICT (homestay_id, amenity_id) DO NOTHING;

  -- 8. CHÈN ĐƠN ĐẶT PHÒNG (BOOKINGS) - Liên kết với v_user_id làm khách đặt
  INSERT INTO public.bookings (
    id, user_id, homestay_id, room_id,
    check_in_date, check_out_date, guests,
    total_price, status, payment_status,
    nights, price_per_night,
    guest_name, guest_email, guest_phone,
    booking_code
  ) VALUES
    -- Booking 1: Đã hoàn thành
    (
      v_booking_1, v_user_id, v_homestay_dalat, v_room_dalat,
      '2026-04-10', '2026-04-13', 2,
      2550000.00, 'COMPLETED', 'PAID',
      3, 850000.00,
      'Phạm Quốc Bảo', 'user@staysaga.com', '0933000001',
      'BK-20260410-1000'
    ),
    -- Booking 2: Đã xác nhận
    (
      v_booking_2, v_user_id, v_homestay_saigon, v_room_saigon,
      '2026-06-15', '2026-06-18', 2,
      4500000.00, 'CONFIRMED', 'PAID',
      3, 1500000.00,
      'Phạm Quốc Bảo', 'user@staysaga.com', '0933000001',
      'BK-20260615-1001'
    ),
    -- Booking 3: Đang chờ
    (
      v_booking_3, v_user_id, v_homestay_vungtau, v_room_vungtau,
      '2026-07-01', '2026-07-04', 3,
      1350000.00, 'PENDING', 'UNPAID',
      3, 450000.00,
      'Phạm Quốc Bảo', 'user@staysaga.com', '0933000001',
      'BK-20260701-1002'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 9. CHÈN ĐÁNH GIÁ (REVIEWS) - Liên kết với v_user_id và booking_id
  INSERT INTO public.reviews (id, user_id, homestay_id, booking_id, rating, comment, status)
  VALUES
    (
      '20000000-0000-0000-0000-000000000001', v_user_id, v_homestay_dalat, v_booking_1,
      5, 'Villa rất đẹp, view đồi thông tuyệt vời! Chủ nhà thân thiện, phòng sạch sẽ và tiện nghi đầy đủ.',
      'VISIBLE'
    )
  ON CONFLICT (id) DO NOTHING;

  -- 10. CHÈN TIN NHẮN (BOOKING_MESSAGES)
  INSERT INTO public.booking_messages (id, booking_id, sender_id, sender_role, message, is_read)
  VALUES
    (
      '30000000-0000-0000-0000-000000000001', v_booking_1, v_user_id,
      'USER', 'Chào chủ nhà, tôi muốn hỏi về giờ check-in sớm (12:00) có được không ạ?',
      true
    ),
    (
      '30000000-0000-0000-0000-000000000002', v_booking_1, v_partner_id,
      'PARTNER', 'Chào bạn, bạn có thể check-in sớm từ 12:00, không phát sinh phụ phí nhé! Chúc bạn chuyến đi vui vẻ.',
      true
    )
  ON CONFLICT (id) DO NOTHING;

END $$;

-- 11. CẬP NHẬT CÀI ĐẶT TRANG WEB (SITE_SETTINGS)
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'StaySaga'),
  ('hero_title', 'Khám phá những điểm lưu trú tuyệt vời nhất Việt Nam'),
  ('hero_subtitle', 'Đặt homestay, villa và căn hộ nghỉ dưỡng theo phong cách hiện đại với StaySaga.'),
  ('featured_destinations', 'Đà Lạt,Hồ Chí Minh,Hội An,Phú Quốc,Vũng Tàu'),
  ('accent_color', 'rose')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
