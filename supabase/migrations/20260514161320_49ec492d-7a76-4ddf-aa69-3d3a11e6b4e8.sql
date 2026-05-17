
revoke execute on function public.confirm_payment_received(uuid) from anon, public;
grant execute on function public.confirm_payment_received(uuid) to authenticated;
revoke execute on function public.request_payout(numeric, text, text) from anon, public;
grant execute on function public.request_payout(numeric, text, text) to authenticated;
revoke execute on function public.wallet_topup_request(numeric, text, text) from anon, public;
grant execute on function public.wallet_topup_request(numeric, text, text) to authenticated;
revoke execute on function public.admin_confirm_topup(uuid) from anon, public;
grant execute on function public.admin_confirm_topup(uuid) to authenticated;
revoke execute on function public.bootstrap_admin() from anon, public;
grant execute on function public.bootstrap_admin() to authenticated;
