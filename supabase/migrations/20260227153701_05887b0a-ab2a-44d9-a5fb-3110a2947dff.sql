-- Update client SELECT policy to also see 'client_selected' and 'final_approved' statuses
DROP POLICY IF EXISTS "Clients can view approved content_requests" ON public.content_requests;
CREATE POLICY "Clients can view approved content_requests"
  ON public.content_requests FOR SELECT
  USING (
    has_role(auth.uid(), 'client'::app_role)
    AND status IN ('admin_approved', 'client_selected', 'final_approved')
    AND clinic_id IN (SELECT id FROM clinics WHERE owner_user_id = auth.uid())
  );