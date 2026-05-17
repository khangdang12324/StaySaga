insert into storage.buckets (id, name, public)
values
  ('site-assets', 'site-assets', true),
  ('homestay-images', 'homestay-images', true)
on conflict (id) do nothing;
