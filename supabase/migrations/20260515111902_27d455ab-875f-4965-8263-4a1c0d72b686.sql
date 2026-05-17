
-- 1) Fix mutable search_path on distance_km
CREATE OR REPLACE FUNCTION public.distance_km(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
RETURNS double precision LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT 2 * 6371 * asin(
    sqrt(
      sin(radians((lat2 - lat1) / 2)) ^ 2 +
      cos(radians(lat1)) * cos(radians(lat2)) *
      sin(radians((lng2 - lng1) / 2)) ^ 2
    )
  )
$$;

-- 2) Drop broad public SELECT on storage objects for public buckets.
-- Public buckets are still served by their public URL via the CDN.
DROP POLICY IF EXISTS "avatars public read" ON storage.objects;
DROP POLICY IF EXISTS "annphotos public read" ON storage.objects;
DROP POLICY IF EXISTS "ann_photos_select" ON storage.objects;

-- 3) Revoke EXECUTE on internal helpers / trigger functions from end-user roles.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_reservation_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_reservation_qr_payload() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid)              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_roles(uuid)        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_confirm_topup(uuid)   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_admin()           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_reservation(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirm_payment_received(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_reservation_from_announcement(uuid, numeric, text, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gp_advance_reservation(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gp_review_reservation(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.request_payout(numeric, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.wallet_topup_request(numeric, text, text) FROM PUBLIC, anon;
