
alter table public.profiles
  add column if not exists bank_name text,
  add column if not exists bank_iban text,
  add column if not exists bank_holder text,
  add column if not exists wave_country text,
  add column if not exists om_country text;

alter table public.reservations
  add column if not exists unlocked boolean not null default false;

create or replace function public.notify_reservation_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare title text;
begin
  if (TG_OP = 'INSERT') then
    insert into public.notifications (user_id, type, title, body)
    values (new.gp_id, 'reservation', 'Nouvelle réservation', 'Réservation #' || new.code || ' à traiter');
    insert into public.notifications (user_id, type, title, body)
    values (new.client_id, 'reservation', 'Réservation créée', 'Code #' || new.code || ' — en attente de paiement');
    return new;
  end if;
  if (new.status is distinct from old.status) then
    title := case new.status
      when 'paid' then 'Paiement confirmé'
      when 'picked_up' then 'Colis pris en charge'
      when 'in_transit' then 'Colis en transit'
      when 'arrived' then 'Colis arrivé'
      when 'delivered' then 'Colis livré'
      when 'rejected' then 'Réservation rejetée'
      when 'cancelled' then 'Réservation annulée'
      when 'refunded' then 'Réservation remboursée'
      else 'Statut mis à jour'
    end;
    insert into public.notifications (user_id, type, title, body)
    values (new.client_id, 'tracking', title, 'Réservation #' || new.code);
    insert into public.notifications (user_id, type, title, body)
    values (new.gp_id, 'tracking', title, 'Réservation #' || new.code);
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_reservation_status on public.reservations;
create trigger trg_notify_reservation_status
after insert or update on public.reservations
for each row execute function public.notify_reservation_status();

create or replace function public.confirm_payment_received(_reservation_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare r public.reservations;
begin
  select * into r from public.reservations where id = _reservation_id;
  if not found then raise exception 'Reservation not found'; end if;
  if r.gp_id <> auth.uid() then raise exception 'Forbidden'; end if;
  if r.status not in ('pending','paid') then return false; end if;
  update public.reservations
    set status = 'paid', paid_at = coalesce(paid_at, now()), unlocked = true
    where id = _reservation_id;
  insert into public.payments (user_id, reservation_id, amount, currency, method, status, paid_at)
  values (r.client_id, r.id, r.amount, r.currency, coalesce(r.payment_method,'manual'), 'paid', now());
  insert into public.wallets (user_id, balance, currency)
  values (r.gp_id, r.amount, r.currency)
  on conflict (user_id) do update set balance = public.wallets.balance + excluded.balance, updated_at = now();
  return true;
end $$;

create or replace function public.request_payout(_amount numeric, _destination text, _account text)
returns uuid language plpgsql security definer set search_path = public as $$
declare bal numeric; cur text; payout_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount <= 0 then raise exception 'Invalid amount'; end if;
  if _destination not in ('wave','om','bank') then raise exception 'Invalid destination'; end if;
  select balance, currency into bal, cur from public.wallets where user_id = auth.uid();
  if bal is null or bal < _amount then raise exception 'Insufficient balance'; end if;
  update public.wallets set balance = balance - _amount, updated_at = now() where user_id = auth.uid();
  insert into public.payouts (user_id, amount, currency, destination, destination_account, status)
  values (auth.uid(), _amount, cur, _destination, _account, 'pending')
  returning id into payout_id;
  insert into public.notifications (user_id, type, title, body)
  values (auth.uid(), 'wallet', 'Demande de retrait envoyée', _amount || ' ' || cur || ' via ' || _destination);
  return payout_id;
end $$;

create table if not exists public.topups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric not null,
  currency text not null default 'XOF',
  source text not null,
  reference text,
  status payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
alter table public.topups enable row level security;
drop policy if exists topup_insert_own on public.topups;
create policy topup_insert_own on public.topups for insert with check (user_id = auth.uid());
drop policy if exists topup_select_own_or_admin on public.topups;
create policy topup_select_own_or_admin on public.topups for select using (user_id = auth.uid() or is_admin(auth.uid()));
drop policy if exists topup_admin_manage on public.topups;
create policy topup_admin_manage on public.topups for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

create or replace function public.wallet_topup_request(_amount numeric, _source text, _reference text)
returns uuid language plpgsql security definer set search_path = public as $$
declare topup_id uuid;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount <= 0 then raise exception 'Invalid amount'; end if;
  insert into public.topups (user_id, amount, source, reference) values (auth.uid(), _amount, _source, _reference)
  returning id into topup_id;
  insert into public.notifications (user_id, type, title, body)
  values (auth.uid(), 'wallet', 'Recharge en attente', _amount || ' XOF via ' || _source);
  return topup_id;
end $$;

create or replace function public.admin_confirm_topup(_topup_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare t public.topups;
begin
  if not is_admin(auth.uid()) then raise exception 'Forbidden'; end if;
  select * into t from public.topups where id = _topup_id;
  if not found or t.status = 'paid' then return false; end if;
  update public.topups set status = 'paid', confirmed_at = now() where id = _topup_id;
  insert into public.wallets (user_id, balance, currency) values (t.user_id, t.amount, t.currency)
    on conflict (user_id) do update set balance = public.wallets.balance + excluded.balance, updated_at = now();
  insert into public.notifications (user_id, type, title, body)
  values (t.user_id, 'wallet', 'Recharge créditée', '+' || t.amount || ' ' || t.currency);
  return true;
end $$;

drop policy if exists ann_photos_select on storage.objects;
create policy ann_photos_select on storage.objects for select using (bucket_id = 'announcement-photos');
drop policy if exists ann_photos_insert on storage.objects;
create policy ann_photos_insert on storage.objects for insert with check (
  bucket_id = 'announcement-photos' and auth.uid()::text = (storage.foldername(name))[1]
);
drop policy if exists ann_photos_delete on storage.objects;
create policy ann_photos_delete on storage.objects for delete using (
  bucket_id = 'announcement-photos' and (auth.uid()::text = (storage.foldername(name))[1] or is_admin(auth.uid()))
);
