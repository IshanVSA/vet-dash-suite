
-- Junction table for assigning multiple team members to clinics
CREATE TABLE public.clinic_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clinic_id, user_id)
);

ALTER TABLE public.clinic_team_members ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins full access on clinic_team_members"
  ON public.clinic_team_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can view assignments
CREATE POLICY "Authenticated can view clinic_team_members"
  ON public.clinic_team_members
  FOR SELECT TO authenticated
  USING (true);
