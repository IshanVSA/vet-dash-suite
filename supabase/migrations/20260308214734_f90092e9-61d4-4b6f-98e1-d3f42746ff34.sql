
CREATE TABLE public.website_pageviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  path text NOT NULL DEFAULT '/',
  referrer text,
  user_agent text,
  session_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast queries by clinic and date
CREATE INDEX idx_website_pageviews_clinic_created ON public.website_pageviews (clinic_id, created_at);
CREATE INDEX idx_website_pageviews_session ON public.website_pageviews (session_id);

-- RLS: public insert (tracking pixel, no auth), authenticated select
ALTER TABLE public.website_pageviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can insert pageviews"
  ON public.website_pageviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view pageviews"
  ON public.website_pageviews
  FOR SELECT
  TO authenticated
  USING (true);
