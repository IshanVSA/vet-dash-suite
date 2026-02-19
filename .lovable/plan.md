

## Remove AI Content Engine and Redirect to Content Requests

Since all AI-generated content now lives in the Content Requests workflow, this plan removes the unused AI Content Engine page and its backing database table.

### Changes

**1. Delete `src/pages/AIContent.tsx`**
- Remove the entire file -- it queries the unused `ai_content` table and serves no purpose now.

**2. Update `src/App.tsx`**
- Remove the `AIContent` import.
- Replace the `/ai-content` route with a redirect to `/content-requests` using `Navigate`.

**3. Update sidebar navigation**
- **`src/components/AppSidebar.tsx`**: Remove the "AI Content" sidebar entry (the one pointing to `/ai-content`).
- **`src/components/DashboardLayout.tsx`**: Remove the "AI Content Engine" nav items from both the admin and concierge nav sections.

**4. Drop the `ai_content` database table**
- Run a migration: `DROP TABLE IF EXISTS public.ai_content;`
- This table is empty and unused; the active workflow uses `content_requests` + `content_versions`.

### What stays unchanged
- `/content` route (Content Calendar) -- remains as-is
- `/content-requests` route -- the real home for AI-generated content
- All other sidebar links and routes

