# StaySaga

StaySaga la ung dung dat homestay full-stack cho do an mon "Cac cong nghe moi trong phat trien phan mem".

## Cong nghe

- Next.js App Router, Server Components, Client Components, Server Actions
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, Storage, RLS
- Dockerfile multi-stage va Docker Compose

## Chuc nang chinh

- Dang ky, dang nhap, dang xuat bang Supabase Auth
- Tim kiem va xem chi tiet homestay
- Dat phong, doi lich, huy don dat phong
- Yeu thich homestay
- Danh gia sau khi hoan tat chuyen di
- Host dashboard tai `/host`: tao, doc, cap nhat, xoa homestay va upload anh len Supabase Storage
- Schema/RLS nam trong `supabase/migrations/202605150001_init_staysaga.sql`

## Chay local

Tao file `.env.local` theo mau:

```bash
cp .env.example .env.local
```

Cap nhat cac bien Supabase:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Cai dependencies va chay dev server:

```bash
npm install
npm run dev
```

Mo `http://localhost:3000`.

## Supabase

1. Tao project Supabase.
2. Chay SQL trong `supabase/migrations/202605150001_init_staysaga.sql` bang Supabase SQL Editor, hoac dung Supabase CLI.
3. Bat Auth providers can dung trong Supabase Dashboard.
4. Bucket `homestay-images` va cac policy Storage da co trong migration.
5. Them URL callback Auth:

```text
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
```

## Docker

Build va chay production container voi file moi truong local:

```bash
docker compose --env-file .env.local up --build -d
```

Mac dinh app lang nghe tai `http://localhost:3000`. Doi cong bang bien `APP_PORT`, vi du tren PowerShell:

```powershell
$env:APP_PORT="3001"
docker compose --env-file .env.local up --build -d
```

Kiem tra va dung container:

```bash
docker ps
docker compose down
```

## Deploy VPS

VPS Ubuntu can cai Docker va Docker Compose plugin. Sau khi clone repository vao `/var/www/staysaga`, tao file `.env.production` truc tiep tren VPS, khong commit file nay:

```env
APP_PORT=3000
NEXT_PUBLIC_SITE_URL=http://4.190.160.57
NEXT_PUBLIC_SUPABASE_URL=<dien-tren-vps>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<dien-tren-vps>
SUPABASE_SERVICE_ROLE_KEY=<dien-tren-vps>
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Build va chay production:

```bash
docker compose --env-file .env.production up --build -d
```

Kiem tra:

```bash
docker ps
docker logs staysaga-web --tail=100
curl -I http://localhost:3000
curl -I http://4.190.160.57:3000
```

Neu VPS chi co 1GB RAM, nen tao swap 2GB truoc khi build Docker:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

Khi co domain, co the dat Caddy/Nginx lam reverse proxy port 80/443 vao service `staysaga-web:3000` va cap SSL HTTPS.

## Kiem tra

Trong moi truong hien tai da kiem tra:

```bash
next build
eslint
```

`next build` thanh cong. `eslint` khong con error, con warning ve `any`, `<img>` va hook dependency trong mot so file cu.

## Phu luc nop bai

- [Phu luc AI prompts](docs/AI_PROMPTS.md)
- [Huong dan deployment](docs/DEPLOYMENT.md)
- [Deployment checklist](docs/DEPLOYMENT_CHECKLIST.md)
