-- ============================================================
-- MIGRATION: 202605150001_init_staysaga.sql
-- ============================================================

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


-- ============================================================
-- MIGRATION: 202605150002_site_settings.sql
-- ============================================================

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_site_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_site_settings_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "admins manage site settings" on public.site_settings;
create policy "admins manage site settings"
on public.site_settings for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

insert into public.site_settings (key, value) values
  ('site_name', 'StaySaga'),
  ('hero_title', 'KhÃ¡m phÃ¡ nhá»¯ng Ä‘iá»ƒm lÆ°u trÃº tuyá»‡t vá»i nháº¥t'),
  ('hero_subtitle', 'Äáº·t homestay, khÃ¡ch sáº¡n vÃ  tráº£i nghiá»‡m nghá»‰ dÆ°á»¡ng theo phong cÃ¡ch Booking/Agoda vá»›i giao diá»‡n nháº¹, nhanh vÃ  rÃµ rÃ ng.'),
  ('accent_color', 'rose')
on conflict (key) do update set value = excluded.value;


-- ============================================================
-- MIGRATION: 202605150003_storage_buckets.sql
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('site-assets', 'site-assets', true),
  ('homestay-images', 'homestay-images', true)
on conflict (id) do nothing;


-- ============================================================
-- MIGRATION: 202605170001_roles_rls_user_partner_admin.sql
-- ============================================================

-- StaySaga role model: USER, PARTNER, ADMIN.
-- This migration keeps the current table names (homestays) while documenting the
-- property-level permissions required by the app.

alter table public.profiles
  add column if not exists email text,
  add column if not exists status text not null default 'ACTIVE';

alter table public.homestays
  add column if not exists status text not null default 'APPROVED';

alter table public.reviews
  add column if not exists status text not null default 'VISIBLE',
  add column if not exists booking_id uuid references public.bookings(id) on delete set null;

alter table public.bookings
  drop constraint if exists bookings_status_check;

alter table public.bookings
  add constraint bookings_status_check
  check (status in ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'));

alter table public.profiles
  drop constraint if exists profiles_role_check,
  drop constraint if exists profiles_status_check;

update public.profiles
set role = case
  when upper(role) = 'ADMIN' then 'ADMIN'
  when upper(role) in ('HOST', 'PARTNER') then 'PARTNER'
  else 'USER'
end;

alter table public.profiles
  add constraint profiles_role_check check (role in ('USER', 'PARTNER', 'ADMIN')),
  add constraint profiles_status_check check (status in ('ACTIVE', 'BLOCKED'));

alter table public.homestays
  drop constraint if exists homestays_status_check;

alter table public.homestays
  add constraint homestays_status_check
  check (status in ('PENDING', 'APPROVED', 'REJECTED'));

alter table public.reviews
  drop constraint if exists reviews_status_check;

alter table public.reviews
  add constraint reviews_status_check
  check (status in ('VISIBLE', 'HIDDEN'));

create or replace function public.current_app_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'USER')
$$;

create or replace function public.current_profile_status()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select status from public.profiles where id = auth.uid()), 'ACTIVE')
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_app_role() = 'ADMIN'
$$;

create or replace function public.is_partner_or_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_app_role() in ('PARTNER', 'ADMIN')
$$;

create or replace function public.is_active_profile()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_profile_status() = 'ACTIVE'
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    'USER',
    'ACTIVE'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop policy if exists "profiles are readable" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "users insert own profile" on public.profiles;

create policy "profiles select own or admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "profiles insert own active user"
on public.profiles for insert
with check (
  id = auth.uid()
  and role = 'USER'
  and status = 'ACTIVE'
);

create policy "profiles update own non security fields"
on public.profiles for update
using (id = auth.uid() and public.is_active_profile())
with check (
  id = auth.uid()
  and role = public.current_app_role()
  and status = public.current_profile_status()
);

create policy "admins manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "active homestays are public" on public.homestays;
drop policy if exists "hosts create own homestays" on public.homestays;
drop policy if exists "hosts update own homestays" on public.homestays;
drop policy if exists "hosts delete own homestays" on public.homestays;

create policy "approved homestays public partner owner admin"
on public.homestays for select
using (
  status = 'APPROVED'
  or owner_id = auth.uid()
  or public.is_admin()
);

create policy "partners create own homestays"
on public.homestays for insert
with check (
  public.is_active_profile()
  and public.is_partner_or_admin()
  and owner_id = auth.uid()
);

create policy "partners update own homestays"
on public.homestays for update
using (
  public.is_active_profile()
  and (owner_id = auth.uid() or public.is_admin())
)
with check (
  public.is_active_profile()
  and (owner_id = auth.uid() or public.is_admin())
);

create policy "partners delete own homestays"
on public.homestays for delete
using (
  public.is_active_profile()
  and (owner_id = auth.uid() or public.is_admin())
);

drop policy if exists "users read own bookings" on public.bookings;
drop policy if exists "users create own bookings" on public.bookings;
drop policy if exists "users and hosts update relevant bookings" on public.bookings;

create policy "bookings select relevant"
on public.bookings for select
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
);

create policy "users create own bookings"
on public.bookings for insert
with check (
  public.is_active_profile()
  and user_id = auth.uid()
);

create policy "users partners admins update relevant bookings"
on public.bookings for update
using (
  public.is_active_profile()
  and (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.homestays h
      where h.id = homestay_id and h.owner_id = auth.uid()
    )
  )
)
with check (
  public.is_active_profile()
  and (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.homestays h
      where h.id = homestay_id and h.owner_id = auth.uid()
    )
  )
);

drop policy if exists "reviews are public" on public.reviews;
drop policy if exists "users create own reviews after stay" on public.reviews;
drop policy if exists "users update own reviews" on public.reviews;
drop policy if exists "users delete own reviews" on public.reviews;

create policy "visible reviews public admin all"
on public.reviews for select
using (status = 'VISIBLE' or user_id = auth.uid() or public.is_admin());

create policy "users create own reviews after stay"
on public.reviews for insert
with check (
  public.is_active_profile()
  and user_id = auth.uid()
  and exists (
    select 1 from public.bookings b
    where b.user_id = auth.uid()
      and b.homestay_id = reviews.homestay_id
      and (reviews.booking_id is null or b.id = reviews.booking_id)
      and b.check_out_date < current_date
  )
);

create policy "users update own visible reviews"
on public.reviews for update
using (public.is_active_profile() and user_id = auth.uid())
with check (public.is_active_profile() and user_id = auth.uid() and status = 'VISIBLE');

create policy "admins manage reviews"
on public.reviews for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage site settings" on public.site_settings;
create policy "admins manage site settings"
on public.site_settings for all
using (public.is_admin())
with check (public.is_admin());

update public.profiles
set role = 'ADMIN', status = 'ACTIVE'
where email = 'admin@staysaga.com';


-- ============================================================
-- MIGRATION: 202605190001_host_schema_compat.sql
-- ============================================================

alter table public.homestays
  add column if not exists status text not null default 'APPROVED';

alter table public.homestays
  drop constraint if exists homestays_status_check;

alter table public.homestays
  add constraint homestays_status_check
  check (status in ('PENDING', 'APPROVED', 'REJECTED'));

alter table public.homestay_images
  add column if not exists storage_path text;



-- ============================================================
-- MIGRATION: 202605190002_property_lifecycle_soft_delete.sql
-- ============================================================

-- Property lifecycle for StaySaga partner/admin management.
-- Soft delete is represented by status = 'DELETED'; records are not hard-deleted.

alter table public.homestays
  add column if not exists status text not null default 'PENDING',
  add column if not exists delete_requested_at timestamptz,
  add column if not exists delete_requested_by uuid references public.profiles(id) on delete set null,
  add column if not exists delete_reason text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists suspended_reason text,
  add column if not exists updated_at timestamptz default now();

update public.homestays
set status = 'APPROVED'
where status is null or status = '';

alter table public.homestays
  drop constraint if exists homestays_status_check;

alter table public.homestays
  add constraint homestays_status_check
  check (
    status in (
      'PENDING',
      'APPROVED',
      'REJECTED',
      'HIDDEN',
      'SUSPENDED',
      'CLOSED_TEMP',
      'DELETE_REQUESTED',
      'DELETED'
    )
  );

drop policy if exists "approved homestays public partner owner admin" on public.homestays;
drop policy if exists "active homestays are public" on public.homestays;

create policy "public reads approved active homestays"
on public.homestays for select
using (
  (status = 'APPROVED' and is_active = true)
  or owner_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "partners update own homestays" on public.homestays;
create policy "partners update own homestays"
on public.homestays for update
using (
  public.is_active_profile()
  and (owner_id = auth.uid() or public.is_admin())
)
with check (
  public.is_active_profile()
  and (
    public.is_admin()
    or (
      owner_id = auth.uid()
      and status in ('PENDING', 'APPROVED', 'CLOSED_TEMP', 'DELETE_REQUESTED', 'HIDDEN')
    )
  )
);

drop policy if exists "partners delete own homestays" on public.homestays;
-- No direct partner delete policy. Deletion is handled as status = DELETED through server actions.
create policy "admins hard delete homestays only"
on public.homestays for delete
using (public.is_admin());


-- ============================================================
-- MIGRATION: 202605200001_property_registration_workflow.sql
-- ============================================================

-- Registration workflow for StaySaga partner properties.
-- This keeps the existing public.homestays table and adds only compatible fields.

alter table public.homestays
  add column if not exists property_type text,
  add column if not exists short_description text,
  add column if not exists detailed_description text,
  add column if not exists district text,
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(10, 7),
  add column if not exists directions_note text,
  add column if not exists area_sqm numeric(10, 2),
  add column if not exists base_price_per_night numeric(12, 2),
  add column if not exists sale_start_date date,
  add column if not exists sale_end_date date,
  add column if not exists available_units integer not null default 1,
  add column if not exists booking_mode text not null default 'INSTANT',
  add column if not exists verification_status text not null default 'PENDING',
  add column if not exists rejection_reason text,
  add column if not exists owner_name text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists verification_note text,
  add column if not exists policies jsonb not null default '{}'::jsonb,
  add column if not exists registration_checklist jsonb not null default '{}'::jsonb,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;

alter table public.homestays
  drop constraint if exists homestays_status_check;

alter table public.homestays
  add constraint homestays_status_check
  check (
    status in (
      'DRAFT',
      'PENDING',
      'APPROVED',
      'REJECTED',
      'HIDDEN',
      'SUSPENDED',
      'CLOSED_TEMP',
      'DELETE_REQUESTED',
      'DELETED'
    )
  );

alter table public.homestays
  drop constraint if exists homestays_booking_mode_check,
  add constraint homestays_booking_mode_check
  check (booking_mode in ('INSTANT', 'REQUEST'));

alter table public.homestays
  drop constraint if exists homestays_verification_status_check,
  add constraint homestays_verification_status_check
  check (verification_status in ('PENDING', 'APPROVED', 'REJECTED'));

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  homestay_id uuid not null references public.homestays(id) on delete cascade,
  name text not null,
  max_guests integer not null default 2 check (max_guests > 0),
  bed_type text not null default 'double',
  bed_count integer not null default 1 check (bed_count > 0),
  bathroom_count integer not null default 1 check (bathroom_count >= 0),
  private_bathroom boolean not null default true,
  price_per_night numeric(12, 2) not null default 0 check (price_per_night >= 0),
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_rooms_updated_at on public.rooms;
create trigger set_rooms_updated_at
before update on public.rooms
for each row execute function public.set_updated_at();

alter table public.rooms enable row level security;

drop policy if exists "public reads approved rooms" on public.rooms;
create policy "public reads approved rooms"
on public.rooms for select
using (
  exists (
    select 1 from public.homestays h
    where h.id = rooms.homestay_id
      and (
        (h.status = 'APPROVED' and h.is_active = true)
        or h.owner_id = auth.uid()
        or public.is_admin()
      )
  )
);

drop policy if exists "partners manage own rooms" on public.rooms;
create policy "partners manage own rooms"
on public.rooms for all
using (
  public.is_active_profile()
  and exists (
    select 1 from public.homestays h
    where h.id = rooms.homestay_id
      and (h.owner_id = auth.uid() or public.is_admin())
  )
)
with check (
  public.is_active_profile()
  and exists (
    select 1 from public.homestays h
    where h.id = rooms.homestay_id
      and (h.owner_id = auth.uid() or public.is_admin())
  )
);

alter table public.homestay_images
  add column if not exists image_url text,
  add column if not exists is_cover boolean not null default false,
  add column if not exists category text,
  add column if not exists sort_order integer not null default 0;

drop policy if exists "partners update own homestays" on public.homestays;
create policy "partners update own homestays"
on public.homestays for update
using (
  public.is_active_profile()
  and (owner_id = auth.uid() or public.is_admin())
)
with check (
  public.is_active_profile()
  and (
    public.is_admin()
    or (
      owner_id = auth.uid()
      and status in ('DRAFT', 'PENDING', 'REJECTED', 'CLOSED_TEMP', 'DELETE_REQUESTED', 'HIDDEN')
    )
  )
);

drop policy if exists "partners create own homestays" on public.homestays;
drop policy if exists "hosts create own homestays" on public.homestays;
create policy "partners create own homestays"
on public.homestays for insert
with check (
  public.is_active_profile()
  and owner_id = auth.uid()
  and status in ('DRAFT', 'PENDING')
);


-- ============================================================
-- MIGRATION: 202605200002_property_registration_fields.sql
-- ============================================================

-- StaySaga partner property registration fields.
-- Safe additive migration: keeps existing homestays data and adds fields used by the multi-step workflow.

alter table public.homestays
  add column if not exists title text,
  add column if not exists weekend_price numeric,
  add column if not exists available_from date,
  add column if not exists available_to date,
  add column if not exists min_nights integer default 1,
  add column if not exists instant_book boolean default false,
  add column if not exists area_m2 numeric,
  add column if not exists location_note text,
  add column if not exists check_in_from text,
  add column if not exists check_in_to text,
  add column if not exists check_out_from text,
  add column if not exists check_out_to text,
  add column if not exists free_cancellation boolean default false,
  add column if not exists no_prepayment boolean default false,
  add column if not exists no_credit_card boolean default false,
  add column if not exists allow_children boolean default true,
  add column if not exists allow_pets boolean default false,
  add column if not exists allow_smoking boolean default false,
  add column if not exists allow_party boolean default false,
  add column if not exists house_rules text,
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references public.profiles(id) on delete set null;

update public.homestays
set title = coalesce(title, name)
where title is null;

alter table public.homestays
  drop constraint if exists homestays_min_nights_check,
  add constraint homestays_min_nights_check check (min_nights is null or min_nights >= 1);

alter table public.rooms
  add column if not exists has_kitchen boolean default false,
  add column if not exists has_balcony boolean default false,
  add column if not exists allow_smoking boolean default false;

alter table public.homestay_images
  add column if not exists created_at timestamptz default timezone('utc'::text, now());


-- ============================================================
-- MIGRATION: 202605240001_enable_realtime.sql
-- ============================================================

-- Safe, idempotent script to enable Supabase Realtime for staysaga core tables

DO $$
BEGIN
  -- Create supabase_realtime publication if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    EXECUTE 'CREATE PUBLICATION supabase_realtime';
  END IF;

  -- Add profiles table to publication
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public') 
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles' AND schemaname = 'public') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE profiles';
  END IF;

  -- Add homestays table to publication
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'homestays' AND schemaname = 'public') 
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'homestays' AND schemaname = 'public') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE homestays';
  END IF;

  -- Add bookings table to publication
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'bookings' AND schemaname = 'public') 
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'bookings' AND schemaname = 'public') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE bookings';
  END IF;

  -- Add reviews table to publication
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'reviews' AND schemaname = 'public') 
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reviews' AND schemaname = 'public') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE reviews';
  END IF;
END $$;


-- ============================================================
-- MIGRATION: 202605240002_bookings_ota_upgrade.sql
-- ============================================================

-- Upgrades the bookings table to support OTA features (status, payment_status, booking_code, and indexes)

-- 1. Drop existing status check constraint and recreate it with new statuses: CHECKED_IN, NO_SHOW
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'bookings'
          AND nsp.nspname = 'public'
          AND con.contype = 'c'
          AND con.conname LIKE '%status%'
    LOOP
        EXECUTE 'ALTER TABLE public.bookings DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'CHECKED_IN', 'NO_SHOW'));

-- 2. Add payment_status column if it doesn't exist
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'UNPAID';

-- Update payment_status for existing bookings based on status
UPDATE public.bookings 
SET payment_status = 'PAID' 
WHERE status IN ('CONFIRMED', 'COMPLETED') AND payment_status = 'UNPAID';

-- 3. Add booking_code, cancel_reason and special_requests columns if they don't exist
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_code text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancel_reason text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS special_requests text;

-- Populate booking_code for existing bookings using a fallback default
UPDATE public.bookings 
SET booking_code = 'BK-' || upper(substring(id::text from 1 for 8))
WHERE booking_code IS NULL;

-- 4. Trigger to auto-generate booking_code on insert
CREATE OR REPLACE FUNCTION public.set_booking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := 'BK-' || upper(substring(NEW.id::text from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_booking_code ON public.bookings;
CREATE TRIGGER trigger_set_booking_code
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_booking_code();

-- 5. Create Indexes safely
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings(status);
CREATE INDEX IF NOT EXISTS bookings_payment_status_idx ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS bookings_created_at_desc_idx ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_check_in_date_idx ON public.bookings(check_in_date);
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_homestay_id_idx ON public.bookings(homestay_id);
CREATE INDEX IF NOT EXISTS bookings_booking_code_idx ON public.bookings(booking_code);


-- ============================================================
-- MIGRATION: 202605250003_bookings_trips_complete.sql
-- ============================================================

-- 1. Upgrade bookings table with new columns and constraints safely
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS booking_code text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'UNPAID';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS nights integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS price_per_night numeric(12, 2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_phone text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS special_request text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cancel_reason text;

-- 2. Drop existing status check constraint and recreate it with new statuses if needed
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint con
        INNER JOIN pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'bookings'
          AND nsp.nspname = 'public'
          AND con.contype = 'c'
          AND con.conname LIKE '%status%'
    LOOP
        EXECUTE 'ALTER TABLE public.bookings DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'CHECKED_IN', 'NO_SHOW'));
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check CHECK (payment_status IN ('UNPAID', 'PAID', 'PAY_AT_PROPERTY', 'REFUNDED'));

-- 3. Trigger to auto-generate booking_code on insert (if it doesn't already exist)
CREATE OR REPLACE FUNCTION public.set_booking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;
  IF NEW.booking_code IS NULL THEN
    NEW.booking_code := 'BK-' || upper(substring(NEW.id::text from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_booking_code ON public.bookings;
CREATE TRIGGER trigger_set_booking_code
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_booking_code();

-- Update any existing bookings without a code
UPDATE public.bookings 
SET booking_code = 'BK-' || upper(substring(id::text from 1 for 8))
WHERE booking_code IS NULL;

-- 4. Create booking_messages table
CREATE TABLE IF NOT EXISTS public.booking_messages (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  receiver_id uuid references public.profiles(id) on delete set null,
  sender_role text not null check (sender_role in ('USER', 'PARTNER', 'ADMIN', 'SYSTEM')),
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 5. Create invoice_requests table
CREATE TABLE IF NOT EXISTS public.invoice_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  homestay_id uuid not null references public.homestays(id) on delete cascade,
  company_name text,
  tax_code text,
  billing_email text,
  billing_address text,
  note text,
  status text not null default 'PENDING' check (status in ('PENDING', 'SENT', 'REJECTED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Enable RLS on the new tables
ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_requests ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies for booking_messages
DROP POLICY IF EXISTS "Users can read messages of their bookings" ON public.booking_messages;
CREATE POLICY "Users can read messages of their bookings"
ON public.booking_messages FOR SELECT
USING (
  exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (
        b.user_id = auth.uid()
        or exists (
          select 1 from public.homestays h
          where h.id = b.homestay_id and h.owner_id = auth.uid()
        )
      )
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "Users can insert messages to their bookings" ON public.booking_messages;
CREATE POLICY "Users can insert messages to their bookings"
ON public.booking_messages FOR INSERT
WITH CHECK (
  exists (
    select 1 from public.bookings b
    where b.id = booking_id
      and (
        b.user_id = auth.uid()
        or exists (
          select 1 from public.homestays h
          where h.id = b.homestay_id and h.owner_id = auth.uid()
        )
      )
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

-- 8. RLS policies for invoice_requests
DROP POLICY IF EXISTS "Users can read relevant invoice requests" ON public.invoice_requests;
CREATE POLICY "Users can read relevant invoice requests"
ON public.invoice_requests FOR SELECT
USING (
  user_id = auth.uid()
  or exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

DROP POLICY IF EXISTS "Users can create invoice requests" ON public.invoice_requests;
CREATE POLICY "Users can create invoice requests"
ON public.invoice_requests FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "Hosts can update relevant invoice requests" ON public.invoice_requests;
CREATE POLICY "Hosts can update relevant invoice requests"
ON public.invoice_requests FOR UPDATE
USING (
  exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
)
WITH CHECK (
  exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);


-- ============================================================
-- MIGRATION: 202605260001_checkout_booking_flow.sql
-- ============================================================

-- Safe upgrade for checkout -> bookings flow.
alter table public.bookings add column if not exists room_id uuid references public.rooms(id) on delete set null;
alter table public.bookings add column if not exists check_in date;
alter table public.bookings add column if not exists check_out date;
alter table public.bookings add column if not exists booking_code text;
alter table public.bookings add column if not exists payment_status text default 'UNPAID';
alter table public.bookings add column if not exists nights integer;
alter table public.bookings add column if not exists price_per_night numeric(12, 2);
alter table public.bookings add column if not exists guest_name text;
alter table public.bookings add column if not exists guest_email text;
alter table public.bookings add column if not exists guest_phone text;
alter table public.bookings add column if not exists special_request text;

update public.bookings
set
  check_in = coalesce(check_in, check_in_date),
  check_out = coalesce(check_out, check_out_date),
  nights = coalesce(nights, greatest(1, check_out_date - check_in_date)),
  price_per_night = coalesce(price_per_night, total_price / nullif(greatest(1, check_out_date - check_in_date), 0)),
  payment_status = coalesce(payment_status, 'UNPAID')
where check_in is null
   or check_out is null
   or nights is null
   or price_per_night is null
   or payment_status is null;

do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where rel.relname = 'bookings'
      and nsp.nspname = 'public'
      and con.contype = 'c'
      and con.conname in ('bookings_status_check', 'bookings_payment_status_check')
  loop
    execute 'alter table public.bookings drop constraint ' || quote_ident(r.conname);
  end loop;
end $$;

alter table public.bookings
  add constraint bookings_status_check
  check (status in ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'CHECKED_IN', 'NO_SHOW'));

alter table public.bookings
  add constraint bookings_payment_status_check
  check (payment_status in ('UNPAID', 'PAID', 'PAY_AT_PROPERTY', 'REFUNDED'));

create or replace function public.set_booking_checkout_fields()
returns trigger
language plpgsql
as $$
begin
  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  new.check_in_date := coalesce(new.check_in_date, new.check_in);
  new.check_out_date := coalesce(new.check_out_date, new.check_out);
  new.check_in := coalesce(new.check_in, new.check_in_date);
  new.check_out := coalesce(new.check_out, new.check_out_date);

  if new.nights is null and new.check_in_date is not null and new.check_out_date is not null then
    new.nights := greatest(1, new.check_out_date - new.check_in_date);
  end if;

  if new.price_per_night is null and new.total_price is not null and new.nights is not null and new.nights > 0 then
    new.price_per_night := new.total_price / new.nights;
  end if;

  if new.booking_code is null then
    new.booking_code := 'BK-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substring(new.id::text from 1 for 4));
  end if;

  new.payment_status := coalesce(new.payment_status, 'UNPAID');
  return new;
end;
$$;

drop trigger if exists trigger_set_booking_code on public.bookings;
drop trigger if exists trigger_set_booking_checkout_fields on public.bookings;
create trigger trigger_set_booking_checkout_fields
before insert or update on public.bookings
for each row
execute function public.set_booking_checkout_fields();

create index if not exists bookings_room_id_idx on public.bookings(room_id);
create index if not exists bookings_check_in_idx on public.bookings(check_in);
create index if not exists bookings_check_out_idx on public.bookings(check_out);
create unique index if not exists bookings_booking_code_unique_idx on public.bookings(booking_code);

drop policy if exists "bookings select relevant" on public.bookings;
drop policy if exists "users read own bookings" on public.bookings;
create policy "bookings select relevant"
on public.bookings for select
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
);

drop policy if exists "users create own bookings" on public.bookings;
create policy "users create own bookings"
on public.bookings for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.homestays h
    where h.id = homestay_id
      and h.status = 'APPROVED'
      and h.is_active = true
  )
);

drop policy if exists "users partners admins update relevant bookings" on public.bookings;
drop policy if exists "users and hosts update relevant bookings" on public.bookings;
create policy "users partners admins update relevant bookings"
on public.bookings for update
using (
  (user_id = auth.uid() and status in ('PENDING', 'CONFIRMED'))
  or public.is_admin()
  or exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
);


-- ============================================================
-- MIGRATION: 202605260002_homestay_images_columns.sql
-- ============================================================

-- Safe upgrade for homestay_images columns and bucket definition.

alter table public.homestay_images
add column if not exists storage_path text,
add column if not exists sort_order integer default 0,
add column if not exists updated_at timestamp with time zone default now();

-- Ensure storage bucket 'homestay-images' is initialized.
insert into storage.buckets (id, name, public)
values ('homestay-images', 'homestay-images', true)
on conflict (id) do nothing;


-- ============================================================
-- MIGRATION: 202605280001_profile_enhancements.sql
-- ============================================================

-- Migration: 202605280001_profile_enhancements.sql
-- Add profile enhancements for StaySaga (My Account page features)

-- 1. Add preferences JSONB to public.profiles table
alter table public.profiles
add column if not exists preferences jsonb default '{}'::jsonb;

-- 2. Create support_tickets table
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  subject text not null,
  message text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on support_tickets
alter table public.support_tickets enable row level security;

-- Policies for support_tickets
create policy "Users can view their own tickets"
  on public.support_tickets for select
  using (auth.uid() = user_id or coalesce((select role from public.profiles where id = auth.uid()), 'USER') = 'ADMIN');

create policy "Users can insert their own tickets"
  on public.support_tickets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tickets or admin"
  on public.support_tickets for update
  using (auth.uid() = user_id or coalesce((select role from public.profiles where id = auth.uid()), 'USER') = 'ADMIN');

-- 3. Create travel_companions table
create table if not exists public.travel_companions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text not null,
  date_of_birth date,
  phone text,
  created_at timestamptz not null default now()
);

-- Enable RLS on travel_companions
alter table public.travel_companions enable row level security;

-- Policies for travel_companions (only own user can manage)
create policy "Users can view their own companions"
  on public.travel_companions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own companions"
  on public.travel_companions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own companions"
  on public.travel_companions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own companions"
  on public.travel_companions for delete
  using (auth.uid() = user_id);

-- 4. Create privacy_requests table
create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('DOWNLOAD_DATA', 'DELETE_ACCOUNT', 'CONSENT_REVOKE')),
  status text not null default 'PENDING' check (status in ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED')),
  created_at timestamptz not null default now()
);

-- Enable RLS on privacy_requests
alter table public.privacy_requests enable row level security;

-- Policies for privacy_requests
create policy "Users can view their own privacy requests"
  on public.privacy_requests for select
  using (auth.uid() = user_id or coalesce((select role from public.profiles where id = auth.uid()), 'USER') = 'ADMIN');

create policy "Users can insert their own privacy requests"
  on public.privacy_requests for insert
  with check (auth.uid() = user_id);

create policy "Admins can manage all privacy requests"
  on public.privacy_requests for all
  using (coalesce((select role from public.profiles where id = auth.uid()), 'USER') = 'ADMIN');

-- 5. Create payment_methods table (Safe demo credit card info)
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null, -- e.g. 'Visa', 'Mastercard', 'PayPal'
  brand text not null, -- e.g. 'Visa', 'Mastercard', etc.
  last4 text not null check (length(last4) = 4),
  expiry_month int not null check (expiry_month >= 1 and expiry_month <= 12),
  expiry_year int not null check (expiry_year >= 2020),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS on payment_methods
alter table public.payment_methods enable row level security;

-- Policies for payment_methods (Strictly only the user can read/write their own cards)
create policy "Users can view their own payment methods"
  on public.payment_methods for select
  using (auth.uid() = user_id);

create policy "Users can insert their own payment methods"
  on public.payment_methods for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own payment methods"
  on public.payment_methods for update
  using (auth.uid() = user_id);

create policy "Users can delete their own payment methods"
  on public.payment_methods for delete
  using (auth.uid() = user_id);


-- ============================================================
-- MIGRATION: 202605280002_add_delete_request_reason.sql
-- ============================================================

-- Add delete request columns to public.homestays if they don't exist
alter table public.homestays
  add column if not exists delete_requested_at timestamptz,
  add column if not exists delete_request_reason text;


