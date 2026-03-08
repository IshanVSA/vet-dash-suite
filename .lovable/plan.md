

## Built-in Website Tracking Pixel

Replace hardcoded website KPIs with real analytics powered by a lightweight tracking script that clinic websites load, reporting page views back to your Supabase database.

### How it works

```text
Clinic Website                    Your Dashboard
┌──────────────┐    POST /track   ┌──────────────────┐
│  Tracking     │ ──────────────► │  Edge Function    │
│  Script       │   {clinic_id,   │  track-pageview   │
│  (1 line JS)  │    path, ref}   │                   │
└──────────────┘                  └────────┬─────────┘
                                           │ INSERT
                                           ▼
                                  ┌──────────────────┐
                                  │ website_pageviews │
                                  │ table (Supabase)  │
                                  └────────┬─────────┘
                                           │ SELECT
                                           ▼
                                  ┌──────────────────┐
                                  │ Website Dept page │
                                  │ (real KPIs)       │
                                  └──────────────────┘
```

### Changes

**1. Database: New `website_pageviews` table**
- `id`, `clinic_id` (uuid), `path` (text), `referrer` (text), `user_agent` (text), `session_id` (text — random per visitor session), `created_at` (timestamptz)
- RLS: public INSERT (no auth — tracking pixel), SELECT for authenticated users

**2. Edge Function: `track-pageview`**
- Public endpoint (verify_jwt = false), accepts POST with `clinic_id`, `path`, `referrer`, `user_agent`, `session_id`
- Validates `clinic_id` exists, inserts row into `website_pageviews`
- CORS enabled for cross-origin requests from clinic websites

**3. Clinic Detail page: "Tracking Setup" card**
- New card on the clinic detail page showing a copyable JS snippet like:
  ```html
  <script src="https://yuyossgquiyuoqbeenri.supabase.co/functions/v1/track-pageview/pixel.js?clinic=CLINIC_ID"></script>
  ```
- Shows tracking status (last event received, total page views)

**4. Website Department: Real KPIs from `website_pageviews`**
- Replace hardcoded KPIs with queries on `website_pageviews` for the selected clinic:
  - **Visitors Today**: count distinct `session_id` for today
  - **Bounce Rate**: sessions with only 1 page view / total sessions
  - **Avg. Session Duration**: time between first and last page view per session
  - **Pages/Session**: total page views / distinct sessions
- Replace hardcoded traffic chart with real daily page view counts (last 7 days)

**5. Edge function also serves the JS pixel**
- GET requests to the function return a small JavaScript file that auto-tracks page views — clinic owners just paste one script tag

### Technical notes
- No external services or API keys needed
- The tracking script generates a random `session_id` stored in `sessionStorage` to group page views per visit
- Change comparisons ("+12.3% vs last week") calculated by comparing current period vs previous period
- No personally identifiable information collected — just paths, referrers, and user agents

