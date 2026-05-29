-- Fix: Add PARTNER to user_role enum and update migration
-- The migration 202605170001 attempted text constraints but the column is an enum type

-- Step 1: Add PARTNER to the existing enum (if not already there)
DO $$
BEGIN
  -- Check if PARTNER already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role'
    AND e.enumlabel = 'PARTNER'
  ) THEN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'PARTNER';
  END IF;
END$$;

-- Step 2: Add USER to the enum if not there  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role'
    AND e.enumlabel = 'USER'
  ) THEN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'USER';
  END IF;
END$$;

-- Step 3: Migrate existing data: host → PARTNER, guest → USER, admin → ADMIN  
UPDATE public.profiles
SET role = CASE
  WHEN role::text = 'host' THEN 'PARTNER'::user_role
  WHEN role::text = 'guest' THEN 'USER'::user_role
  WHEN role::text = 'admin' THEN 'ADMIN'::user_role
  WHEN role::text = 'HOST' THEN 'PARTNER'::user_role
  WHEN role::text = 'USER' THEN 'USER'::user_role
  WHEN role::text = 'ADMIN' THEN 'ADMIN'::user_role
  ELSE role
END
WHERE role::text IN ('host', 'guest', 'HOST', 'GUEST');

-- Step 4: Set admin account
UPDATE public.profiles
SET role = 'ADMIN'::user_role, status = 'ACTIVE'
WHERE email = 'admin@staysaga.com';
