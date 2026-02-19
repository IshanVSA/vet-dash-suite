
-- Delete all AI-generated and submission data, keeping users + clinics
DELETE FROM public.content_versions;
DELETE FROM public.content_calendar;
DELETE FROM public.content_requests;
DELETE FROM public.content_posts;
DELETE FROM public.calendar_submissions;
DELETE FROM public.analytics;
DELETE FROM public.clinic_api_credentials;
