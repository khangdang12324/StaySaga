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
