

## Plan: Global New Ticket Dialog + Chat Assistant Slide-Over

### 1. Global New Ticket Dialog

**Problem**: The "New Ticket" quick action dispatches a custom event, but `NewTicketDialog` only lives inside `TicketsTab` on department pages. Clicking it from Dashboard or other pages does nothing.

**Solution**: Add a global `NewTicketDialog` instance inside `DashboardLayout.tsx` that listens for the `open-new-ticket` custom event.

- Add state `globalTicketOpen` and `globalTicketDepartment` to `DashboardLayout`
- Add a department selector step: when clicked, show a small dialog/select letting the user pick which department (Website, SEO, Google Ads, Social Media) before opening the full ticket form
- Listen for the `open-new-ticket` event via `useEffect` to trigger the dialog
- Import and render `NewTicketDialog` at the layout level with the selected department and its services list
- Define a `departmentServices` map in the layout matching the existing per-page service arrays

**Files**: `src/components/DashboardLayout.tsx` (add global dialog + event listener)

### 2. Chat Assistant Slide-Over Panel

**What it is**: A slide-over panel (using shadcn `Sheet`) that opens from the right side when clicking "Chat Assistant" in the sidebar. It provides a simple chat UI for quick support queries.

**Implementation**:
- Create `src/components/chat/ChatAssistant.tsx` — a `Sheet` component containing:
  - Header with title "Chat Assistant" and close button
  - Scrollable message area with mock welcome message
  - Input bar at bottom with send button
  - Messages stored in local state (no backend/AI integration yet — just a placeholder UI that echoes or shows a "coming soon" response)
- Wire the "Chat Assistant" sidebar button in `DashboardLayout` to toggle the sheet open
- Style to match the dark sidebar aesthetic

**Files**:
- Create `src/components/chat/ChatAssistant.tsx`
- Modify `src/components/DashboardLayout.tsx` (add sheet state + trigger)

### Files Summary

| Action | File |
|--------|------|
| Create | `src/components/chat/ChatAssistant.tsx` |
| Modify | `src/components/DashboardLayout.tsx` — global ticket dialog + chat assistant trigger |

