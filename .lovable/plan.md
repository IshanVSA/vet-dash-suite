

## Problem

The Google Ads sync function (`sync-google-ads`) successfully calls the API and inserts analytics records, but all values are 0. The root cause is the same issue previously fixed in `google-oauth`: the `searchStream` endpoint returns **newline-delimited JSON**, not standard JSON. Calling `searchRes.json()` either fails silently or misparses the response, resulting in no rows being processed.

The database confirms 3 sync records for "alma" (clinic `2bdf419c`), all with `{"clicks": 0, "impressions": 0, ...}`.

## Changes

### File: `supabase/functions/sync-google-ads/index.ts`

1. **Replace `.json()` with raw text parsing** -- use the same `parseSearchStream` pattern from the `google-oauth` function:
   - Read response as `.text()` instead of `.json()`
   - Split by newlines, parse each line as JSON
   - Flatten into a single array of batches

2. **Add diagnostic logging** -- log the raw response length and number of parsed results so future debugging is easier

3. **Update `last_google_sync_at`** -- currently this is never set (the DB shows `null`). The update statement runs but may be failing silently. Add error logging for this step.

### Technical Detail

```typescript
// Current (broken):
const searchData = await searchRes.json();

// Fixed:
const rawText = await searchRes.text();
const batches = rawText
  .split("\n")
  .map(l => l.trim())
  .filter(Boolean)
  .flatMap(l => {
    try { return [JSON.parse(l)]; }
    catch { return []; }
  });
console.log(`Parsed ${batches.length} batches from response (${rawText.length} bytes)`);

// Then iterate batches directly instead of wrapping in array
for (const batch of batches) {
  const results = batch.results || [];
  // ... existing aggregation logic
}
```

Also check for top-level error in any batch before aggregation.

### Deployment
The edge function will be auto-deployed after the edit.

