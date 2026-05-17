
DROP TRIGGER IF EXISTS trg_set_reservation_qr_payload ON public.reservations;
CREATE TRIGGER trg_set_reservation_qr_payload
  BEFORE INSERT ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_reservation_qr_payload();

DROP TRIGGER IF EXISTS trg_notify_reservation_status ON public.reservations;
CREATE TRIGGER trg_notify_reservation_status
  AFTER INSERT OR UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.notify_reservation_status();
