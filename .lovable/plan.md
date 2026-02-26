

# Add Upcoming Scheduled Posts to Dashboard

## Overview
Add an "Upcoming Scheduled Posts" section to all three dashboard views (Admin, Concierge, Client) showing the next 5-7 posts scheduled in the future with dates, clinic names, platform, and status.

## What You'll See
A new card below the existing KPI/chart sections with a clean list of upcoming posts. Each row shows:
- Post title
- Clinic name
- Platform icon (Facebook/Instagram)
- Scheduled date (formatted as "Mon DD")
- Status badge (draft, scheduled, etc.)
- A "View Calendar" link to jump to the content calendar

If no upcoming posts exist, a friendly empty state message is shown.

## Technical Details

### Data Query
- Query `content_posts` table where `scheduled_date >= today`, ordered by `scheduled_date ASC`, limit 7
- Join with `clinics` table to get clinic names
- For **Concierge**: filter by clinics assigned to them (already handled by RLS)
- For **Client**: filter by clinics they own (already handled by RLS)
- No database changes needed -- RLS policies already allow all roles to SELECT posts

### Files to Modify

1. **`src/components/dashboard/AdminDashboard.tsx`**
   - Add the upcoming posts query to the existing `fetchAll` function
   - Render a new "Upcoming Posts" card after the Content Trend chart, before the Clinics Table
   - Show post title, clinic name, platform icon, date, and status badge

2. **`src/components/dashboard/ConciergeDashboard.tsx`**
   - Add the same upcoming posts query to existing `fetchData`
   - Render the "Upcoming Posts" card after the KPI cards section

3. **`src/components/dashboard/ClientDashboard.tsx`**
   - Add the upcoming posts query to existing `fetchData`
   - Render the "Upcoming Posts" card after the KPI cards, before the clinics list

### Component Design
- Reuses existing `Card`, `Badge`, `Button` components
- Calendar icon header consistent with existing card headers (icon + title + subtitle)
- Each post row: title (truncated), clinic name (muted text), platform icon, date pill, status badge
- "View Calendar" link button in the header
- Empty state with CalendarDays icon and message
- Staggered fade-in animation matching existing dashboard style

