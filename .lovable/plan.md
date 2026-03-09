

## Plan: SEO Lead Editable Analytics

### Problem
SEO department KPIs (Domain Authority, Backlinks, Keywords Top 10, Organic Traffic) and Top Keywords are all hardcoded static data. The SEO Lead needs a way to update these per clinic.

### Approach

#### 1. New Database Table: `seo_analytics`
Store SEO metrics per clinic, updated by the SEO Lead.

```text
seo_analytics
├── id (uuid, PK)
├── clinic_id (uuid, FK → clinics.id, NOT NULL)
├── month (text, e.g. "2026-03")
├── domain_authority (integer)
├── backlinks (integer)
├── keywords_top_10 (integer)
├── organic_traffic (integer)
├── top_keywords (jsonb) — array of {keyword, position, change}
├── updated_by (uuid, FK → auth.users)
├── created_at (timestamptz)
├── updated_at (timestamptz)
└── UNIQUE(clinic_id, month)
```

**RLS Policies:**
- SELECT: authenticated users can read all
- INSERT/UPDATE: allowed for admins OR users who are concierge/SEO Lead (checked via `department_members` or `profiles.team_role = 'SEO Lead'`)

#### 2. New Hook: `useSeoAnalytics`
- Fetches `seo_analytics` rows for the selected clinic, ordered by month
- Returns latest record for KPIs, all records for the traffic trend chart, and top keywords from the latest record
- Provides `upsertSeoAnalytics` mutation function

#### 3. New Component: `UpdateSeoAnalyticsDialog`
- A dialog/sheet accessible from the SEO overview tab
- Shows an "Update Analytics" button (only visible to users with `team_role = 'SEO Lead'` or admin role)
- Form fields: month selector, Domain Authority, Backlinks, Keywords Top 10, Organic Traffic
- A repeatable section for Top Keywords (keyword, position, change)
- On submit, upserts into `seo_analytics` for the selected clinic + month

#### 4. Update `SeoDepartment.tsx`
- Replace hardcoded `kpis`, `trafficData`, and `topKeywords` with data from `useSeoAnalytics`
- Show the "Update Analytics" button in the overview tab header area
- Pass dynamic data to `DepartmentOverview` and `TopKeywordsCard`

### File Changes
| File | Action |
|------|--------|
| Migration SQL | Create `seo_analytics` table with RLS |
| `src/hooks/useSeoAnalytics.ts` | New — fetch + upsert hook |
| `src/components/department/UpdateSeoAnalyticsDialog.tsx` | New — form dialog for SEO Lead |
| `src/pages/SeoDepartment.tsx` | Update — use dynamic data, show update button |

