-- Backfill content_posts from the already-approved content version
INSERT INTO public.content_posts (clinic_id, title, caption, platform, content_type, scheduled_date, status, tags, content)
SELECT 
  'f60e12a9-fe78-4cc7-9781-1b3bd8f4d146',
  COALESCE(post->>'hook', post->>'theme', 'Untitled'),
  COALESCE(post->>'caption', post->>'main_copy'),
  LOWER(COALESCE(post->>'platform', 'instagram')),
  UPPER(COALESCE(post->>'content_type', 'IMAGE')),
  CASE WHEN post->>'suggested_date' IS NOT NULL THEN (post->>'suggested_date')::date ELSE NULL END,
  'scheduled',
  ARRAY[post->>'goal_type', post->>'funnel_stage', post->>'service_highlighted'],
  post->>'main_copy'
FROM content_versions,
     jsonb_array_elements(generated_content->'posts') AS post
WHERE id = 'bbee1a5f-1717-4d55-acbc-412839ab46b5';