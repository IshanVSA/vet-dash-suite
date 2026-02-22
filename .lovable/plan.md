

# Add Facebook Page Selection to Meta OAuth Flow

## Problem
The Meta OAuth flow works correctly and returns all 13+ Facebook Pages that Vedant manages. However, the code blindly picks `pagesData.data[0]` (the first page in the list), so every clinic gets connected to "Glenn Mountain Animal Hospital" regardless of which clinic it actually is.

## Solution
After the OAuth callback receives the list of pages, redirect the user to a **page selection screen** in the frontend instead of auto-saving the first page. The user picks the correct Facebook Page for that clinic, and then the app saves the selection.

## Implementation Steps

### 1. Update the `meta-oauth` edge function callback
Instead of auto-selecting the first page, redirect to the frontend with the pages data encoded in the URL. The long-lived user token and page tokens will be passed temporarily so the frontend can complete the connection.

- After getting the pages list from `me/accounts`, redirect to:
  `{FRONTEND_URL}/clinics/{clinic_id}?meta_pages={encoded_pages_data}`
- The encoded data will include each page's `id`, `name`, `access_token`, and `category`
- If there's only 1 page, auto-select it (current behavior)

### 2. Create a new `PageSelectionDialog` component
A modal dialog that shows when the `meta_pages` URL parameter is present:
- Displays all available Facebook Pages in a list with name and category
- Each page is a selectable card/radio button
- A "Connect" button saves the selected page

### 3. Create a new `save-meta-page` edge function
A simple endpoint that receives the selected page data and saves it to `clinic_api_credentials`:
- Accepts: `clinic_id`, `page_id`, `page_name`, `page_access_token`
- Also fetches the Instagram Business Account ID for the selected page
- Saves everything to the database (same upsert logic currently in meta-oauth)

### 4. Update `ClinicDetail` page
- Read the `meta_pages` URL parameter on load
- If present, open the `PageSelectionDialog` automatically
- After successful save, clear the URL parameter and refresh the clinic data

---

## Technical Details

### Edge Function Changes (`supabase/functions/meta-oauth/index.ts`)
- In the callback action, after fetching pages, encode the pages list (id, name, category, access_token) as a base64 JSON string
- Redirect to `{FRONTEND_URL}/clinics/{clinic_id}?meta_pages={base64_string}` instead of auto-saving
- Keep the single-page auto-select as an optimization

### New Edge Function (`supabase/functions/save-meta-page/index.ts`)
- POST endpoint accepting `{ clinic_id, page_id, page_name, page_access_token }`
- Fetches Instagram Business Account ID using the page token
- Upserts into `clinic_api_credentials` (same logic as current meta-oauth callback)
- Requires authentication

### New Component (`src/components/clinic-detail/PageSelectionDialog.tsx`)
- Radix Dialog showing available pages
- Each page displayed as a card with name and category
- Confirm button triggers the save-meta-page edge function
- Shows loading state during save
- Closes and triggers refresh on success

### ClinicDetail Page Updates
- Parse `meta_pages` URL parameter using `useSearchParams`
- Decode and pass to `PageSelectionDialog`
- Clean up URL after connection completes

## Security Note
Page access tokens are passed through the URL temporarily. This is acceptable because:
- They are passed via HTTPS
- They are consumed immediately and cleared from the URL
- The save endpoint validates authentication
