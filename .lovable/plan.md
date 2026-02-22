

# Meta OAuth + Analytics Sync Implementation

## Step 1: Store Secrets
Request the user to provide their **META_APP_ID** and **META_APP_SECRET** to be stored as Supabase secrets.

## Step 2: Database Migration
Add `meta_page_name` column to `clinic_api_credentials`:
```sql
ALTER TABLE clinic_api_credentials ADD COLUMN meta_page_name text;
```

## Step 3: Create `meta-oauth` Edge Function
**File**: `supabase/functions/meta-oauth/index.ts`

Handles two actions via `?action=` query parameter:

- **authorize**: Receives `clinic_id`, builds Meta OAuth URL with permissions (`pages_show_list`, `pages_read_engagement`, `instagram_basic`, `instagram_manage_insights`), encodes `clinic_id` in `state`, redirects to Meta login.
- **callback**: Exchanges authorization code for long-lived User Access Token, fetches Pages via `/me/accounts` (permanent Page Access Token), fetches Instagram Business Account ID, saves all credentials to `clinic_api_credentials`, redirects user back to the clinic detail page.

## Step 4: Create `sync-meta-analytics` Edge Function
**File**: `supabase/functions/sync-meta-analytics/index.ts`

Authenticated endpoint (admin/concierge only). Accepts `{ clinic_id }` in body.

Fetches:
- **Instagram**: followers count, reach, impressions, engagement from recent media
- **Facebook**: fan count (page likes), page impressions, engaged users

Writes rows to the `analytics` table with platform `instagram` / `facebook` and `metric_type: monthly_summary`. Updates `last_meta_sync_at` on credentials.

## Step 5: Update `supabase/config.toml`
Add function configs with `verify_jwt = false` for both new functions.

## Step 6: Update Connections Tab UI
**File**: `src/pages/ClinicDetail.tsx`

Replace manual Meta token inputs with:
- **Not connected**: "Connect with Facebook" button linking to the OAuth authorize URL
- **Connected**: Show page name, read-only IDs, last synced timestamp, "Sync Now" button, and "Disconnect" button

## Files Changed/Created
| File | Action |
|------|--------|
| `supabase/functions/meta-oauth/index.ts` | Create |
| `supabase/functions/sync-meta-analytics/index.ts` | Create |
| `supabase/config.toml` | Update |
| `src/pages/ClinicDetail.tsx` | Update |
| Database migration | Add `meta_page_name` column |

