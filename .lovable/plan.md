

## Plan: Single Model (OpenAI Only) + Simplified Workflow Labels

### Summary
Remove Claude from content generation entirely, keep only OpenAI. Replace "Mark Preferred" with "Send for Review" for the concierge. Simplify the UI since there's only one version (no toggle needed). Keep the existing 5-stage workflow but update labels.

### Changes

**1. Edge Function: `supabase/functions/generate-content/index.ts`**
- Remove the `callClaude` function entirely
- Remove the Claude API key lookup and Claude execution block
- Keep only the OpenAI call
- This means only one `content_version` row is created per request

**2. `src/components/content-requests/ContentRequestCard.tsx`**
- Remove the `ModelToggleView` component (no longer needed with single version)
- Render the single `ContentVersionCard` directly when versions exist
- Rename `onConciergePrefer` prop to `onSendForReview`

**3. `src/components/content-requests/ContentVersionCard.tsx`**
- Remove the "Concierge Pick" badge references
- Change the concierge action button from "Mark Preferred" (with Star icon) to **"Send for Review"** (with a Send/ArrowRight icon)
- Rename `onConciergePrefer` prop to `onSendForReview`
- Remove Claude-specific badge styling
- Simplify the model name badge (just show "AI Generated" or "OpenAI")

**4. `src/pages/ContentRequests.tsx`**
- Rename `setConciergePreferred` to `sendForReview` (same DB logic -- sets `concierge_preferred` flag and status to `concierge_preferred`)
- Update the toast message from "Marked as preferred! Sent to admin for review." to "Sent for review!"
- Update prop names passed to `ContentRequestCard`

**5. `src/pages/AdminReview.tsx`**
- Remove reference to "Client selected: {model_name}" badge since there's only one model now
- Keep everything else the same (final approve logic is unchanged)

**6. Status labels in `ContentRequestCard.tsx`**
- Update `statusConfig`: change `concierge_preferred` label from "Concierge Preferred" to "Under Review"

### Technical Details

- The `concierge_preferred` database column and status value remain unchanged to avoid migrations -- only the UI labels change
- The workflow stages stay the same: `generated` -> `concierge_preferred` -> `admin_approved` -> `client_selected` -> `final_approved`
- The edge function will only produce one version per request, so the toggle switch becomes unnecessary
- No database schema changes needed

### Files to modify
1. `supabase/functions/generate-content/index.ts` -- remove Claude
2. `src/components/content-requests/ContentRequestCard.tsx` -- remove toggle, rename prop
3. `src/components/content-requests/ContentVersionCard.tsx` -- rename button/badge
4. `src/pages/ContentRequests.tsx` -- rename function
5. `src/pages/AdminReview.tsx` -- remove model name badge

