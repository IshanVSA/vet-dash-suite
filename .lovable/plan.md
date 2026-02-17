

## Fix: OpenAI API Failure in Content Generation

### Problem
The `generate-content` edge function runs both OpenAI and Claude in parallel. Claude succeeds, but OpenAI fails. The database confirms only a Claude version was saved. The OpenAI API key is likely **invalid, expired, or has insufficient permissions**.

### Root Cause
The OpenAI project-scoped API key (`sk-proj-...`) stored as a secret is being rejected by the OpenAI API. The error is caught but only shown as a generic toast message on the frontend.

### Plan

#### Step 1: Add better error logging to the edge function
- Add `console.error` logs inside the OpenAI/Claude catch blocks so failures appear in edge function logs for debugging
- Log the actual error message from the OpenAI API response

#### Step 2: Update the OpenAI API key
- The current key appears to be invalid. You will need to provide a **new, valid OpenAI API key** from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Once provided, it will be securely stored as a Supabase secret

#### Step 3: Improve frontend error display
- Update the toast message in `IntakeForms.tsx` to show the specific model error message (e.g., "OpenAI error 401: invalid API key") so issues are easier to diagnose in the future

### Technical Details

**Edge function change** (`supabase/functions/generate-content/index.ts`):
- Add `console.error("OpenAI call failed:", err.message)` and `console.error("Claude call failed:", err.message)` in the respective catch handlers
- This ensures errors appear in the Supabase edge function logs

**No database changes required** -- the schema and workflow are working correctly. Claude content was generated and saved successfully.

### Action Needed From You
- Generate a new OpenAI API key from your OpenAI dashboard and share it so it can be updated as a secret
