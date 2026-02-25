

## Google Ads Integration -- Implementation Plan

Now that you have the three credentials ready (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_ADS_DEVELOPER_TOKEN), here's the step-by-step build plan.

---

### Step 1: Store the Three Secrets

Use the Lovable secrets tool to securely store:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_ADS_DEVELOPER_TOKEN`

These will be accessible from edge functions via `Deno.env.get()`.

---

### Step 2: Database Migration

Add a `google_ads_account_name` column to `clinic_api_credentials` to store the friendly name of the connected Google Ads account (e.g., "Parkview Vet Clinic").

```sql
ALTER TABLE clinic_api_credentials
ADD COLUMN google_ads_account_name text;
```

---

### Step 3: Create `google-oauth` Edge Function

New file: `supabase/functions/google-oauth/index.ts`

Mirrors the existing `meta-oauth` pattern with three actions:

- **`?action=authorize`** -- Builds a Google OAuth URL with scope `https://www.googleapis.com/auth/adwords`, includes `clinic_id` and `origin` in the `state` parameter, and redirects the user to Google's consent screen. Uses `access_type=offline&prompt=consent` to ensure a refresh token is returned.

- **`?action=callback`** -- Exchanges the authorization code for tokens (including refresh token), then calls `https://googleads.googleapis.com/v18/customers:listAccessibleCustomers` to get all accounts. For each account, fetches the descriptive name via `https://googleads.googleapis.com/v18/customers/{id}`. If one account found, auto-saves credentials to `clinic_api_credentials`. If multiple, encodes the list and redirects to the frontend with `?google_accounts=...` query parameter for selection.

- **`?action=disconnect`** -- Clears `google_ads_refresh_token`, `google_ads_customer_id`, `google_ads_login_customer_id`, `google_ads_account_name`, and `last_google_sync_at` from `clinic_api_credentials`.

---

### Step 4: Create `save-google-account` Edge Function

New file: `supabase/functions/save-google-account/index.ts`

Mirrors `save-meta-page`. Called from the frontend account selection dialog. Accepts `clinic_id`, `customer_id`, `account_name`, `refresh_token`, and `login_customer_id`, then upserts into `clinic_api_credentials`.

---

### Step 5: Create `sync-google-ads` Edge Function

New file: `supabase/functions/sync-google-ads/index.ts`

Mirrors `sync-meta-analytics`:
1. Reads `google_ads_refresh_token`, `google_ads_customer_id`, `google_ads_login_customer_id` from `clinic_api_credentials`
2. Exchanges refresh token for access token via `https://oauth2.googleapis.com/token`
3. Calls `https://googleads.googleapis.com/v18/customers/{customerId}/googleAds:searchStream` with GAQL query:
   ```
   SELECT campaign.name, metrics.clicks, metrics.impressions,
          metrics.cost_micros, metrics.conversions,
          segments.date
   FROM campaign
   WHERE segments.date DURING LAST_30_DAYS
   ```
4. Aggregates totals and daily breakdown, inserts into `analytics` table with `platform: "google_ads"`
5. Updates `last_google_sync_at` timestamp

---

### Step 6: Update `supabase/config.toml`

Add entries for all three new edge functions:
```toml
[functions.google-oauth]
verify_jwt = false

[functions.save-google-account]
verify_jwt = false

[functions.sync-google-ads]
verify_jwt = false
```

---

### Step 7: Create `GoogleAdsConnectionCard` Component

New file: `src/components/clinic-detail/GoogleAdsConnectionCard.tsx`

Matches `MetaConnectionCard` design:
- **Not connected**: Shows "Connect Google Ads" button that opens the OAuth URL
- **Connected**: Shows account name, customer ID, last sync time, "Sync Now" and "Disconnect" buttons

---

### Step 8: Create `GoogleAccountSelectionDialog` Component

New file: `src/components/clinic-detail/GoogleAccountSelectionDialog.tsx`

Matches `PageSelectionDialog` design:
- Radio group list of Google Ads accounts (name + customer ID)
- Search filter
- "Connect Account" button that calls `save-google-account` edge function

---

### Step 9: Update `ClinicDetail.tsx`

Three changes:

**A. Connections tab** -- Replace the manual Google Ads credential input fields (lines 373-386) with the new `GoogleAdsConnectionCard` component.

**B. Google Ads tab** -- Replace the placeholder (lines 338-344) with:
- KPI cards: Total Clicks, Total Impressions, Total Cost (formatted as currency), Total Conversions
- Campaign breakdown table
- Clicks/Impressions daily trend chart (AreaChart)
- Cost trend chart (BarChart)

**C. Account selection dialog** -- Add URL parameter handling for `google_accounts` (same pattern as `meta_pages`), and render `GoogleAccountSelectionDialog` when accounts are available.

