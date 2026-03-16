

# Replace Bounce Rate with "Engagement Rate" in Website Analytics

## What changes
Replace the "Bounce Rate" KPI card with **"Engagement Rate"** — a more positive, client-friendly metric. Engagement Rate = percentage of sessions with more than 1 pageview (essentially `100% - bounceRate`). This aligns with Google Analytics 4's shift away from bounce rate toward engagement-based metrics.

## Why it's better for clients
- Bounce Rate is negative framing ("how many people left") — confusing and discouraging for clients
- Engagement Rate is positive framing ("how many people explored your site") — intuitive and motivating
- Higher = better, which is easier for clients to understand

## Files to change

### 1. `src/components/department/WebsiteAnalyticsTab.tsx`
- In `calcKPIs`: compute `engagementRate = 100 - bounceRate` (round to 1 decimal)
- Replace the Bounce Rate `StatsCard` with `title="Engagement Rate"`, show `engagementRate%`, use a positive icon like `TrendingUp` instead of `TrendingDown`
- Flip the `pctChange` call: remove `invertBetter` flag since higher engagement is naturally positive

### 2. `src/hooks/useWebsiteKPIs.ts`
- Rename `bounceRate`/`bounceRatePrev` to `engagementRate`/`engagementRatePrev` in the interface and calculation (`100 - bounceRate`)
- This hook is used by the Website department overview cards

### 3. `src/components/department/DepartmentOverview.tsx` (if it references bounce rate)
- Update any KPI card label from "Bounce Rate" to "Engagement Rate" and flip the value

