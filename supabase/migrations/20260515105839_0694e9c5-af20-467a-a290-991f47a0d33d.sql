create or replace function public.cancel_reservation(_reservation_id uuid, _reason text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare r public.reservations; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into r from public.reservations where id = _reservation_id for update;
  if not found then raise exception 'Reservation not found'; end if;
  if uid <> r.client_id and uid <> r.gp_id then raise exception 'Forbidden'; end if;
  if r.status not in ('pending','paid') then
    raise exception 'Cancellation not allowed at status %', r.status;
  end if;

  update public.reservations
    set status = 'cancelled',
        cancelled_at = now(),
        rejection_reason = coalesce(_reason, rejection_reason)
    where id = _reservation_id;

  if r.status = 'paid' then
    update public.reservations set status='refunded', refunded_at = now() where id = _reservation_id;
    update public.wallets set balance = greatest(0, balance - r.amount), updated_at = now()
      where user_id = r.gp_id;
    insert into public.wallets (user_id, balance, currency)
      values (r.client_id, r.amount, r.currency)
      on conflict (user_id) do update set balance = public.wallets.balance + excluded.balance, updated_at = now();
    insert into public.payments (user_id, reservation_id, amount, currency, method, status, paid_at)
      values (r.client_id, r.id, r.amount, r.currency, coalesce(r.payment_method,'refund'), 'refunded', now());
  end if;

  insert into public.notifications (user_id, type, title, body)
    values (r.client_id, 'reservation', 'Réservation annulée', 'Code #' || r.code || coalesce(' — ' || _reason, ''));
  insert into public.notifications (user_id, type, title, body)
    values (r.gp_id, 'reservation', 'Réservation annulée', 'Code #' || r.code || coalesce(' — ' || _reason, ''));

  return true;
end $$;