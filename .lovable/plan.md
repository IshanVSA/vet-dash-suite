

# Content Calendar Rebuild -- Execution Board

A complete rebuild of the Content Calendar page into a minimal, execution-focused scheduling tool with two views, drag-and-drop rescheduling, and a right-side inspector panel.

---

## What Changes

### 1. Two-View Toggle (Monthly + List)

**Monthly View (default)**
- Traditional 7-column grid calendar (Sun-Sat) showing all days of the current month.
- Each date cell displays compact post chips (title, type badge, status dot).
- Posts are draggable to other date cells for rescheduling.

**List View**
- Chronological vertical list sorted by scheduled date ascending.
- Each row shows: title, post type, date/time, platform icon, status badge.
- Clicking a row opens the inspector panel.

A simple toggle (CalendarDays / List icon buttons) sits in the top-right toolbar area.

### 2. Simplified Post Cards

Each post displays only:
- **Title**
- **Post Type** (Reel / Carousel / Static / Story / Video)
- **Scheduled Date and Time**
- **Publishing Status** (Scheduled / Posted / Failed)

Removed from cards:
- Caption preview, Main Copy preview, compliance notes, tags, approval badges, workflow stages

### 3. Status Color System

| Status    | Color  | Badge Class                        |
|-----------|--------|------------------------------------|
| Scheduled | Blue   | `bg-blue-100 text-blue-700`        |
| Posted    | Green  | `bg-green-100 text-green-700`      |
| Failed    | Red    | `bg-red-100 text-red-700`          |

Each card gets a 3px left border in the matching status color.

### 4. Drag-and-Drop Rescheduling (Monthly View)

- Uses native HTML5 drag-and-drop (no extra library needed).
- Cards with `status !== "posted"` are draggable.
- Dropping on a new date cell updates `scheduled_date` in Supabase and shows toast: "Post rescheduled to [New Date]".
- Posted cards have `draggable={false}` and a `cursor-default`.

### 5. Right-Side Inspector Panel

- When a post is clicked, a slide-in panel appears on the right side (using CSS transition, not a modal).
- The main content area shrinks to accommodate the panel (flex layout).

**Inspector contents:**
- Full Caption (read-only if posted)
- Hashtags extracted from tags
- Scheduled Date and Time (editable if not posted)
- Publishing Status (read-only display)
- Platform
- Post Type
- Edit button (saves inline changes)
- Delete button (with confirmation)

**Rules:**
- Posted: all fields read-only, no delete
- Scheduled: fully editable
- Failed: fully editable

### 6. Removed Elements

- KPI summary cards row (Total Posts, Videos, Posted, Pending)
- "Content Cards" section header
- Status filter tabs (All, Scheduled, Flagged, Posted)
- Content type dropdown filter
- Tag badges and compliance note display
- "Mark Posted" confirmation dialog (moved into inspector)
- Export dropdown (kept but simplified)

### 7. Simplified Toolbar

Top bar contains only:
- Clinic selector (existing popover)
- Month navigation (existing arrows)
- View toggle (Monthly / List)
- Export button
- New Post button

---

## Technical Details

### New Files
1. **`src/components/content-calendar/MonthlyView.tsx`** -- Grid calendar component with drag-and-drop date cells
2. **`src/components/content-calendar/ListView.tsx`** -- Chronological list table
3. **`src/components/content-calendar/PostInspector.tsx`** -- Right-side slide-in panel with edit/delete
4. **`src/components/content-calendar/PostChip.tsx`** -- Minimal draggable post card used in both views

### Modified Files
1. **`src/pages/ContentCalendar.tsx`** -- Complete rewrite: remove KPIs, filters, card grid; add view toggle state, inspector state, drag handler, delete handler; layout uses flex with conditional inspector panel
2. **`src/components/content-calendar/EditPostDialog.tsx`** -- Remove tags, compliance note, and approval-related status options; simplify to execution fields only
3. **`src/components/content-calendar/NewPostDialog.tsx`** -- Remove tags, compliance note, status selector; default status to "scheduled"

### Drag-and-Drop Implementation
- Uses `onDragStart`, `onDragOver`, `onDrop` native events
- Each date cell has a `data-date` attribute
- On drop: call `supabase.from("content_posts").update({ scheduled_date: newDate })` and update local state
- Toast confirmation via `sonner`

### Inspector Panel Layout
```text
+---------------------------+----------------+
|                           |                |
|   Monthly/List View       |   Inspector    |
|   (flex-1)                |   (w-[360px])  |
|                           |                |
+---------------------------+----------------+
```
- Panel slides in with `transition-all duration-200`
- Close button at top-right of panel

### Data Query
- Keep existing query but only fetch posts with status in `('scheduled', 'posted', 'failed')` since all posts here are approved
- Add delete functionality: `supabase.from("content_posts").delete().eq("id", postId)`

