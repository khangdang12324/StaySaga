alter table public.homestays
  add column if not exists status text not null default 'APPROVED';

alter table public.homestays
  drop constraint if exists homestays_status_check;

alter table public.homestays
  add constraint homestays_status_check
  check (status in ('PENDING', 'APPROVED', 'REJECTED'));

alter table public.homestay_images
  add column if not exists storage_path text;

