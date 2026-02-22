

# Fix Meta OAuth Configuration

## Problem
Two errors from Meta:
1. **Invalid Scopes**: `instagram_basic` and `instagram_manage_insights` have been renamed in newer Meta API versions.
2. **Can't load URL**: The Supabase callback domain is not registered in the Meta App settings.

## Solution

### Part A: User action in Meta Developer Console
You must do these steps manually at [developers.facebook.com](https://developers.facebook.com):

1. Go to your app > **Settings** > **Basic**
2. Add `yuyossgquiyuoqbeenri.supabase.co` to **App Domains**
3. Go to **Facebook Login** (or **Facebook Login for Business**) > **Settings**
4. Add this exact URL to **Valid OAuth Redirect URIs**:
   `https://yuyossgquiyuoqbeenri.supabase.co/functions/v1/meta-oauth?action=callback`
5. Save changes

### Part B: Code fix - Update scopes in edge function
Update `supabase/functions/meta-oauth/index.ts` to replace the deprecated scope names:

- `instagram_basic` becomes `instagram_basic` (keep, but needs to be approved in App Review)
- `instagram_manage_insights` becomes `instagram_manage_insights` (keep, but needs approval)

Actually, the scopes themselves are correct for apps with **Advanced Access**. The real issue is your Meta App is likely in **Development mode** and these permissions need to be added via **App Review** or the app needs to be switched to **Live mode** with the permissions approved.

Alternatively, if you just want it to work in development for now, we remove the Instagram scopes and only request Facebook Page permissions:

**File**: `supabase/functions/meta-oauth/index.ts`

Change the SCOPES constant from:
```
pages_show_list, pages_read_engagement, instagram_basic, instagram_manage_insights
```
To:
```
pages_show_list, pages_read_engagement
```

This will get Facebook Page analytics working immediately. Instagram scopes can be added back once approved in Meta App Review.

### Part C: Redeploy
Redeploy the `meta-oauth` edge function after the scope change.

## Summary of changes
| What | Action |
|------|--------|
| Meta Developer Console | Add domain + redirect URI (manual) |
| `supabase/functions/meta-oauth/index.ts` | Remove Instagram scopes for now |
| Redeploy `meta-oauth` | Automatic |

