-- Safe upgrade for homestay_images columns and bucket definition.

alter table public.homestay_images
add column if not exists storage_path text,
add column if not exists sort_order integer default 0,
add column if not exists updated_at timestamp with time zone default now();

-- Ensure storage bucket 'homestay-images' is initialized.
insert into storage.buckets (id, name, public)
values ('homestay-images', 'homestay-images', true)
on conflict (id) do nothing;
