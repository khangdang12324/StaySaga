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
