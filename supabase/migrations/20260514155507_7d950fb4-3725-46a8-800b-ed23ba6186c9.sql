-- Bootstrap admin function: promote current user to admin only if no admin exists yet.
-- Allows the very first user to become admin from the UI; subsequent calls are no-ops.
create or replace function public.bootstrap_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  has_admin boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  select exists(select 1 from public.user_roles where role = 'admin') into has_admin;
  if has_admin then
    return false;
  end if;
  insert into public.user_roles (user_id, role) values (auth.uid(), 'admin')
    on conflict do nothing;
  return true;
end;
$$;

-- Allow admins to validate GP docs and verifications via UPDATE
-- (already covered by gp_documents.docs_update_own_or_admin and gp_verification.verif_admin_manage)

-- Helper RPC: admin KPIs
create or replace view public.admin_kpis as
select
  (select count(*) from public.profiles) as users_count,
  (select count(*) from public.user_roles where role in ('gp_standard','gp_express')) as gp_count,
  (select count(*) from public.gp_verification where status = 'pending') as gp_pending,
  (select count(*) from public.reservations) as reservations_count,
  (select coalesce(sum(amount),0) from public.payments where status = 'succeeded') as gmv,
  (select count(*) from public.payments where status = 'pending') as payments_pending,
  (select count(*) from public.announcements where active = true) as active_announcements;

-- View accessible only to admins via SECURITY INVOKER (default) — base tables already enforce admin RLS.
grant select on public.admin_kpis to authenticated;