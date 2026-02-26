-- Delete duplicate content_posts (keep earliest created_at per title+date+platform+clinic)
DELETE FROM post_activity_log WHERE post_id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY title, scheduled_date, platform, clinic_id ORDER BY created_at) as rn 
    FROM content_posts
  ) sub WHERE rn > 1
);

DELETE FROM post_workflow WHERE post_id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY title, scheduled_date, platform, clinic_id ORDER BY created_at) as rn 
    FROM content_posts
  ) sub WHERE rn > 1
);

DELETE FROM post_comments WHERE post_id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY title, scheduled_date, platform, clinic_id ORDER BY created_at) as rn 
    FROM content_posts
  ) sub WHERE rn > 1
);

DELETE FROM content_posts WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY title, scheduled_date, platform, clinic_id ORDER BY created_at) as rn 
    FROM content_posts
  ) sub WHERE rn > 1
);