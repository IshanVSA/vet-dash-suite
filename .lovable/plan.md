

## Fix: Facebook Insights Data Not Populating

The dashboard shows all zeros because the Facebook API is **rejecting the insights requests** -- the OAuth token was granted without the required `read_insights` permission scope.

### Root Cause

The current OAuth flow requests only these scopes:
- `pages_show_list` -- lists pages
- `pages_read_engagement` -- basic engagement data
- `business_management` -- business manager access

But the `/{page_id}/insights` endpoint (which provides Views, Interactions, Visits, Fan changes, daily trends) requires the **`read_insights`** scope. Similarly, fetching recent posts with likes/comments requires **`pages_read_user_content`**.

### Fix

**File: `supabase/functions/meta-oauth/index.ts`**
- Add `read_insights` and `pages_read_user_content` to the SCOPES array

**After deploying**, you will need to:
1. Go to the Connections tab for the clinic
2. Click **Disconnect** to remove the current Meta connection
3. Click **Connect with Facebook** again -- this time the OAuth dialog will request the additional permissions
4. Re-select the page and complete the flow
5. Click **Sync Now** to fetch the full insights data

### Why Re-connection Is Required

OAuth tokens are scoped at the time of authorization. The existing token was granted without `read_insights`, so simply updating the code won't fix existing connections. The clinic must re-authorize to get a new token with the expanded permissions.

### Technical Details

```text
Current scopes:
  pages_show_list, pages_read_engagement, business_management

Updated scopes:
  pages_show_list, pages_read_engagement, business_management,
  read_insights, pages_read_user_content
```

Also add better error logging in the sync function so that if the Facebook API returns an error response (like permission denied), it gets logged instead of silently falling back to zeros.
