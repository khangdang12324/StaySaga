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
