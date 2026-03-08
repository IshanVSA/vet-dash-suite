
-- Table to assign users to departments with a department-specific role
CREATE TABLE public.department_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department public.department_type NOT NULL,
  department_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, department)
);

-- RLS policies
ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on department_members"
  ON public.department_members FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view department_members"
  ON public.department_members FOR SELECT
  TO authenticated
  USING (true);
