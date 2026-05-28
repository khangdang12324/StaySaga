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
