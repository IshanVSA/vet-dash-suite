

## Problem

When switching clinics in the Google Ads department, Alma's analytics numbers appear for every clinic. The root cause: `useGoogleAdsKPIs` only resets `hasData` to `false` when no data is found, but doesn't reset the actual metric values (`clicks`, `cost`, `conversions`, `ctr`, `dailyTrend`, `campaigns`). The KPI cards display values based on `adsData.loading` only — they don't check `adsData.hasData` before showing numbers.

## Changes

### File: `src/hooks/useGoogleAdsKPIs.ts`

Reset all metric values to zero when `clinicId` changes or when no data is found, instead of only flipping `hasData: false`:

- In the `setState` call when no data is returned, reset all fields: `clicks: 0, impressions: 0, cost: 0, conversions: 0, ctr: 0, dailyTrend: [], campaigns: []`
- Also reset at the start of the fetch (when setting `loading: true`) to prevent stale data from flashing

### File: `src/pages/GoogleAdsDepartment.tsx`

Add `hasData` guard to KPI values as a safety net — when `!adsData.hasData && !adsData.loading`, show "0" or "—" instead of stale numbers. This is a secondary defense; the hook fix above is the primary one.

