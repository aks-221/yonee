-- Restrict sensitive SECURITY DEFINER functions to authenticated users only

revoke all on function public.create_reservation_from_announcement(uuid, numeric, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_reservation_from_announcement(uuid, numeric, text, text, text, text, text, text) to authenticated;

revoke all on function public.gp_review_reservation(uuid, boolean, text) from public, anon;
grant execute on function public.gp_review_reservation(uuid, boolean, text) to authenticated;

revoke all on function public.gp_advance_reservation(text, text, text) from public, anon;
grant execute on function public.gp_advance_reservation(text, text, text) to authenticated;

revoke all on function public.cancel_reservation(uuid, text) from public, anon;
grant execute on function public.cancel_reservation(uuid, text) to authenticated;

revoke all on function public.confirm_payment_received(uuid) from public, anon;
grant execute on function public.confirm_payment_received(uuid) to authenticated;

revoke all on function public.wallet_topup_request(numeric, text, text) from public, anon;
grant execute on function public.wallet_topup_request(numeric, text, text) to authenticated;

revoke all on function public.request_payout(numeric, text, text) from public, anon;
grant execute on function public.request_payout(numeric, text, text) to authenticated;

revoke all on function public.admin_confirm_topup(uuid) from public, anon;
grant execute on function public.admin_confirm_topup(uuid) to authenticated;

revoke all on function public.bootstrap_admin() from public, anon;
grant execute on function public.bootstrap_admin() to authenticated;

revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;

revoke all on function public.get_user_roles(uuid) from public, anon;
grant execute on function public.get_user_roles(uuid) to authenticated;

revoke all on function public.set_reservation_qr_payload() from public, anon;
revoke all on function public.notify_reservation_status() from public, anon;
revoke all on function public.handle_new_user() from public, anon;