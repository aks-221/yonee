drop view if exists public.admin_kpis;
create view public.admin_kpis with (security_invoker = true) as
select
  (select count(*) from public.profiles) as users_count,
  (select count(*) from public.user_roles where role in ('gp_standard','gp_express')) as gp_count,
  (select count(*) from public.gp_verification where status = 'pending') as gp_pending,
  (select count(*) from public.reservations) as reservations_count,
  (select coalesce(sum(amount),0) from public.payments where status = 'succeeded') as gmv,
  (select count(*) from public.payments where status = 'pending') as payments_pending,
  (select count(*) from public.announcements where active = true) as active_announcements;
grant select on public.admin_kpis to authenticated;

revoke execute on function public.bootstrap_admin() from public, anon;
grant execute on function public.bootstrap_admin() to authenticated;