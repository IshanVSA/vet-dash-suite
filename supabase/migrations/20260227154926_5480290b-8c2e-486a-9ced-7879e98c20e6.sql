-- Clear all content data, keep user_roles, profiles, clinics
DELETE FROM post_activity_log;
DELETE FROM post_comments;
DELETE FROM post_workflow;
DELETE FROM content_posts;
DELETE FROM content_versions;
DELETE FROM content_requests;
DELETE FROM content_calendar;
DELETE FROM calendar_submissions;
DELETE FROM analytics;