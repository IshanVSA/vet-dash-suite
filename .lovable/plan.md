
## Fix: Google OAuth Callback Crash

### Problem
The `google-oauth` edge function crashes at the callback stage because the Google Ads API (`listAccessibleCustomers`) returns an HTML error page instead of JSON. Calling `.json()` on HTML throws `SyntaxError: Unexpected token '<'`.

This is likely caused by one of:
1. The developer token having only "Test Account" access level (not approved for production use)
2. The Google Ads API not being enabled in the Google Cloud project

### Root Cause (line 124 in google-oauth/index.ts)
The code does `await customersRes.json()` without first checking if the response is actually JSON.

### Solution
Add defensive response handling throughout the `google-oauth` function to:
1. Check response status and content-type before parsing JSON
2. Log the actual response text when it's not JSON, so we can see the real error
3. Redirect to the clinic page with a descriptive error instead of crashing

### Changes

**File: `supabase/functions/google-oauth/index.ts`**

Wrap the two Google Ads API calls (listAccessibleCustomers and customer detail fetch) with proper error handling:

1. After the `listAccessibleCustomers` fetch (line 124), check `customersRes.ok` and response content-type before calling `.json()`. If not OK, log the response text and redirect with an error.

2. In the customer detail loop (around line 148), similarly guard the `.json()` call with a status check.

This will:
- Prevent the crash
- Log the actual Google error message so we can diagnose the root cause (likely a developer token access level issue)
- Give the user a clean redirect with an error parameter instead of a raw JSON error page

### Technical Details

```typescript
// Before parsing, check response
const customersText = await customersRes.text();
if (!customersRes.ok) {
  console.error("List customers HTTP error:", customersRes.status, customersText);
  return new Response(null, {
    status: 302,
    headers: { Location: `${redirectBase}/clinics/${clinic_id}?error=list_customers` },
  });
}
let customersData;
try {
  customersData = JSON.parse(customersText);
} catch {
  console.error("List customers non-JSON response:", customersText.substring(0, 500));
  return new Response(null, {
    status: 302,
    headers: { Location: `${redirectBase}/clinics/${clinic_id}?error=list_customers` },
  });
}
```

Same pattern for the detail fetch inside the loop.

### Post-Fix: Diagnosing the Real Issue
Once deployed, the edge function logs will show the actual error from Google. Most likely next steps:
- Enable the **Google Ads API** in Google Cloud Console (APIs and Services > Library > search "Google Ads API" > Enable)
- Or upgrade the developer token from Test to Basic access level
