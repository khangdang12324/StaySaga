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
