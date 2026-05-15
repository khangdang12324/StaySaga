# Deployment Guide

Tai lieu nay mo ta quy trinh trien khai StaySaga len VPS voi domain va SSL.

## Yeu cau

- VPS co Docker va Docker Compose
- Domain da tro DNS ve IP VPS
- Caddy hoac Nginx + Certbot neu tu quan ly SSL
- Bien moi truong Supabase day du

## Chay container

```bash
docker compose up --build -d
```

Mac dinh ung dung chay tai cong `3000`.

## Cau hinh domain

Neu dung reverse proxy:

- Tro `A record` cua domain ve IP VPS.
- Cau hinh proxy ve `http://127.0.0.1:3000`.
- Bat HTTPS cho domain.

## Goi y voi Caddy

Caddy co the tu dong cap SSL khi domain da tro dung ve VPS.

Vi du:

```caddy
staysaga.yourdomain.com {
  reverse_proxy 127.0.0.1:3000
}
```

## Bien moi truong can co

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` neu bat thanh toan
- `STRIPE_WEBHOOK_SECRET` neu bat webhooks

## Kiem tra sau deploy

- Trang chu tai `https://your-domain.com`
- Dang nhap / dang ky Supabase Auth
- Chuyen huong callback `https://your-domain.com/auth/callback`
- Upload anh homestay len Supabase Storage
- Quay lai `docker compose up -d` sau khi cap nhat code
