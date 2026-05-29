create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_site_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_site_settings_updated_at();

alter table public.site_settings enable row level security;

drop policy if exists "admins manage site settings" on public.site_settings;
create policy "admins manage site settings"
on public.site_settings for all
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

insert into public.site_settings (key, value) values
  ('site_name', 'StaySaga'),
  ('hero_title', 'Khám phá những điểm lưu trú tuyệt vời nhất'),
  ('hero_subtitle', 'Đặt homestay, khách sạn và trải nghiệm nghỉ dưỡng theo phong cách Booking/Agoda với giao diện nhẹ, nhanh và rõ ràng.'),
  ('accent_color', 'rose')
on conflict (key) do update set value = excluded.value;
