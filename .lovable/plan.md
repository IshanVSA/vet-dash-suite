

## Fix: Instagram Business Account Not Detected

### Root Cause

Your Instagram account IS connected to the Facebook Page (confirmed in your screenshot). The problem is that the OAuth token was granted **without the `instagram_basic` scope**, which is required for the Graph API to return the `instagram_business_account` field on the Page object.

Without this scope, the API call at line 28-29 of `save-meta-page/index.ts` returns an empty object for `instagram_business_account`, so the ID is stored as `null`.

### Fix

**File: `supabase/functions/meta-oauth/index.ts`**
- Add `instagram_basic` to the SCOPES array
- This scope is available in Development mode (no App Review needed) for test users

Updated scopes:
```text
pages_show_list, pages_read_engagement, business_management, instagram_basic
```

**File: `supabase/functions/save-meta-page/index.ts`**
- Add logging of the full API response from the `instagram_business_account` lookup so we can debug if it still fails
- Log a clear warning if the IG Business ID is null

### After Deploying

1. Go to the clinic's Connections tab
2. Click **Disconnect** to remove the current Meta connection
3. Click **Connect with Facebook** again -- the OAuth dialog will now request Instagram access
4. Re-select the page and complete the flow
5. The Instagram Business ID should now be detected and saved
6. Click **Sync Now** to fetch Instagram analytics

### Why Re-connection Is Required

The existing token was granted without `instagram_basic`. OAuth tokens are scoped at authorization time, so the clinic must re-authorize to get a new token that includes this permission.

