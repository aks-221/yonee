
-- Lot 1: locale, ban flag, distance helper
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'fr';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.distance_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
RETURNS double precision LANGUAGE sql IMMUTABLE AS $$
  SELECT 2 * 6371 * asin(
    sqrt(
      sin(radians((lat2 - lat1) / 2)) ^ 2 +
      cos(radians(lat1)) * cos(radians(lat2)) *
      sin(radians((lng2 - lng1) / 2)) ^ 2
    )
  )
$$;

-- update handle_new_user to also set locale based on country
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare
  selected_role public.app_role;
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  cc text := meta->>'country_code';
  loc text := case
    when cc in ('US','GB','CA','AU','NZ','IE','NG','GH','KE','ZA') then 'en'
    else coalesce(meta->>'locale','fr')
  end;
begin
  insert into public.profiles (id, email, full_name, phone, country, country_code, city, address, locale)
  values (new.id, new.email, coalesce(meta->>'full_name',''), meta->>'phone',
    meta->>'country', meta->>'country_code', meta->>'city', meta->>'address', loc)
  on conflict (id) do nothing;

  insert into public.wallets (user_id) values (new.id) on conflict do nothing;

  begin selected_role := coalesce(meta->>'role','client')::public.app_role;
  exception when others then selected_role := 'client'; end;
  if selected_role = 'admin' then selected_role := 'client'; end if;

  insert into public.user_roles (user_id, role) values (new.id, selected_role) on conflict do nothing;

  if (meta->>'also_gp_express')::boolean is true and selected_role = 'gp_standard' then
    insert into public.user_roles (user_id, role) values (new.id, 'gp_express') on conflict do nothing;
  end if;
  if (meta->>'also_gp_standard')::boolean is true and selected_role = 'gp_express' then
    insert into public.user_roles (user_id, role) values (new.id, 'gp_standard') on conflict do nothing;
  end if;

  if selected_role in ('gp_standard','gp_express') then
    insert into public.gp_verification (user_id, status) values (new.id, 'pending') on conflict do nothing;
  end if;
  return new;
end;
$$;

-- ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
