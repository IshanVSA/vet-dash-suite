CREATE POLICY "Concierges can delete own content_versions"
ON public.content_versions
FOR DELETE
USING (
  has_role(auth.uid(), 'concierge'::app_role)
  AND content_request_id IN (
    SELECT id FROM content_requests WHERE created_by_concierge_id = auth.uid()
  )
);