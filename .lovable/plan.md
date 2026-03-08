

## Plan: Pulse-Style Dashboard with Department Tabs and Reorganized Sidebar

### What We're Building
Restructure the app to use a Pulse-like department model. The sidebar gets department entries (Social Media, Google Ads) that each open a tabbed view. Content Requests, Calendar, Intake, and Analytics all become tabs under "Social Media" instead of separate pages. The MANAGE section stays as-is.

### Sidebar Changes (`DashboardLayout.tsx`)

**Admin sidebar:**
```
OVERVIEW
  Dashboard

DEPARTMENTS
  Social Media  [badge count]
  Google Ads

MANAGE
  Clinics
  Employees
  Clients
  Admin Review
  Settings
```

**Concierge sidebar:** Same but without Employees, Clients, Admin Review.
**Client sidebar:** Dashboard, Social Media (limited tabs), My Clinic.

- Remove separate nav items for Content Calendar, Content Requests, Intake Forms, Analytics
- Add "Social Media" as a single sidebar item that routes to `/social`
- Add "Google Ads" as a sidebar item routing to `/google-ads` (future, or links to clinic analytics)
- Badge on Social Media shows pending content request count

### New Social Media Department Page (`src/pages/SocialMedia.tsx`)

A tabbed page inspired by Pulse, with tabs:
- **Overview** -- KPI cards (total posts, pending review, content requests), traffic/content trend chart, upcoming posts, recent activity, team list (assigned concierges), services summary
- **Content Requests** -- embed existing ContentRequests page content (without DashboardLayout wrapper)
- **Calendar** -- embed existing ContentCalendar content
- **Intake** -- embed existing IntakeForms content
- **Analytics** -- embed existing Analytics content

Uses URL search params (`?tab=overview`) to persist tab state. Each tab renders the core content from existing pages (extract inner content into reusable components).

### Refactor Existing Pages

Extract the inner content (without `<DashboardLayout>` wrapper) from these pages into standalone components:
- `ContentRequests.tsx` -> `ContentRequestsContent.tsx`
- `ContentCalendar.tsx` -> `ContentCalendarContent.tsx`
- `IntakeForms.tsx` -> `IntakeFormsContent.tsx`
- `Analytics.tsx` -> `AnalyticsContent.tsx`

The original page files can either redirect to `/social?tab=X` or be kept as wrappers for backward compatibility.

### Routing Changes (`App.tsx`)

- Add route `/social` -> `SocialMedia` page
- Redirect `/content`, `/content-requests`, `/intake-forms`, `/analytics` to `/social?tab=calendar`, `/social?tab=requests`, `/social?tab=intake`, `/social?tab=analytics`

### Dashboard Page Update

- Keep the dashboard as the overview/home page
- Remove widgets that will now live under Social Media Overview tab (optional -- or keep dashboard as a high-level summary)

### Overview Tab Design (Pulse-inspired)

```text
+------------------+------------------+------------------+------------------+
| TOTAL POSTS      | PENDING REVIEW   | CONTENT REQUESTS | CLINICS ACTIVE   |
| 142              | 5                | 12               | 8                |
| +12.3%           | -2               | +3 this week     |                  |
+------------------+------------------+------------------+------------------+
| CONTENT TREND (bar chart)          | TEAM                               |
| Mon Tue Wed Thu Fri Sat Sun        | Devraj - Concierge                 |
|  ██  ██  ██  ██  ██  ██  ██        | Sarah  - Concierge                 |
+------------------------------------+------------------------------------+
| SERVICES / CONTENT TYPES           | REQUEST SUMMARY                    |
| [Dental] [Wellness] [Promos] ...   | Generated    3                     |
|                                    | Under Review 2                     |
|                                    | Approved     5                     |
|                                    | Completed    12                    |
+------------------------------------+------------------------------------+
```

### Files to Create/Modify

1. **Create** `src/pages/SocialMedia.tsx` -- main tabbed department page
2. **Create** `src/components/social/SocialOverview.tsx` -- overview tab with KPIs, charts, team, request summary
3. **Modify** `src/pages/ContentRequests.tsx` -- extract inner content to a separate component
4. **Modify** `src/pages/ContentCalendar.tsx` -- extract inner content
5. **Modify** `src/pages/IntakeForms.tsx` -- extract inner content
6. **Modify** `src/pages/Analytics.tsx` -- extract inner content
7. **Modify** `src/components/DashboardLayout.tsx` -- restructure sidebar sections
8. **Modify** `src/App.tsx` -- add `/social` route, add redirects
9. **Modify** `src/hooks/usePendingCounts.ts` -- ensure badge works for Social Media nav item

### Technical Details

- Tabs implemented with Radix `Tabs` component (already installed)
- Tab state synced with URL search params via `useSearchParams`
- Each tab lazily renders existing page content components
- No database changes needed
- Sidebar page title map updated to include `/social`
- The Social Media page wraps content in `DashboardLayout`; extracted content components do not

