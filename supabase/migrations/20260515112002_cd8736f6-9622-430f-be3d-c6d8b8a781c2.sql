
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- Move the 9 RPCs into the private schema
ALTER FUNCTION public.admin_confirm_topup(uuid)                                                             SET SCHEMA private;
ALTER FUNCTION public.bootstrap_admin()                                                                     SET SCHEMA private;
ALTER FUNCTION public.cancel_reservation(uuid, text)                                                        SET SCHEMA private;
ALTER FUNCTION public.confirm_payment_received(uuid)                                                        SET SCHEMA private;
ALTER FUNCTION public.create_reservation_from_announcement(uuid, numeric, text, text, text, text, text, text) SET SCHEMA private;
ALTER FUNCTION public.gp_advance_reservation(text, text, text)                                              SET SCHEMA private;
ALTER FUNCTION public.gp_review_reservation(uuid, boolean, text)                                            SET SCHEMA private;
ALTER FUNCTION public.request_payout(numeric, text, text)                                                   SET SCHEMA private;
ALTER FUNCTION public.wallet_topup_request(numeric, text, text)                                             SET SCHEMA private;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated;

-- Public SECURITY INVOKER wrappers — same signatures, same names
CREATE OR REPLACE FUNCTION public.admin_confirm_topup(_topup_id uuid)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.admin_confirm_topup(_topup_id) $$;

CREATE OR REPLACE FUNCTION public.bootstrap_admin()
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.bootstrap_admin() $$;

CREATE OR REPLACE FUNCTION public.cancel_reservation(_reservation_id uuid, _reason text DEFAULT NULL)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.cancel_reservation(_reservation_id, _reason) $$;

CREATE OR REPLACE FUNCTION public.confirm_payment_received(_reservation_id uuid)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.confirm_payment_received(_reservation_id) $$;

CREATE OR REPLACE FUNCTION public.create_reservation_from_announcement(
  _announcement_id uuid, _weight_kg numeric, _sender_name text, _sender_phone text,
  _receiver_name text, _receiver_phone text, _receiver_address text, _payment_method text DEFAULT NULL
) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.create_reservation_from_announcement(_announcement_id,_weight_kg,_sender_name,_sender_phone,_receiver_name,_receiver_phone,_receiver_address,_payment_method) $$;

CREATE OR REPLACE FUNCTION public.gp_advance_reservation(_reservation_code text, _action text DEFAULT 'advance', _reason text DEFAULT NULL)
RETURNS public.reservations LANGUAGE sql SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.gp_advance_reservation(_reservation_code,_action,_reason) $$;

CREATE OR REPLACE FUNCTION public.gp_review_reservation(_reservation_id uuid, _accept boolean, _reason text DEFAULT NULL)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.gp_review_reservation(_reservation_id,_accept,_reason) $$;

CREATE OR REPLACE FUNCTION public.request_payout(_amount numeric, _destination text, _account text)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.request_payout(_amount,_destination,_account) $$;

CREATE OR REPLACE FUNCTION public.wallet_topup_request(_amount numeric, _source text, _reference text)
RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path = public, private
AS $$ SELECT private.wallet_topup_request(_amount,_source,_reference) $$;

REVOKE EXECUTE ON FUNCTION public.admin_confirm_topup(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_reservation(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.confirm_payment_received(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_reservation_from_announcement(uuid, numeric, text, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gp_advance_reservation(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gp_review_reservation(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.request_payout(numeric, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.wallet_topup_request(numeric, text, text) FROM PUBLIC, anon;
