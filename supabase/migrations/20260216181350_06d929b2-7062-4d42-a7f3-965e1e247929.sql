
-- Add missing columns to clinics
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS assigned_concierge_id uuid REFERENCES auth.users(id);
ALTER TABLE public.clinics RENAME COLUMN owner_id TO owner_user_id;
ALTER TABLE public.clinics RENAME COLUMN name TO clinic_name;

-- Add missing columns to content_posts
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS caption text;
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'IMAGE';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS scheduled_date date;
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS scheduled_time time;
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS compliance_note text;

-- Add missing columns to ai_content
ALTER TABLE public.ai_content ADD COLUMN IF NOT EXISTS month text;
ALTER TABLE public.ai_content ADD COLUMN IF NOT EXISTS version_number integer NOT NULL DEFAULT 1;
ALTER TABLE public.ai_content ADD COLUMN IF NOT EXISTS intake_data jsonb;

-- Add missing columns to calendar_submissions
ALTER TABLE public.calendar_submissions ADD COLUMN IF NOT EXISTS month text;
ALTER TABLE public.calendar_submissions ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id);
ALTER TABLE public.calendar_submissions ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now();
ALTER TABLE public.calendar_submissions ADD COLUMN IF NOT EXISTS admin_notes text;

-- Restructure clinic_api_credentials to match reference
ALTER TABLE public.clinic_api_credentials DROP COLUMN IF EXISTS platform;
ALTER TABLE public.clinic_api_credentials DROP COLUMN IF EXISTS api_key_encrypted;
ALTER TABLE public.clinic_api_credentials DROP COLUMN IF EXISTS api_secret_encrypted;
ALTER TABLE public.clinic_api_credentials ADD COLUMN IF NOT EXISTS meta_page_access_token text;
ALTER TABLE public.clinic_api_credentials ADD COLUMN IF NOT EXISTS meta_page_id text;
ALTER TABLE public.clinic_api_credentials ADD COLUMN IF NOT EXISTS meta_instagram_business_id text;
ALTER TABLE public.clinic_api_credentials ADD COLUMN IF NOT EXISTS google_ads_refresh_token text;
ALTER TABLE public.clinic_api_credentials ADD COLUMN IF NOT EXISTS google_ads_customer_id text;
ALTER TABLE public.clinic_api_credentials ADD COLUMN IF NOT EXISTS google_ads_login_customer_id text;
ALTER TABLE public.clinic_api_credentials ADD COLUMN IF NOT EXISTS last_meta_sync_at timestamptz;
ALTER TABLE public.clinic_api_credentials ADD COLUMN IF NOT EXISTS last_google_sync_at timestamptz;
-- Add unique constraint on clinic_id for upsert support
ALTER TABLE public.clinic_api_credentials ADD CONSTRAINT clinic_api_credentials_clinic_id_unique UNIQUE (clinic_id);

-- Add missing columns to analytics
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS date text;
ALTER TABLE public.analytics ADD COLUMN IF NOT EXISTS metrics_json jsonb DEFAULT '{}';

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Update profiles to set user_id = id for existing rows
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
