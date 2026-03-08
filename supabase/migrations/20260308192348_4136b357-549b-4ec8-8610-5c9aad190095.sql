
-- Create storage bucket for department files
INSERT INTO storage.buckets (id, name, public)
VALUES ('department-files', 'department-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload department files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'department-files');

-- Allow authenticated users to view files
CREATE POLICY "Authenticated users can view department files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'department-files');

-- Allow admin/concierge to delete files
CREATE POLICY "Admin and concierge can delete department files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'department-files'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'concierge'::public.app_role)
  )
);
