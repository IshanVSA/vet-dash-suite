

## Google Ads Integration Plan

Since you have a Google Ads Manager (MCC) account that manages all your clients' Google Ads accounts, we can build a flow similar to Meta -- OAuth login, pick the client account, and sync analytics automatically.

### How It Works (Your Perspective)

1. Go to a clinic's **Connections** tab
2. Click **"Connect Google Ads"** -- this opens Google's OAuth login
3. After logging in, you see a list of all client accounts under your MCC
4. Select the correct client account for that clinic
5. Click **"Sync Now"** to pull campaign performance data (clicks, impressions, cost, conversions)
6. View the data in the **Google Ads** tab with charts and KPI cards

---

### Implementation Steps

#### Step 1: Store Required Secrets

Three new Supabase secrets are needed:
- **GOOGLE_ADS_DEVELOPER_TOKEN** -- from your MCC's API Center
- **GOOGLE_CLIENT_ID** -- from Google Cloud Console OAuth credentials
- **GOOGLE_CLIENT_SECRET** -- from Google Cloud Console OAuth credentials

#### Step 2: Create `google-oauth` Edge Function

Mirrors the `meta-oauth` pattern:
- **`?action=authorize`** -- Redirects to Google OAuth consent screen with `https://www.googleapis.com/auth/adwords` scope
- **`?action=callback`** -- Exchanges auth code for refresh token, then fetches all accessible Google Ads customer accounts under the MCC using the Google Ads API `CustomerService.listAccessibleCustomers` endpoint. If one account, auto-select; if multiple, redirect to frontend with encoded account list for selection
- **`?action=disconnect`** -- Clears Google Ads credentials from `clinic_api_credentials`

#### Step 3: Create `sync-google-ads` Edge Function

Similar to `sync-meta-analytics`:
- Reads `google_ads_refresh_token`, `google_ads_customer_id`, `google_ads_login_customer_id` from `clinic_api_credentials`
- Exchanges refresh token for access token via Google OAuth
- Calls Google Ads API (REST) with a GAQL query to fetch last 30 days of campaign metrics: clicks, impressions, cost, conversions, CTR, CPC
- Inserts results into the `analytics` table with `platform: "google_ads"`
- Updates `last_google_sync_at` timestamp

#### Step 4: Create `GoogleAdsConnectionCard` Component

New component in `src/components/clinic-detail/` matching `MetaConnectionCard`:
- Shows "Connect Google Ads" button when not connected
- After connection: shows linked account name/ID, last sync time, Sync Now and Disconnect buttons

#### Step 5: Create `GoogleAccountSelectionDialog` Component

Similar to `PageSelectionDialog` -- shows a list of accessible Google Ads accounts (name + customer ID) for the admin to pick which one maps to the clinic.

#### Step 6: Update Google Ads Tab in `ClinicDetail.tsx`

Replace the placeholder Google Ads tab content with:
- KPI cards: Total Clicks, Total Impressions, Total Cost, Total Conversions
- Campaign-level breakdown table
- Clicks/Impressions trend chart (last 30 days)
- Cost and CPC trend chart

#### Step 7: Update Connections Tab

Replace the manual Google Ads credential input fields with the new `GoogleAdsConnectionCard` component (OAuth-based, same UX as Meta).

#### Step 8: Database Migration

Add `google_ads_account_name` column to `clinic_api_credentials` to store the friendly name of the connected account.

#### Step 9: Config Updates

Add the new edge functions to `supabase/config.toml` with `verify_jwt = false`.

---

### Technical Notes

- The Google Ads REST API endpoint is `https://googleads.googleapis.com/v18/customers/{customerId}/googleAds:searchStream` using GAQL queries
- The MCC's Login Customer ID is sent as the `login-customer-id` header so sub-accounts are accessible
- The Developer Token goes in the `developer-token` header on every API call
- OAuth token refresh uses `https://oauth2.googleapis.com/token` with the stored refresh token

