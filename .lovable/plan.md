

## Plan: Add 4 Department Pages (Website, SEO, Google Ads, Social Media)

### What We're Building
Expand from 2 departments (Social Media, Google Ads) to 4 departments (Website, SEO, Google Ads, Social Media). Each department follows the same Pulse-inspired layout from the reference images: tabbed interface with Overview as default, KPI cards, traffic trend chart, team list, services chips, ticket summary, and department-specific extras.

### Department Specifications (from images)

**Website Department** (`/website`)
- Tabs: Overview, Tickets, Analytics, Reports, Uploads
- KPIs: Visitors Today, Bounce Rate, Avg. Session, Pages/Session
- Services: Time Changes, Pop-up Offers, Theme Updates, Add/Remove Team Members, New Forms, Paper-to-Digital Conversion, Price List Updates, 3rd-Party Integrations, Payment Options, Others
- Widgets: Traffic Trend (weekly bar chart), Team, Ticket Summary (Open/In Progress/Completed/Emergency)

**SEO Department** (`/seo`)
- Tabs: Overview, Tickets, SEO Thread, Reports, Uploads
- KPIs: Domain Authority, Backlinks, Keywords Top 10, Organic Traffic
- Services: Backlinking, Ranking Reports, Keyword Research, Manual Work Reports, Search Atlas Integration, SEO Thread Updates, Others
- Widgets: Traffic Trend (monthly bar chart), Team, Ticket Summary, **Top Keywords** list (rank + keyword + position change)

**Google Ads Department** (`/google-ads`) -- replace current placeholder
- Tabs: Overview, Tickets, Analytics, Reports, Uploads
- KPIs: Ad Spend, Clicks, Conversions, CTR
- Services: Dashboard Access, Analytics Review, Monthly Performance Report, Call Volume Issues, Wrong Call Tracking, Campaign Adjustments, Others
- Widgets: Traffic Trend (weekly bar chart), Team, Ticket Summary, **Campaigns** table (Campaign, Spend, Clicks, Conv., CTR)

**Social Media** (`/social`) -- already exists, keep as-is with its current tabs (Overview, Content Requests, Calendar, Intake, Analytics)

### Sidebar Changes (`DashboardLayout.tsx`)

Add Website and SEO to the DEPARTMENTS section:
```
DEPARTMENTS
  Website        /website
  SEO            /seo
  Google Ads     /google-ads
  Social Media   /social  [badge]
```

Add icons: `Globe` for Website, `Search` for SEO.

### New Files to Create

1. **`src/pages/WebsiteDepartment.tsx`** -- tabbed department page
2. **`src/pages/SeoDepartment.tsx`** -- tabbed department page
3. **`src/pages/GoogleAdsDepartment.tsx`** -- tabbed department page (replaces current `/google-ads` pointing to Dashboard)
4. **`src/components/department/DepartmentOverview.tsx`** -- shared overview component that accepts config (KPIs, services, accent color, department-specific widgets)

### Shared Architecture

Create a reusable `DepartmentOverview` component that takes:
- `departmentName`, `accentColor` (orange for Website, teal for SEO, blue for Google Ads)
- `kpis[]` -- array of { label, value, change }
- `services[]` -- string array for chip tags
- `trafficData[]` -- chart data
- `team[]` -- team members
- `ticketSummary` -- { open, inProgress, completed, emergency }
- Optional extra sections (Top Keywords for SEO, Campaigns table for Google Ads)

Each department page wraps `DashboardLayout` and uses `Tabs` with URL params, same pattern as `SocialMedia.tsx`. The Overview tab renders `DepartmentOverview`. Other tabs (Tickets, Reports, Uploads) start as placeholder/coming-soon cards since there's no ticket system yet.

### Files to Modify

1. **`src/components/DashboardLayout.tsx`** -- Add Website, SEO to sidebar DEPARTMENTS for all roles; update `pageTitles` map
2. **`src/App.tsx`** -- Add routes for `/website`, `/seo`; update `/google-ads` to use new `GoogleAdsDepartment` page

### Data Source

For now, KPIs and services will be static/hardcoded per department (matching the Pulse reference), since there's no backend for Website/SEO metrics yet. Google Ads Overview will pull from the existing `google_ads_analytics` table where possible. The ticket summary will show zeros until a ticketing system is built.

### What Stays the Same
- Social Media page remains unchanged with its existing 5 tabs
- MANAGE section unchanged
- All existing functionality preserved

