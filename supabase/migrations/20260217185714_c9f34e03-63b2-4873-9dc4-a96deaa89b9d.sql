
-- Content Requests table
CREATE TABLE public.content_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  created_by_concierge_id UUID NOT NULL,
  intake_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'generated',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;

-- Admins see all
CREATE POLICY "Admins can do everything on content_requests"
  ON public.content_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Concierges see requests they created or for clinics assigned to them
CREATE POLICY "Concierges can view own content_requests"
  ON public.content_requests FOR SELECT
  USING (has_role(auth.uid(), 'concierge'::app_role) AND (
    created_by_concierge_id = auth.uid() OR
    clinic_id IN (SELECT id FROM public.clinics WHERE assigned_concierge_id = auth.uid())
  ));

CREATE POLICY "Concierges can insert content_requests"
  ON public.content_requests FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'concierge'::app_role));

CREATE POLICY "Concierges can update content_requests"
  ON public.content_requests FOR UPDATE
  USING (has_role(auth.uid(), 'concierge'::app_role) AND created_by_concierge_id = auth.uid());

-- Clients can see admin-approved requests for their clinics
CREATE POLICY "Clients can view approved content_requests"
  ON public.content_requests FOR SELECT
  USING (has_role(auth.uid(), 'client'::app_role) AND status IN ('admin_approved', 'client_approved') AND
    clinic_id IN (SELECT id FROM public.clinics WHERE owner_user_id = auth.uid()));

CREATE POLICY "Clients can update their content_requests"
  ON public.content_requests FOR UPDATE
  USING (has_role(auth.uid(), 'client'::app_role) AND
    clinic_id IN (SELECT id FROM public.clinics WHERE owner_user_id = auth.uid()));

-- Content Versions table
CREATE TABLE public.content_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_request_id UUID REFERENCES public.content_requests(id) ON DELETE CASCADE NOT NULL,
  model_name TEXT NOT NULL,
  generated_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  concierge_preferred BOOLEAN NOT NULL DEFAULT false,
  admin_approved BOOLEAN NOT NULL DEFAULT false,
  client_selected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can do everything on content_versions"
  ON public.content_versions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Concierges can view/update versions for their requests
CREATE POLICY "Concierges can view content_versions"
  ON public.content_versions FOR SELECT
  USING (has_role(auth.uid(), 'concierge'::app_role) AND
    content_request_id IN (SELECT id FROM public.content_requests WHERE
      created_by_concierge_id = auth.uid() OR
      clinic_id IN (SELECT id FROM public.clinics WHERE assigned_concierge_id = auth.uid())));

CREATE POLICY "Concierges can insert content_versions"
  ON public.content_versions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'concierge'::app_role));

CREATE POLICY "Concierges can update content_versions"
  ON public.content_versions FOR UPDATE
  USING (has_role(auth.uid(), 'concierge'::app_role) AND
    content_request_id IN (SELECT id FROM public.content_requests WHERE created_by_concierge_id = auth.uid()));

-- Clients can view/update versions for approved requests
CREATE POLICY "Clients can view content_versions"
  ON public.content_versions FOR SELECT
  USING (has_role(auth.uid(), 'client'::app_role) AND
    content_request_id IN (SELECT id FROM public.content_requests WHERE
      status IN ('admin_approved', 'client_approved') AND
      clinic_id IN (SELECT id FROM public.clinics WHERE owner_user_id = auth.uid())));

CREATE POLICY "Clients can update content_versions"
  ON public.content_versions FOR UPDATE
  USING (has_role(auth.uid(), 'client'::app_role) AND
    content_request_id IN (SELECT id FROM public.content_requests WHERE
      clinic_id IN (SELECT id FROM public.clinics WHERE owner_user_id = auth.uid())));

-- Content Calendar table
CREATE TABLE public.content_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  content_request_id UUID REFERENCES public.content_requests(id) ON DELETE SET NULL,
  scheduled_date DATE,
  final_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  platform TEXT NOT NULL DEFAULT 'instagram',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on content_calendar"
  ON public.content_calendar FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Concierges can view content_calendar"
  ON public.content_calendar FOR SELECT
  USING (has_role(auth.uid(), 'concierge'::app_role) AND
    clinic_id IN (SELECT id FROM public.clinics WHERE assigned_concierge_id = auth.uid()));

CREATE POLICY "Concierges can insert content_calendar"
  ON public.content_calendar FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'concierge'::app_role));

CREATE POLICY "Concierges can update content_calendar"
  ON public.content_calendar FOR UPDATE
  USING (has_role(auth.uid(), 'concierge'::app_role) AND
    clinic_id IN (SELECT id FROM public.clinics WHERE assigned_concierge_id = auth.uid()));

CREATE POLICY "Clients can view their content_calendar"
  ON public.content_calendar FOR SELECT
  USING (has_role(auth.uid(), 'client'::app_role) AND
    clinic_id IN (SELECT id FROM public.clinics WHERE owner_user_id = auth.uid()));
