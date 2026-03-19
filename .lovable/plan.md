

## Website Health Tab — PageSpeed Insights Integration

### What We're Building
A new "Website Health" tab in the Website department that fetches and displays Google PageSpeed Insights scores (Performance, Accessibility, Best Practices, SEO) for both mobile and desktop strategies. It includes historical tracking by storing results in the database. The tab is hidden from clients — only visible to admin and concierge (team member) roles.

### Architecture

```text
┌─────────────────────────────────────────────┐
│  WebsiteDepartment.tsx                      │
│  ├─ useUserRole() → filter tabs             │
│  ├─ New "Health" tab (admin/concierge only) │
│  └─ <WebsiteHealthTab clinicId={...} />     │
├─────────────────────────────────────────────┤
│  Edge Function: pagespeed-insights          │
│  ├─ Accepts clinic URL + strategy           │
│  ├─ Calls Google PSI API (free, no key req) │
│  ├─ Stores results in pagespeed_scores      │
│  └─ Returns scores to client                │
├─────────────────────────────────────────────┤
│  DB: pagespeed_scores table                 │
│  ├─ clinic_id, strategy, scores (jsonb)     │
│  ├─ recorded_at timestamp                   │
│  └─ RLS: admin/concierge only              │
└─────────────────────────────────────────────┘
```

### Plan

#### 1. Database Migration — `pagespeed_scores` table
Create a new table to store historical PageSpeed results:
- `id` (uuid, PK)
- `clinic_id` (uuid, NOT NULL)
- `strategy` (text — 'mobile' or 'desktop')
- `performance_score` (integer, 0-100)
- `accessibility_score` (integer, 0-100)
- `best_practices_score` (integer, 0-100)
- `seo_score` (integer, 0-100)
- `metrics_json` (jsonb — stores detailed metrics like FCP, LCP, TBT, CLS, SI)
- `recorded_at` (timestamptz, default now())

RLS: SELECT/INSERT for admin and concierge only. No client access.

#### 2. Edge Function — `pagespeed-insights`
- Accepts `{ url: string, clinic_id: string, strategy: "mobile" | "desktop" }`
- Calls the public Google PageSpeed Insights API (`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=...&strategy=...`)
- Extracts Lighthouse category scores + Core Web Vitals (FCP, LCP, TBT, CLS, Speed Index)
- Inserts results into `pagespeed_scores` table
- Returns the scores to the frontend
- Auth: requires authenticated user with admin/concierge role

#### 3. Component — `WebsiteHealthTab.tsx`
- Fetches latest scores from `pagespeed_scores` for the selected clinic
- Displays four circular score gauges (Performance, Accessibility, Best Practices, SEO) for both mobile and desktop in a toggle/tab layout
- Shows Core Web Vitals metrics (FCP, LCP, TBT, CLS) with pass/fail indicators
- Historical chart: line chart showing performance score trend over time using Recharts
- "Run Test" button that invokes the edge function for a fresh scan
- Uses the clinic's `website` field from the `clinics` table as the URL

#### 4. WebsiteDepartment.tsx Updates
- Import `useUserRole` hook
- Conditionally add the "Health" tab to the tabs array only when role is `admin` or `concierge`
- Add the `TabsContent` for the health tab
- Use `Activity` (or `HeartPulse`) icon from lucide-react for the tab

### Technical Details

- The Google PageSpeed Insights API v5 is **free** and does not require an API key for basic usage (though rate-limited). We can optionally use the `GOOGLE_CLIENT_ID` secret if needed for higher quotas.
- Score color coding: 0-49 red, 50-89 amber, 90-100 green (matching Google's convention)
- The edge function handles both fetching and storing, keeping the frontend simple
- Historical data query limited to last 30 records per strategy to keep charts readable

