

## Facebook Insights Dashboard for Clinic Detail

Build a Facebook Insights-style analytics section in the clinic detail page that mirrors the Meta Business Suite overview layout shown in the reference screenshot, using data already collected by the `sync-meta-analytics` edge function.

### What You'll Get

A redesigned Facebook analytics tab with four main insight cards arranged in a 2x2 grid, each showing:

- **Views** -- Total page impressions with a sparkline, follower vs non-follower breakdown
- **Interactions** -- Content interactions (post engagements) with sparkline and breakdown
- **Visits** -- Facebook page visits with sparkline and change indicator
- **Follows** -- New follows, unfollows, net follows with sparkline

Below those, the existing daily trend charts and recent posts section remain.

### Data Mapping

All data is already being synced by the edge function -- no backend changes needed.

| Card | API Metric (already in metrics_json) |
|------|--------------------------------------|
| Views | `reach` (page_impressions), `daily_trends[].impressions` for sparkline |
| Interactions | `post_engagements`, `engagement` (engaged_users), `daily_trends[].engaged_users` |
| Visits | `page_views`, `daily_trends[].page_views` for sparkline |
| Follows | `fan_adds`, `fan_removes`, net = adds - removes, `followers` |

### Technical Details

**New component: `src/components/clinic-detail/FacebookInsightCard.tsx`**
- Reusable card matching the reference design: title, big number, optional sparkline (tiny Recharts LineChart), sub-metrics with change indicators
- Props: `title`, `mainValue`, `mainLabel`, `sparklineData`, `subMetrics[]`

**Modified file: `src/pages/ClinicDetail.tsx`**
- Replace the current rows of plain KPI cards in the Facebook tab with a 2x2 grid of `FacebookInsightCard` components
- Keep the daily trend AreaChart, BarChart, and recent posts sections below
- Extract sparkline data from `daily_trends` array already stored in `metrics_json`

**No backend or edge function changes required** -- all the necessary data (`page_impressions`, `page_engaged_users`, `page_views_total`, `page_fan_adds`, `page_fan_removes`, `daily_trends`) is already being synced and stored.

### Layout

```text
+---------------------------+---------------------------+
|  Views                    |  Interactions             |
|  254.4K  [sparkline]      |  21  [sparkline]          |
|  From followers: 0.2%     |  From followers: 2        |
|  From non-followers: 99.8%|  From non-followers: 19   |
+---------------------------+---------------------------+
|  Visits                   |  Follows                  |
|  139  [sparkline]         |  6  [sparkline]           |
|                           |  Unfollows: 1             |
|                           |  Net follows: 5           |
+---------------------------+---------------------------+
|  Daily Impressions & Engagement (AreaChart)            |
+-------------------------------------------------------+
|  Daily Page Views (BarChart)                           |
+-------------------------------------------------------+
|  Recent Posts Performance                              |
+-------------------------------------------------------+
```

