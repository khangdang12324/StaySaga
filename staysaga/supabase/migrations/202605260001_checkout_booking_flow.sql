-- Safe upgrade for checkout -> bookings flow.
alter table public.bookings add column if not exists room_id uuid references public.rooms(id) on delete set null;
alter table public.bookings add column if not exists check_in date;
alter table public.bookings add column if not exists check_out date;
alter table public.bookings add column if not exists booking_code text;
alter table public.bookings add column if not exists payment_status text default 'UNPAID';
alter table public.bookings add column if not exists nights integer;
alter table public.bookings add column if not exists price_per_night numeric(12, 2);
alter table public.bookings add column if not exists guest_name text;
alter table public.bookings add column if not exists guest_email text;
alter table public.bookings add column if not exists guest_phone text;
alter table public.bookings add column if not exists special_request text;

update public.bookings
set
  check_in = coalesce(check_in, check_in_date),
  check_out = coalesce(check_out, check_out_date),
  nights = coalesce(nights, greatest(1, check_out_date - check_in_date)),
  price_per_night = coalesce(price_per_night, total_price / nullif(greatest(1, check_out_date - check_in_date), 0)),
  payment_status = coalesce(payment_status, 'UNPAID')
where check_in is null
   or check_out is null
   or nights is null
   or price_per_night is null
   or payment_status is null;

do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where rel.relname = 'bookings'
      and nsp.nspname = 'public'
      and con.contype = 'c'
      and con.conname in ('bookings_status_check', 'bookings_payment_status_check')
  loop
    execute 'alter table public.bookings drop constraint ' || quote_ident(r.conname);
  end loop;
end $$;

alter table public.bookings
  add constraint bookings_status_check
  check (status in ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'));

alter table public.bookings
  add constraint bookings_payment_status_check
  check (payment_status in ('UNPAID', 'PAID', 'PAY_AT_PROPERTY', 'REFUNDED'));

create or replace function public.set_booking_checkout_fields()
returns trigger
language plpgsql
as $$
begin
  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  new.check_in_date := coalesce(new.check_in_date, new.check_in);
  new.check_out_date := coalesce(new.check_out_date, new.check_out);
  new.check_in := coalesce(new.check_in, new.check_in_date);
  new.check_out := coalesce(new.check_out, new.check_out_date);

  if new.nights is null and new.check_in_date is not null and new.check_out_date is not null then
    new.nights := greatest(1, new.check_out_date - new.check_in_date);
  end if;

  if new.price_per_night is null and new.total_price is not null and new.nights is not null and new.nights > 0 then
    new.price_per_night := new.total_price / new.nights;
  end if;

  if new.booking_code is null then
    new.booking_code := 'BK-' || to_char(current_date, 'YYYYMMDD') || '-' || upper(substring(new.id::text from 1 for 4));
  end if;

  new.payment_status := coalesce(new.payment_status, 'UNPAID');
  return new;
end;
$$;

drop trigger if exists trigger_set_booking_code on public.bookings;
drop trigger if exists trigger_set_booking_checkout_fields on public.bookings;
create trigger trigger_set_booking_checkout_fields
before insert or update on public.bookings
for each row
execute function public.set_booking_checkout_fields();

create index if not exists bookings_room_id_idx on public.bookings(room_id);
create index if not exists bookings_check_in_idx on public.bookings(check_in);
create index if not exists bookings_check_out_idx on public.bookings(check_out);
create unique index if not exists bookings_booking_code_unique_idx on public.bookings(booking_code);

drop policy if exists "bookings select relevant" on public.bookings;
drop policy if exists "users read own bookings" on public.bookings;
create policy "bookings select relevant"
on public.bookings for select
using (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
);

drop policy if exists "users create own bookings" on public.bookings;
create policy "users create own bookings"
on public.bookings for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.homestays h
    where h.id = homestay_id
      and h.status = 'APPROVED'
      and h.is_active = true
  )
);

drop policy if exists "users partners admins update relevant bookings" on public.bookings;
drop policy if exists "users and hosts update relevant bookings" on public.bookings;
create policy "users partners admins update relevant bookings"
on public.bookings for update
using (
  (user_id = auth.uid() and status in ('PENDING', 'CONFIRMED'))
  or public.is_admin()
  or exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.homestays h
    where h.id = homestay_id and h.owner_id = auth.uid()
  )
);
