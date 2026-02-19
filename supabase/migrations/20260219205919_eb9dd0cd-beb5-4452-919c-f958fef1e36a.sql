
-- Drop the overly permissive SELECT policy on clinics
DROP POLICY IF EXISTS "Authenticated users can view clinics" ON public.clinics;

-- Admins can view all clinics
CREATE POLICY "Admins can view all clinics"
ON public.clinics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Concierges can view assigned clinics
CREATE POLICY "Concierges can view assigned clinics"
ON public.clinics
FOR SELECT
USING (has_role(auth.uid(), 'concierge'::app_role) AND assigned_concierge_id = auth.uid());

-- Clients can view their own clinic
CREATE POLICY "Clients can view own clinic"
ON public.clinics
FOR SELECT
USING (has_role(auth.uid(), 'client'::app_role) AND owner_user_id = auth.uid());
