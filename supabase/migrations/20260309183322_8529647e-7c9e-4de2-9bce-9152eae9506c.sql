
CREATE TABLE public.seo_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  month text NOT NULL,
  domain_authority integer NOT NULL DEFAULT 0,
  backlinks integer NOT NULL DEFAULT 0,
  keywords_top_10 integer NOT NULL DEFAULT 0,
  organic_traffic integer NOT NULL DEFAULT 0,
  top_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, month)
);

ALTER TABLE public.seo_analytics ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated
CREATE POLICY "Authenticated can view seo_analytics"
  ON public.seo_analytics FOR SELECT TO authenticated
  USING (true);

-- INSERT: admin or concierge
CREATE POLICY "Admin/concierge can insert seo_analytics"
  ON public.seo_analytics FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'concierge'::app_role)
  );

-- UPDATE: admin or concierge
CREATE POLICY "Admin/concierge can update seo_analytics"
  ON public.seo_analytics FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'concierge'::app_role)
  );

-- Trigger for updated_at
CREATE TRIGGER update_seo_analytics_updated_at
  BEFORE UPDATE ON public.seo_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
