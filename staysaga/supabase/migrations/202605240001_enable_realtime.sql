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
