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

Build va chay production container:

```bash
docker compose up --build
```

Mac dinh app lang nghe tai `http://localhost:3000`. Doi cong bang bien `APP_PORT`.

## Deploy VPS goi y

1. Clone repository len VPS.
2. Tao `.env` hoac export cac bien trong `.env.example`.
3. Chay:

```bash
docker compose up --build -d
```

4. Cau hinh reverse proxy Nginx/Caddy tro domain ve port container.
5. Cap SSL bang Cloudflare, Caddy tu dong, hoac Certbot.

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
