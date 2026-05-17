-- Backfill: any auth user without any role gets 'client'
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'client'::public.app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL
ON CONFLICT DO NOTHING;

-- Safety trigger: after handle_new_user, ensure at least one role exists
CREATE OR REPLACE FUNCTION public.ensure_user_has_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_user_has_role ON auth.users;
CREATE TRIGGER trg_ensure_user_has_role
AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_has_role();