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
