
-- 1. Add columns to content_posts
ALTER TABLE public.content_posts 
ADD COLUMN IF NOT EXISTS workflow_stage text NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS flag_reason text;

-- 2. Create post_comments table
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  visibility text NOT NULL DEFAULT 'all',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Admins see all comments
CREATE POLICY "Admins can view all comments"
ON public.post_comments FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Concierges see all + internal + concierge_only
CREATE POLICY "Concierges can view relevant comments"
ON public.post_comments FOR SELECT
USING (
  has_role(auth.uid(), 'concierge'::app_role)
  AND visibility IN ('all', 'internal', 'concierge_only')
);

-- Clients see only 'all' visibility
CREATE POLICY "Clients can view public comments"
ON public.post_comments FOR SELECT
USING (
  has_role(auth.uid(), 'client'::app_role)
  AND visibility = 'all'
);

-- Admin/Concierge can insert
CREATE POLICY "Admin/concierge can insert comments"
ON public.post_comments FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'concierge'::app_role));

-- Clients can insert 'all' visibility only
CREATE POLICY "Clients can insert public comments"
ON public.post_comments FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'client'::app_role)
  AND visibility = 'all'
  AND user_id = auth.uid()
);

-- 3. Create post_activity_log table
CREATE TABLE public.post_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
  action text NOT NULL,
  actor_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view activity log"
ON public.post_activity_log FOR SELECT
USING (true);

CREATE POLICY "Admin/concierge can insert activity log"
ON public.post_activity_log FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'concierge'::app_role));

-- 4. Create post_workflow table
CREATE TABLE public.post_workflow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE REFERENCES public.content_posts(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'generated',
  sent_to_client_at timestamptz,
  auto_approve_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.post_workflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view workflow"
ON public.post_workflow FOR SELECT
USING (true);

CREATE POLICY "Admin/concierge can insert workflow"
ON public.post_workflow FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'concierge'::app_role));

CREATE POLICY "Admin/concierge can update workflow"
ON public.post_workflow FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'concierge'::app_role));

-- Trigger for updated_at on post_workflow
CREATE TRIGGER update_post_workflow_updated_at
BEFORE UPDATE ON public.post_workflow
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable pg_cron and pg_net for auto-approval
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
