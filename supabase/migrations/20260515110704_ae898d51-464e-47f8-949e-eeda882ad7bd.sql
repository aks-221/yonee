-- Secure role-specific flows for announcements and reservations

alter table public.announcements
  add column if not exists status public.verification_status not null default 'pending'::public.verification_status;

create index if not exists idx_announcements_status_active_departure
  on public.announcements (status, active, departure_date);

drop policy if exists profiles_select_public_basic on public.profiles;
drop policy if exists profiles_select_reservation_party on public.profiles;

create policy profiles_select_reservation_party
on public.profiles
for select
using (
  id = auth.uid()
  or public.is_admin(auth.uid())
  or exists (
    select 1 from public.reservations r
    where (r.client_id = auth.uid() and r.gp_id = profiles.id and r.unlocked = true)
       or (r.gp_id = auth.uid() and r.client_id = profiles.id)
  )
);

alter policy ann_select_active_all on public.announcements
using (
  (active = true and status = 'validated'::public.verification_status and departure_date >= current_date)
  or gp_id = auth.uid()
  or public.is_admin(auth.uid())
);

alter policy ann_insert_own_gp on public.announcements
with check (
  gp_id = auth.uid()
  and (
    public.has_role(auth.uid(), 'gp_standard'::public.app_role)
    or public.has_role(auth.uid(), 'gp_express'::public.app_role)
  )
  and (
    (gp_mode = 'standard'::public.gp_mode and public.has_role(auth.uid(), 'gp_standard'::public.app_role))
    or (gp_mode = 'express'::public.gp_mode and public.has_role(auth.uid(), 'gp_express'::public.app_role))
  )
);

alter policy ann_update_own_or_admin on public.announcements
using ((gp_id = auth.uid()) or public.is_admin(auth.uid()))
with check (
  public.is_admin(auth.uid())
  or (
    gp_id = auth.uid()
    and status = 'pending'::public.verification_status
    and (
      (gp_mode = 'standard'::public.gp_mode and public.has_role(auth.uid(), 'gp_standard'::public.app_role))
      or (gp_mode = 'express'::public.gp_mode and public.has_role(auth.uid(), 'gp_express'::public.app_role))
    )
  )
);

drop policy if exists res_update_party_or_admin on public.reservations;
drop policy if exists res_update_admin_only on public.reservations;
create policy res_update_admin_only
on public.reservations
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create or replace function public.set_reservation_qr_payload()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.code is null or length(new.code) = 0 then
    new.code := 'YN-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  end if;
  if new.qr_payload is null or length(new.qr_payload) = 0 then
    new.qr_payload := new.code;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_reservation_qr_payload on public.reservations;
create trigger trg_set_reservation_qr_payload
before insert on public.reservations
for each row
execute function public.set_reservation_qr_payload();

drop trigger if exists trg_notify_reservation_insert_update on public.reservations;
create trigger trg_notify_reservation_insert_update
after insert or update on public.reservations
for each row
execute function public.notify_reservation_status();

create or replace function public.create_reservation_from_announcement(
  _announcement_id uuid,
  _weight_kg numeric,
  _sender_name text,
  _sender_phone text,
  _receiver_name text,
  _receiver_phone text,
  _receiver_address text,
  _payment_method text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  ann public.announcements;
  rid uuid;
  total numeric;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not (
    public.has_role(uid, 'client'::public.app_role)
    or public.has_role(uid, 'supplier'::public.app_role)
    or public.has_role(uid, 'merchant'::public.app_role)
  ) then
    raise exception 'Only clients, suppliers and merchants can book';
  end if;
  if _weight_kg <= 0 then raise exception 'Invalid weight'; end if;

  select * into ann
  from public.announcements
  where id = _announcement_id
    and active = true
    and status = 'validated'::public.verification_status
    and departure_date >= current_date
  for update;

  if not found then raise exception 'Announcement unavailable'; end if;
  if ann.gp_id = uid then raise exception 'Cannot book your own announcement'; end if;
  if ann.remaining_kg < _weight_kg then raise exception 'Insufficient remaining capacity'; end if;

  total := _weight_kg * ann.price_per_kg;

  insert into public.reservations (
    client_id, gp_id, announcement_id, weight_kg, amount, currency, payment_method,
    status, sender_name, sender_phone, receiver_name, receiver_phone, receiver_address,
    from_city, to_city
  ) values (
    uid, ann.gp_id, ann.id, _weight_kg, total, ann.currency, _payment_method,
    'pending'::public.reservation_status, _sender_name, _sender_phone, _receiver_name, _receiver_phone, _receiver_address,
    ann.from_city, ann.to_city
  ) returning id into rid;

  update public.announcements
    set remaining_kg = remaining_kg - _weight_kg
    where id = ann.id;

  return rid;
end;
$$;

create or replace function public.gp_review_reservation(
  _reservation_id uuid,
  _accept boolean,
  _reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into r from public.reservations where id = _reservation_id for update;
  if not found then raise exception 'Reservation not found'; end if;
  if r.gp_id <> auth.uid() then raise exception 'Forbidden'; end if;
  if r.status <> 'pending'::public.reservation_status then
    raise exception 'Review not allowed at status %', r.status;
  end if;

  if _accept then
    update public.reservations set status = 'accepted'::public.reservation_status, accepted_at = now()
    where id = _reservation_id;
  else
    update public.reservations
      set status = 'rejected'::public.reservation_status,
          rejected_at = now(),
          rejection_reason = coalesce(_reason, 'Rejeté par le GP')
    where id = _reservation_id;

    update public.announcements a
      set remaining_kg = least(a.capacity_kg, a.remaining_kg + r.weight_kg)
      where a.id = r.announcement_id;
  end if;
  return true;
end;
$$;

create or replace function public.gp_advance_reservation(
  _reservation_code text,
  _action text default 'advance',
  _reason text default null
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations;
  next_status public.reservation_status;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select * into r from public.reservations
    where upper(code) = upper(trim(_reservation_code)) or qr_payload = trim(_reservation_code)
    for update;
  if not found then raise exception 'Reservation not found'; end if;
  if r.gp_id <> auth.uid() then raise exception 'Forbidden'; end if;

  if _action = 'reject' then
    if r.status not in ('pending','accepted','paid') then raise exception 'Reject not allowed'; end if;
    update public.reservations
      set status = 'rejected'::public.reservation_status,
          rejected_at = now(),
          rejection_reason = coalesce(_reason, 'Rejeté par le GP')
      where id = r.id
      returning * into r;
    update public.announcements a
      set remaining_kg = least(a.capacity_kg, a.remaining_kg + r.weight_kg)
      where a.id = r.announcement_id;
    return r;
  end if;

  if r.status = 'pending' then raise exception 'Payment not confirmed'; end if;

  next_status := case r.status
    when 'accepted'::public.reservation_status then 'picked_up'::public.reservation_status
    when 'paid'::public.reservation_status then 'picked_up'::public.reservation_status
    when 'picked_up'::public.reservation_status then 'in_transit'::public.reservation_status
    when 'in_transit'::public.reservation_status then 'arrived'::public.reservation_status
    when 'arrived'::public.reservation_status then 'delivered'::public.reservation_status
    else null
  end;

  if next_status is null then raise exception 'No next status'; end if;

  update public.reservations
    set status = next_status,
        picked_up_at = case when next_status = 'picked_up' then now() else picked_up_at end,
        in_transit_at = case when next_status = 'in_transit' then now() else in_transit_at end,
        arrived_at = case when next_status = 'arrived' then now() else arrived_at end,
        delivered_at = case when next_status = 'delivered' then now() else delivered_at end
    where id = r.id
    returning * into r;

  return r;
end;
$$;

create or replace function public.cancel_reservation(_reservation_id uuid, _reason text DEFAULT NULL::text)
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
  if uid <> r.client_id and uid <> r.gp_id and not public.is_admin(uid) then raise exception 'Forbidden'; end if;
  if r.status not in ('pending','accepted','paid') then
    raise exception 'Cancellation not allowed at status %', r.status;
  end if;

  update public.reservations
    set status = 'cancelled'::public.reservation_status,
        cancelled_at = now(),
        rejection_reason = coalesce(_reason, rejection_reason)
    where id = _reservation_id;

  update public.announcements a
    set remaining_kg = least(a.capacity_kg, a.remaining_kg + r.weight_kg)
    where a.id = r.announcement_id;

  if r.status = 'paid' then
    update public.reservations set status='refunded'::public.reservation_status, refunded_at = now() where id = _reservation_id;
    update public.wallets set balance = greatest(0, balance - r.amount), updated_at = now()
      where user_id = r.gp_id;
    insert into public.wallets (user_id, balance, currency)
      values (r.client_id, r.amount, r.currency)
      on conflict (user_id) do update set balance = public.wallets.balance + excluded.balance, updated_at = now();
    insert into public.payments (user_id, reservation_id, amount, currency, method, status, paid_at)
      values (r.client_id, r.id, r.amount, r.currency, coalesce(r.payment_method,'refund'), 'refunded'::public.payment_status, now());
  end if;

  insert into public.notifications (user_id, type, title, body)
    values (r.client_id, 'reservation', 'Réservation annulée', 'Code #' || r.code || coalesce(' — ' || _reason, ''));
  insert into public.notifications (user_id, type, title, body)
    values (r.gp_id, 'reservation', 'Réservation annulée', 'Code #' || r.code || coalesce(' — ' || _reason, ''));

  return true;
end;
$$;