-- Add delete request columns to public.homestays if they don't exist
alter table public.homestays
  add column if not exists delete_requested_at timestamptz,
  add column if not exists delete_request_reason text;
