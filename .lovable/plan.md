

## Plan: Fix Sidebar Glitch on Navigation

### Problem
When clicking a sidebar link, the entire sidebar visually "glitches" — it appears to briefly shift/resize/flicker. This is caused by the `PageTransition` component using `AnimatePresence mode="wait"`, which unmounts the old page before mounting the new one. During the exit animation, the main content area briefly shrinks (no children rendered), causing a layout reflow that affects the sidebar's sticky positioning.

### Root Cause
- `AnimatePresence mode="wait"` removes old content, then animates in new content
- During the gap, the `<main>` content area loses height momentarily
- The sidebar uses `lg:sticky lg:top-0 lg:h-screen` which can be affected by flex container height changes
- The `transition-all duration-300` on the sidebar also means ANY property change (including subtle layout shifts) gets animated

### Fix (2 changes)

**1. `src/components/DashboardLayout.tsx`** — Change sidebar `transition-all` to only transition `width` and `transform`:
- Replace `transition-all duration-300` with `transition-[width,transform] duration-300` on the `<aside>` element
- This prevents the sidebar from animating any accidental layout shifts

**2. `src/components/PageTransition.tsx`** — Switch from `mode="wait"` to `mode="popLayout"` or simply remove exit animations:
- Change to `mode="popLayout"` so old and new pages can overlap briefly (no content gap)
- Or simpler: remove `AnimatePresence` entirely and just use a fade-in on mount (no exit animation), eliminating the layout gap completely

The recommended approach is both changes together: scope the sidebar transition AND use `mode="popLayout"` with `position: absolute` on exiting elements to prevent layout shifts.

