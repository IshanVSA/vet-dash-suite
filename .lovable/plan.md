

## Update Google Ads Developer Token

The developer token needs to be updated in Supabase Edge Function secrets.

### Action Required

Update the existing `GOOGLE_ADS_DEVELOPER_TOKEN` secret with the new value: `S7TjGiGZ8jWrG8ypyKah9Q`

This is done in the Supabase dashboard under Edge Function secrets settings.

### After Updating

Once the token is updated, retry the Google Ads OAuth connection flow from any clinic's Connections tab. The `google-oauth` edge function will use the new token when calling `listAccessibleCustomers`, which should resolve the "Could not retrieve your Google Ads accounts" error.

### No Code Changes Required

The edge functions already reference `GOOGLE_ADS_DEVELOPER_TOKEN` from environment variables — only the secret value needs updating.

