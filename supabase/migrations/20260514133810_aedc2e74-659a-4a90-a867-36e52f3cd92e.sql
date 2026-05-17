
-- ============ ENUMS ============
create type public.app_role as enum ('client','merchant','supplier','gp_standard','gp_express','admin');
create type public.verification_status as enum ('pending','validated','rejected');
create type public.reservation_status as enum ('pending','accepted','paid','rejected','picked_up','in_transit','arrived','delivered','cancelled','refunded');
create type public.payment_status as enum ('pending','succeeded','failed','refunded');
create type public.payout_status as enum ('pending','processing','paid','failed');
create type public.gp_mode as enum ('standard','express');
create type public.transport_mode as enum ('air','sea','road');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  whatsapp text,
  avatar_url text,
  country text,
  country_code text,
  city text,
  address text,
  lat double precision,
  lng double precision,
  location_consent boolean not null default false,
  wave_account text,
  om_account text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ============ USER ROLES ============
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = 'admin')
$$;

create or replace function public.get_user_roles(_user_id uuid)
returns setof public.app_role language sql stable security definer set search_path = public as $$
  select role from public.user_roles where user_id = _user_id
$$;

-- ============ GP VERIFICATION ============
create table public.gp_verification (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status public.verification_status not null default 'pending',
  notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gp_verification enable row level security;

create table public.gp_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null,
  file_path text not null,
  status public.verification_status not null default 'pending',
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.gp_documents enable row level security;

-- ============ ANNOUNCEMENTS ============
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  gp_id uuid not null references auth.users(id) on delete cascade,
  gp_mode public.gp_mode not null default 'standard',
  from_country text not null,
  from_country_code text,
  from_flag text,
  from_city text not null,
  from_lat double precision,
  from_lng double precision,
  to_country text not null,
  to_country_code text,
  to_flag text,
  to_city text not null,
  to_lat double precision,
  to_lng double precision,
  departure_date date not null,
  arrival_date date,
  capacity_kg numeric not null,
  remaining_kg numeric not null,
  price_per_kg numeric not null,
  currency text not null default 'XOF',
  transport public.transport_mode not null default 'air',
  notes text,
  photo_urls text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
create index on public.announcements (departure_date);
create index on public.announcements (gp_id);

-- ============ RESERVATIONS ============
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  client_id uuid not null references auth.users(id) on delete cascade,
  gp_id uuid not null references auth.users(id) on delete cascade,
  announcement_id uuid references public.announcements(id) on delete set null,
  weight_kg numeric not null,
  amount numeric not null,
  currency text not null default 'XOF',
  payment_method text,
  status public.reservation_status not null default 'pending',
  rejection_reason text,
  sender_name text,
  sender_phone text,
  receiver_name text,
  receiver_phone text,
  receiver_address text,
  from_city text,
  to_city text,
  qr_payload text,
  accepted_at timestamptz,
  rejected_at timestamptz,
  paid_at timestamptz,
  picked_up_at timestamptz,
  in_transit_at timestamptz,
  arrived_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.reservations enable row level security;
create index on public.reservations (client_id);
create index on public.reservations (gp_id);
create index on public.reservations (status);

-- ============ PAYMENTS ============
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  currency text not null,
  method text not null,
  provider_ref text,
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.payments enable row level security;

-- ============ WALLETS / PAYOUTS ============
create table public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric not null default 0,
  currency text not null default 'XOF',
  updated_at timestamptz not null default now()
);
alter table public.wallets enable row level security;

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null,
  currency text not null default 'XOF',
  destination text not null,
  destination_account text not null,
  status public.payout_status not null default 'pending',
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.payouts enable row level security;

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  type text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

-- ============ GP LIVE LOCATIONS ============
create table public.gp_locations (
  id uuid primary key default gen_random_uuid(),
  gp_id uuid not null references auth.users(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  recorded_at timestamptz not null default now()
);
alter table public.gp_locations enable row level security;
create index on public.gp_locations (reservation_id, recorded_at desc);

-- ============ AUTO-CREATE PROFILE + ROLE + WALLET ON SIGNUP ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  selected_role public.app_role;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, email, full_name, phone, country, country_code, city, address)
  values (
    new.id,
    new.email,
    coalesce(meta->>'full_name', ''),
    meta->>'phone',
    meta->>'country',
    meta->>'country_code',
    meta->>'city',
    meta->>'address'
  ) on conflict (id) do nothing;

  insert into public.wallets (user_id) values (new.id) on conflict do nothing;

  begin
    selected_role := coalesce(meta->>'role', 'client')::public.app_role;
  exception when others then
    selected_role := 'client';
  end;
  -- block self-assigning admin
  if selected_role = 'admin' then selected_role := 'client'; end if;

  insert into public.user_roles (user_id, role) values (new.id, selected_role)
    on conflict do nothing;

  -- if also_gp flag for combo accounts
  if (meta->>'also_gp_express')::boolean is true and selected_role = 'gp_standard' then
    insert into public.user_roles (user_id, role) values (new.id, 'gp_express') on conflict do nothing;
  end if;
  if (meta->>'also_gp_standard')::boolean is true and selected_role = 'gp_express' then
    insert into public.user_roles (user_id, role) values (new.id, 'gp_standard') on conflict do nothing;
  end if;

  -- create pending verification row for GP roles
  if selected_role in ('gp_standard','gp_express') then
    insert into public.gp_verification (user_id, status) values (new.id, 'pending') on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ RLS POLICIES ============
-- profiles
create policy "profiles_select_own_or_admin" on public.profiles for select
  using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "profiles_select_public_basic" on public.profiles for select
  using (true);  -- needed so anyone can see GP names on listings
create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id);
create policy "profiles_admin_all" on public.profiles for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- user_roles
create policy "roles_select_own_or_admin" on public.user_roles for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "roles_admin_manage" on public.user_roles for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- gp_verification
create policy "verif_select_own_or_admin" on public.gp_verification for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "verif_admin_manage" on public.gp_verification for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- gp_documents
create policy "docs_select_own_or_admin" on public.gp_documents for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "docs_insert_own" on public.gp_documents for insert
  with check (user_id = auth.uid());
create policy "docs_update_own_or_admin" on public.gp_documents for update
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "docs_delete_own_or_admin" on public.gp_documents for delete
  using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- announcements
create policy "ann_select_active_all" on public.announcements for select using (true);
create policy "ann_insert_own_gp" on public.announcements for insert
  with check (gp_id = auth.uid() and (public.has_role(auth.uid(),'gp_standard') or public.has_role(auth.uid(),'gp_express')));
create policy "ann_update_own_or_admin" on public.announcements for update
  using (gp_id = auth.uid() or public.is_admin(auth.uid()));
create policy "ann_delete_own_or_admin" on public.announcements for delete
  using (gp_id = auth.uid() or public.is_admin(auth.uid()));

-- reservations
create policy "res_select_party_or_admin" on public.reservations for select
  using (client_id = auth.uid() or gp_id = auth.uid() or public.is_admin(auth.uid()));
create policy "res_insert_client" on public.reservations for insert
  with check (client_id = auth.uid());
create policy "res_update_party_or_admin" on public.reservations for update
  using (client_id = auth.uid() or gp_id = auth.uid() or public.is_admin(auth.uid()));

-- payments
create policy "pay_select_own_or_party_or_admin" on public.payments for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()) or exists(
    select 1 from public.reservations r where r.id = reservation_id and (r.client_id = auth.uid() or r.gp_id = auth.uid())
  ));
create policy "pay_insert_own" on public.payments for insert with check (user_id = auth.uid());
create policy "pay_admin_manage" on public.payments for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- wallets
create policy "wal_select_own_or_admin" on public.wallets for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "wal_admin_manage" on public.wallets for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- payouts
create policy "pout_select_own_or_admin" on public.payouts for select
  using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "pout_insert_own" on public.payouts for insert with check (user_id = auth.uid());
create policy "pout_admin_manage" on public.payouts for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- notifications
create policy "notif_select_own" on public.notifications for select using (user_id = auth.uid());
create policy "notif_update_own" on public.notifications for update using (user_id = auth.uid());
create policy "notif_admin_manage" on public.notifications for all
  using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- gp_locations
create policy "loc_insert_own_gp" on public.gp_locations for insert
  with check (gp_id = auth.uid());
create policy "loc_select_party_or_admin" on public.gp_locations for select
  using (
    gp_id = auth.uid()
    or public.is_admin(auth.uid())
    or exists(select 1 from public.reservations r where r.id = reservation_id and r.client_id = auth.uid())
  );

-- ============ STORAGE BUCKETS ============
insert into storage.buckets (id, name, public) values
  ('avatars','avatars', true),
  ('gp-documents','gp-documents', false),
  ('announcement-photos','announcement-photos', true)
on conflict (id) do nothing;

-- avatars policies (public read, owner write)
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars owner write" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars owner update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars owner delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- gp-documents (private: owner + admin only)
create policy "gpdocs owner read" on storage.objects for select
  using (bucket_id = 'gp-documents' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin(auth.uid())));
create policy "gpdocs owner write" on storage.objects for insert
  with check (bucket_id = 'gp-documents' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "gpdocs owner update" on storage.objects for update
  using (bucket_id = 'gp-documents' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin(auth.uid())));
create policy "gpdocs owner delete" on storage.objects for delete
  using (bucket_id = 'gp-documents' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin(auth.uid())));

-- announcement-photos public
create policy "annphotos public read" on storage.objects for select using (bucket_id = 'announcement-photos');
create policy "annphotos owner write" on storage.objects for insert
  with check (bucket_id = 'announcement-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "annphotos owner update" on storage.objects for update
  using (bucket_id = 'announcement-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "annphotos owner delete" on storage.objects for delete
  using (bucket_id = 'announcement-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- realtime
alter publication supabase_realtime add table public.reservations;
alter publication supabase_realtime add table public.gp_locations;
alter publication supabase_realtime add table public.notifications;
