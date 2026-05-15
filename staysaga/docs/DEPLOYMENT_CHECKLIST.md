# Deployment Checklist

Danh sach kiem tra nhanh truoc khi nop bai:

- [ ] Dockerfile co multi-stage build.
- [ ] `docker compose up --build` chay duoc local.
- [ ] `.env`/`.env.local` da co du bien Supabase.
- [ ] Supabase Auth dang ky / dang nhap / dang xuat hoat dong.
- [ ] Storage bucket `homestay-images` da tao va co policy.
- [ ] Database migration va RLS da ap dung tren Supabase.
- [ ] Ứng dụng deploy tren VPS va truy cap bang domain that.
- [ ] HTTPS/SSL hoat dong tot tren domain.
- [ ] Redirect callback Auth da cap nhat dung URL production.
- [ ] Anh chup man hinh hoac URL production da dua vao bao cao.
- [ ] Phu luc AI prompts da co >5 prompt va giai thich muc dich.
