
CREATE TABLE public.pagespeed_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  strategy text NOT NULL,
  performance_score integer NOT NULL DEFAULT 0,
  accessibility_score integer NOT NULL DEFAULT 0,
  best_practices_score integer NOT NULL DEFAULT 0,
  seo_score integer NOT NULL DEFAULT 0,
  metrics_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pagespeed_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/concierge can view pagespeed_scores"
  ON public.pagespeed_scores FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'concierge'::app_role));

CREATE POLICY "Admin/concierge can insert pagespeed_scores"
  ON public.pagespeed_scores FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'concierge'::app_role));

CREATE INDEX idx_pagespeed_scores_clinic_strategy ON public.pagespeed_scores(clinic_id, strategy, recorded_at DESC);
