

## Website Analytics Tab

Replace the "Coming Soon" placeholder in the Website Department's Analytics tab with a full analytics dashboard powered by the existing `website_pageviews` data.

### What it will show

The new `WebsiteAnalyticsTab` component will query `website_pageviews` for the selected clinic (last 30 days) and display:

1. **Summary KPI cards** (top row, 2x2 grid):
   - Total Page Views (current vs previous period)
   - Unique Visitors (distinct session_ids)
   - Bounce Rate (single-page sessions / total)
   - Avg. Session Duration

2. **Daily Traffic chart** (Area chart, last 30 days) — page views per day

3. **Top Pages table** — most visited paths, with view counts and unique visitor counts

4. **Top Referrers table** — referrer domains driving traffic, with counts

5. **Hourly Heatmap or bar chart** — page views by hour of day (helps clinics see peak traffic times)

### Technical approach

- Create `src/components/department/WebsiteAnalyticsTab.tsx`
- Fetch from `website_pageviews` where `clinic_id = selectedClinicId` and `created_at >= 30 days ago`
- All metrics computed client-side from the raw pageview rows (same pattern as `useWebsiteKPIs`)
- Uses existing Recharts components (AreaChart, BarChart) and Card/Table UI components
- Update `WebsiteDepartment.tsx` line 133 to render the new component instead of `ComingSoonTab`
- Show empty state if no clinic selected or no data available

### No database changes needed
All data already exists in `website_pageviews`. This is purely a frontend component.

