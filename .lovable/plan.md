

## Fix: Remove Invalid Meta OAuth Scopes

### Problem

Facebook is rejecting the OAuth flow because `read_insights` and `pages_read_user_content` require **Meta App Review** -- a formal approval process with Facebook. Your app is in Development mode, so these scopes are not available.

### Solution

Remove the two invalid scopes from the OAuth request. The remaining approved scopes still provide useful data:

| Approved Scope | What It Provides |
|---|---|
| `pages_show_list` | List of pages the user manages |
| `pages_read_engagement` | Page likes, followers, basic engagement metrics |
| `business_management` | Business Manager page access |

### What Data Will Still Work

With `pages_read_engagement`, the Graph API still returns:
- `fan_count` (page likes), `followers_count`
- Basic page info and fan/follower counts
- Page posts (public data)

What will return zeros without App Review:
- `/insights` endpoint metrics (reach, impressions, page views, daily trends)
- Detailed post engagement breakdowns

### Technical Changes

**File: `supabase/functions/meta-oauth/index.ts`**
- Remove `read_insights` and `pages_read_user_content` from the SCOPES array
- Keep only: `pages_show_list`, `pages_read_engagement`, `business_management`

**File: `supabase/functions/sync-meta-analytics/index.ts`**
- Wrap the insights API calls in graceful error handling so they don't break the sync
- Still attempt to fetch insights (they may work for some app configurations) but fall back to zeros without crashing

After deploying, reconnect Facebook and the OAuth flow will work again. Some insight metrics will show zeros until the Meta App passes App Review for the advanced permissions.

### About Meta App Review

To get full insights data in the future, you would need to:
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Submit your app for review requesting `read_insights` and `pages_read_user_content`
3. Provide a screencast demo and privacy policy
4. Wait for Facebook's approval (can take days to weeks)

This is a Facebook platform requirement, not something we can bypass in code.
