-- Clean up bad content_posts for clinic 2 (all instagram-only, some with April dates)
-- First delete post_workflow entries
DELETE FROM post_workflow WHERE post_id IN (
  SELECT id FROM content_posts WHERE clinic_id = '1a29880c-07ff-4fd7-bff4-3243fa0275b4' AND workflow_stage = 'sent_to_client'
);

-- Delete post_activity_log entries
DELETE FROM post_activity_log WHERE post_id IN (
  SELECT id FROM content_posts WHERE clinic_id = '1a29880c-07ff-4fd7-bff4-3243fa0275b4' AND workflow_stage = 'sent_to_client'
);

-- Delete the bad content_posts
DELETE FROM content_posts WHERE clinic_id = '1a29880c-07ff-4fd7-bff4-3243fa0275b4' AND workflow_stage = 'sent_to_client';

-- Delete content_versions for the latest request
DELETE FROM content_versions WHERE content_request_id = 'fbebce29-f41d-4f17-ab5c-bb08f8413105';

-- Reset the latest content request to 'generated' so the Regenerate button appears
UPDATE content_requests SET status = 'generated' WHERE id = 'fbebce29-f41d-4f17-ab5c-bb08f8413105';