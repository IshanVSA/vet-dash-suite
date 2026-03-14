

## Summary

Three changes: (1) Rename "Website" to "Website + SEO" everywhere, (2) Add a pill toggle (Website / SEO mode) inside that page, where SEO mode shows all current SEO department content, (3) Replace the standalone SEO department page with a static "AI SEO — Coming Soon" page.

## Changes

### 1. `src/pages/WebsiteDepartment.tsx` — Add pill mode switch

- Add a `mode` state: `"website" | "seo"` (default `"website"`)
- Render a pill/segmented toggle in the header area (next to the title) with two options: **Website** and **SEO**
- When mode is `"website"`: render existing Website tabs and content (unchanged)
- When mode is `"seo"`: render all SEO tabs and content (Overview with SEO KPIs, Tickets, SEO Thread, Reports, Uploads) — import and reuse the same SEO hooks (`useSeoAnalytics`, `useDepartmentTeam("seo")`) and components (`SeoReportsTab`, `TopKeywordsCard`, `UpdateSeoAnalyticsDialog`, etc.) currently in `SeoDepartment.tsx`
- Update page title from "Website" to "Website + SEO"
- The pill switch styling: rounded-full background with two segments, active segment gets `bg-primary text-primary-foreground`, inactive gets `text-muted-foreground`

### 2. `src/pages/SeoDepartment.tsx` — Replace with static "AI SEO" coming soon

- Gut the entire file and replace with a simple `DashboardLayout` wrapper containing a centered "Coming Soon" card (reuse `ComingSoonTab` or similar pattern)
- Title/icon changed to "AI SEO" with a sparkle/bot icon

### 3. `src/components/DashboardLayout.tsx` — Update nav labels

- Change sidebar nav label from `"Website"` to `"Website + SEO"` (in `adminSections`, `conciergeSections`, `clientSections`)
- Change `"SEO"` to `"AI SEO"` with a different icon (e.g., `Sparkles` instead of `Search`)
- Update `pageTitles` accordingly
- Update `departmentServices` key labels if needed

### 4. `src/App.tsx` — No route changes needed

Routes stay the same (`/website` and `/seo`), just the content changes.

### 5. PDF reports / other references

- `SeoReportsTab` and related report components will still work since they're now rendered inside the Website+SEO page when in SEO mode
- No structural changes needed to report generation

