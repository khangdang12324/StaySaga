create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  locale text default 'vi',
  role text not null default 'guest' check (role in ('guest', 'host', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.homestays (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  address text,
  city text not null,
  country text not null default 'Vietnam',
  price_per_night numeric(12, 2) not null check (price_per_night >= 0),
  max_guests integer not null default 2 check (max_guests > 0),
  bedrooms integer not null default 1 check (bedrooms >= 0),
  beds integer not null default 1 check (beds >= 0),
  bathrooms integer not null default 1 check (bathrooms >= 0),
  avg_rating numeric(3, 2) not null default 4.8 check (avg_rating >= 0 and avg_rating <= 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.homestay_images (
  id uuid primary key default gen_random_uuid(),
  homestay_id uuid not null references public.homestays(id) on delete cascade,
  url text not null,
  storage_path text,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.amenities (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null
);

create table if not exists public.homestay_amenities (
  homestay_id uuid not null references public.homestays(id) on delete cascade,
  amenity_id uuid not null references public.amenities(id) on delete cascade,
  primary key (homestay_id, amenity_id)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  homestay_id uuid not null references public.homestays(id) on delete cascade,
  check_in_date date not null,
  check_out_date date not null,
  guests integer not null check (guests > 0),
  total_price numeric(12, 2) not null check (total_price >= 0),
  status text not null default 'PENDING' check (status in ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out_date > check_in_date)
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.homestays(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  homestay_id uuid not null references public.homestays(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, homestay_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  type text not null default 'booking',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists homestays_owner_id_idx on public.homestays(owner_id);
create index if not exists homestays_city_idx on public.homestays(city);
create index if not exists homestays_active_idx on public.homestays(is_active);
create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_homestay_id_idx on public.bookings(homestay_id);
create index if not exists favorites_user_id_idx on public.favorites(user_id);
create index if not exists reviews_homestay_id_idx on public.reviews(homestay_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_homestays_updated_at on public.homestays;
create trigger set_homestays_updated_at
before update on public.homestays
for each row execute function public.set_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.homestays enable row level security;
alter table public.homestay_images enable row level security;
alter table public.amenities enable row level security;
alter table public.homestay_amenities enable row level security;
alter table public.bookings enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles are readable" on public.profiles;
create policy "profiles are readable"
on public.profiles for select
using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "active homestays are public" on public.homestays;
create policy "active homestays are public"
on public.homestays for select
using (is_active = true or owner_id = auth.uid());

drop policy if exists "hosts create own homestays" on public.homestays;
create policy "hosts create own homestays"
on public.homestays for insert
with check (auth.uid() = owner_id);

drop policy if exists "hosts update own homestays" on public.homestays;
create policy "hosts update own homestays"
on public.homestays for update
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "hosts delete own homestays" on public.homestays;
create policy "hosts delete own homestays"
on public.homestays for delete
using (auth.uid() = owner_id);

drop policy if exists "public can read homestay images" on public.homestay_images;
create policy "public can read homestay images"
on public.homestay_images for select
using (
  exists (
    select 1 from public.homestays h
    where h.id = homestay_id and (h.is_active = true or h.owner_id = auth.uid())
  )
);

drop policy if exists "hosts manage own homestay images" on public.homestay_images;
create policy "hosts manage own homestay images"
on public.homestay_images for all
using (
  exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
);

drop policy if exists "amenities are public" on public.amenities;
create policy "amenities are public"
on public.amenities for select
using (true);

drop policy if exists "homestay amenities are public" on public.homestay_amenities;
create policy "homestay amenities are public"
on public.homestay_amenities for select
using (true);

drop policy if exists "users read own bookings" on public.bookings;
create policy "users read own bookings"
on public.bookings for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
);

drop policy if exists "users create own bookings" on public.bookings;
create policy "users create own bookings"
on public.bookings for insert
with check (user_id = auth.uid());

drop policy if exists "users and hosts update relevant bookings" on public.bookings;
create policy "users and hosts update relevant bookings"
on public.bookings for update
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
);

drop policy if exists "users manage own favorites" on public.favorites;
create policy "users manage own favorites"
on public.favorites for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "reviews are public" on public.reviews;
create policy "reviews are public"
on public.reviews for select
using (true);

drop policy if exists "users create own reviews after stay" on public.reviews;
create policy "users create own reviews after stay"
on public.reviews for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.bookings b
    where b.user_id = auth.uid()
      and b.homestay_id = reviews.homestay_id
      and b.check_out_date < current_date
  )
);

drop policy if exists "users update own reviews" on public.reviews;
create policy "users update own reviews"
on public.reviews for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users delete own reviews" on public.reviews;
create policy "users delete own reviews"
on public.reviews for delete
using (user_id = auth.uid());

drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications"
on public.notifications for select
using (user_id = auth.uid());

drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications"
on public.notifications for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

insert into public.amenities (key, name) values
  ('wifi', 'Wi-Fi'),
  ('parking', 'Bai do xe'),
  ('kitchen', 'Bep rieng'),
  ('pool', 'Ho boi'),
  ('bbq', 'BBQ'),
  ('garden', 'San vuon'),
  ('ac', 'Dieu hoa'),
  ('breakfast', 'Bua sang')
on conflict (key) do update set name = excluded.name;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homestay-images',
  'homestay-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "homestay images are public" on storage.objects;
create policy "homestay images are public"
on storage.objects for select
using (bucket_id = 'homestay-images');

drop policy if exists "users upload homestay images under own folder" on storage.objects;
create policy "users upload homestay images under own folder"
on storage.objects for insert
with check (
  bucket_id = 'homestay-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users update own homestay images" on storage.objects;
create policy "users update own homestay images"
on storage.objects for update
using (
  bucket_id = 'homestay-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'homestay-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users delete own homestay images" on storage.objects;
create policy "users delete own homestay images"
on storage.objects for delete
using (
  bucket_id = 'homestay-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
