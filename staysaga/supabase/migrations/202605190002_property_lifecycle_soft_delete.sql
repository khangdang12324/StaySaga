-- Property lifecycle for StaySaga partner/admin management.
-- Soft delete is represented by status = 'DELETED'; records are not hard-deleted.

alter table public.homestays
  add column if not exists status text not null default 'PENDING',
  add column if not exists delete_requested_at timestamptz,
  add column if not exists delete_requested_by uuid references public.profiles(id) on delete set null,
  add column if not exists delete_reason text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists suspended_reason text,
  add column if not exists updated_at timestamptz default now();

update public.homestays
set status = 'APPROVED'
where status is null or status = '';

alter table public.homestays
  drop constraint if exists homestays_status_check;

alter table public.homestays
  add constraint homestays_status_check
  check (
    status in (
      'PENDING',
      'APPROVED',
      'REJECTED',
      'HIDDEN',
      'SUSPENDED',
      'CLOSED_TEMP',
      'DELETE_REQUESTED',
      'DELETED'
    )
  );

drop policy if exists "approved homestays public partner owner admin" on public.homestays;
drop policy if exists "active homestays are public" on public.homestays;

create policy "public reads approved active homestays"
on public.homestays for select
using (
  (status = 'APPROVED' and is_active = true)
  or owner_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "partners update own homestays" on public.homestays;
create policy "partners update own homestays"
on public.homestays for update
using (
  public.is_active_profile()
  and (owner_id = auth.uid() or public.is_admin())
)
with check (
  public.is_active_profile()
  and (
    public.is_admin()
    or (
      owner_id = auth.uid()
      and status in ('PENDING', 'APPROVED', 'CLOSED_TEMP', 'DELETE_REQUESTED', 'HIDDEN')
    )
  )
);

drop policy if exists "partners delete own homestays" on public.homestays;
-- No direct partner delete policy. Deletion is handled as status = DELETED through server actions.
create policy "admins hard delete homestays only"
on public.homestays for delete
using (public.is_admin());
