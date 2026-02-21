
# Advanced Content Calendar + Workflow System - Phase 1

## Overview
Transform the Content Calendar from a simple list into a full Content Operations System with multi-view layout, split-screen inspector, workflow tracking, collaboration (comments), and auto-approval automation.

## Phase 1 Scope
- Split-screen layout (70/30) with persistent inspector panel
- 3 view modes: List (default), Monthly Calendar Grid, Weekly Planning
- Multi-stage workflow tracker on cards + inspector
- Activity timeline log
- Comments system (Admin, Client, Internal Concierge layers)
- 5-day auto-approval countdown with cron job
- Enhanced status colors and UI polish
- Strategy dashboard panel
- Hover quick actions on cards

---

## Database Changes

### New Tables

**1. `post_comments`** - Role-layered commenting system
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | default gen_random_uuid() |
| post_id | uuid (FK -> content_posts) | NOT NULL |
| user_id | uuid | NOT NULL |
| content | text | NOT NULL |
| visibility | text | 'all', 'internal', 'concierge_only' |
| created_at | timestamptz | default now() |

RLS: Admins see all; Concierges see 'all' + 'internal' + 'concierge_only'; Clients see 'all' only.

**2. `post_activity_log`** - Chronological event tracking
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | default gen_random_uuid() |
| post_id | uuid (FK -> content_posts) | NOT NULL |
| action | text | e.g. 'generated', 'approved', 'flagged', 'auto_approved' |
| actor_id | uuid | nullable (null for system events) |
| metadata | jsonb | default '{}' |
| created_at | timestamptz | default now() |

RLS: Authenticated users can SELECT; Admin/Concierge can INSERT.

**3. `post_workflow`** - Tracks workflow stage per post
| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | default gen_random_uuid() |
| post_id | uuid (FK -> content_posts, UNIQUE) | NOT NULL |
| stage | text | 'generated', 'concierge_preferred', 'sent_to_admin', 'admin_approved', 'sent_to_client', 'client_approved', 'auto_approved' |
| sent_to_client_at | timestamptz | nullable, for countdown |
| auto_approve_at | timestamptz | nullable, computed = sent_to_client_at + 5 days |
| updated_at | timestamptz | default now() |

RLS: Authenticated can SELECT; Admin/Concierge can INSERT/UPDATE.

### Schema Modifications

**`content_posts`** - Add columns:
- `workflow_stage` text default 'draft' - denormalized for fast filtering
- `flag_reason` text nullable - reason when post is flagged

---

## New Edge Function

### `auto-approve-posts`
- Triggered by pg_cron every hour
- Queries `post_workflow` for posts where `stage = 'sent_to_client'` AND `auto_approve_at <= now()`
- Updates stage to 'auto_approved', content_posts status to 'approved'
- Logs event in `post_activity_log`
- Requires `pg_cron` and `pg_net` extensions

---

## Frontend Architecture

### New Components

```
src/components/content-calendar/
  ContentCalendarPage.tsx      -- Main orchestrator (replaces current page logic)
  CalendarHeader.tsx           -- Clinic selector, month nav, view toggle, export
  ViewToggle.tsx               -- List / Calendar / Weekly toggle buttons
  StrategyDashboard.tsx        -- Content mix, funnel, pillar charts
  MonthlyProgressBar.tsx       -- "X / Y Fully Approved" progress bar
  
  views/
    ListView.tsx               -- Current card grid (enhanced)
    CalendarGridView.tsx       -- Monthly grid with day cells
    WeeklyPlanningView.tsx     -- Weekly column layout
  
  inspector/
    ContentInspector.tsx       -- Right panel orchestrator
    InspectorPreview.tsx       -- Full post content preview
    WorkflowTracker.tsx        -- Horizontal stage tracker with nodes
    ActivityTimeline.tsx       -- Chronological event list
    CommentsPanel.tsx          -- Role-layered comments
    InspectorActions.tsx       -- Approve/Flag/Duplicate/Regenerate buttons
  
  cards/
    CompactPostCard.tsx        -- 2-line preview card with status border
    WorkflowMiniTracker.tsx    -- Mini horizontal stage indicator on cards
    CountdownBadge.tsx         -- "X Days Remaining" badge
    AutoApprovedBadge.tsx      -- Purple "AUTO APPROVED" badge
  
  QuickActions.tsx             -- Hover overlay: Edit, Approve, Flag, Duplicate, Regenerate
  FlagReasonDialog.tsx         -- Modal for flag reason input
```

### Layout Structure

```text
+----------------------------------------------------------+
| CalendarHeader (clinic, month, view toggle, export, +new) |
+----------------------------------------------------------+
| StrategyDashboard (content mix, funnel, pillar charts)    |
+----------------------------------------------------------+
| MonthlyProgressBar ("12/20 Approved")                     |
+----------------------------------------------------------+
| Filter Tabs                                               |
+-----------------------------------+----------------------+
|                                   |                      |
|  ListView / CalendarGrid /        |  ContentInspector    |
|  WeeklyPlanning (70%)             |  Panel (30%)         |
|                                   |                      |
|  - Click card to select           |  - Post preview      |
|  - Hover for quick actions        |  - Workflow tracker  |
|                                   |  - Activity timeline |
|                                   |  - Comments          |
|                                   |  - Action buttons    |
+-----------------------------------+----------------------+
```

The split uses `react-resizable-panels` (already installed) for the 70/30 layout.

### Workflow Stages and Colors
| Stage | Color | Badge |
|-------|-------|-------|
| Generated | Gray | -- |
| Concierge Preferred | Indigo | -- |
| Sent to Admin | Yellow/Amber | -- |
| Admin Approved | Emerald | -- |
| Sent to Client | Blue | + countdown timer |
| Client Approved | Green | -- |
| Auto Approved | Purple | "AUTO APPROVED" |
| Flagged | Red | -- |

### Card Enhancements
- Colored left border matching workflow stage
- Mini horizontal stage tracker (5 dots/nodes)
- Hover overlay with quick action buttons
- Soft glow on active stage
- Micro-animations on status changes (CSS transitions)

### Strategy Dashboard
- Compact bar charts for Content Mix (Reels/Carousels/Static/Promo/Educational)
- TOFU/MOFU/BOFU funnel distribution
- Content pillar distribution
- Promo vs Education ratio with warning if promo > 40%
- Built with recharts (already installed)

### Comments Implementation
- Three visibility layers: 'all' (everyone), 'internal' (admin + concierge), 'concierge_only'
- Role-based filtering in the UI
- @mention support with simple text parsing (@Admin, @Concierge, @Client)
- Comments displayed in the inspector panel with role badges

---

## Implementation Steps

1. **Database migration**: Create `post_comments`, `post_activity_log`, `post_workflow` tables with RLS policies. Add `workflow_stage` and `flag_reason` columns to `content_posts`.

2. **Auto-approve edge function**: Create `supabase/functions/auto-approve-posts/index.ts`. Enable `pg_cron` and `pg_net` extensions. Schedule hourly cron job.

3. **Build inspector components**: `ContentInspector`, `WorkflowTracker`, `ActivityTimeline`, `CommentsPanel`, `InspectorActions`.

4. **Build view components**: `ListView` (enhanced from current), `CalendarGridView`, `WeeklyPlanningView`.

5. **Build card components**: `CompactPostCard` with colored border, `WorkflowMiniTracker`, `CountdownBadge`, hover quick actions.

6. **Build strategy dashboard**: `StrategyDashboard` with recharts bar charts derived from current month's post data.

7. **Build main page**: Refactor `ContentCalendar.tsx` to use split-screen layout with `ResizablePanelGroup`, view toggle state, and inspector panel.

8. **Wire up workflow logic**: Update status change functions to also update `post_workflow` and insert `post_activity_log` entries.

9. **Flag reason dialog**: `FlagReasonDialog` component that captures reason text before flagging.

10. **Monthly progress bar**: Calculate approved/total ratio and render progress indicator.

---

## Technical Notes

- The split-screen uses `react-resizable-panels` which is already a project dependency
- Strategy charts use `recharts` which is already installed
- All workflow state changes log to `post_activity_log` for full audit trail
- The auto-approve cron uses `pg_cron` + `pg_net` to call the edge function hourly
- Comments RLS uses the existing `has_role()` security definer function
- Dark theme compatibility maintained via Tailwind `text-foreground` / `bg-card` patterns
- Responsive: inspector panel collapses to bottom sheet on mobile
