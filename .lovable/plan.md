

## Plan: Replace Auto-Polling with Manual Refresh + Per-Request Generating State

### Changes

**1. `src/pages/ContentRequests.tsx`**

- **Remove auto-polling**: Delete `pollingRef`, `startPolling`, `stopPolling`, and the 5-second interval logic.
- **Add a Refresh button** in the header area (next to the title or stats row) that calls `fetchData()` manually. Show a spinning icon while fetching.
- **Track generating state per-request**: Replace the single `generatingMessage` string with a `Set<string>` of request IDs that have no versions yet. When `regenerateContent` is called, add that request ID to the set. After `fetchData`, compute which requests still have no versions and update the set accordingly.
- **Keep the Realtime subscription** (INSERT on `content_versions`) -- this stays as-is so content auto-appears when the edge function finishes.

**2. `src/components/content-requests/ContentRequestCard.tsx`**

- **Accept a new `isGenerating` boolean prop**.
- **When `isGenerating` is true and versions are empty**, show a "AI is generating content..." indicator with a spinner **inside** that specific card, instead of the current "No versions generated yet" empty state.

### Technical Details

**ContentRequests.tsx changes:**
- New state: `const [refreshing, setRefreshing] = useState(false)` for the refresh button spinner.
- New state: `const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set())` -- populated when regenerateContent fires (add requestId) and cleared per-request when fetchData finds versions exist.
- Remove `generatingMessage` state, `pollingRef`, `startPolling`, `stopPolling`.
- Remove the global generating indicator Card. 
- Add a `<Button>` with `RefreshCw` icon in the header that calls fetchData and toggles `refreshing`.
- Pass `isGenerating={generatingIds.has(req.id)}` to each `ContentRequestCard`.

**ContentRequestCard.tsx changes:**
- Add `isGenerating?: boolean` to `ContentRequestCardProps`.
- In the "No versions generated yet" empty state, conditionally render a spinner + "AI is generating content..." message when `isGenerating` is true, otherwise keep the existing "No versions generated yet" text.

