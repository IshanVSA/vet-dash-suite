

# VSA Vet Media Dashboard - Full Build Plan

## Overview
Build a complete veterinary clinic marketing dashboard with role-based access (admin, concierge, client), featuring clinic management, content calendar, AI content generation, analytics, and more. Uses a teal/emerald veterinary-themed design with Supabase for backend.

---

## Phase 1: Database Migration

Run a single SQL migration to create the full schema:

**Enum:**
- `app_role` enum: `'admin'`, `'concierge'`, `'client'`

**Tables:**
1. `profiles` - user profiles (id, full_name, avatar_url, created_at, updated_at)
2. `user_roles` - role assignments (user_id, role) with unique constraint
3. `clinics` - clinic info (name, address, phone, email, website, logo_url, owner_id, created_at)
4. `content_posts` - social media content (clinic_id, title, content, platform, status, scheduled_at, published_at, created_by)
5. `analytics` - engagement metrics (clinic_id, platform, metric_type, value, recorded_at)
6. `ai_content` - AI-generated drafts (clinic_id, prompt, generated_content, status, created_by)
7. `calendar_submissions` - intake form submissions (clinic_id, submitter_name, submitter_email, pet_name, pet_type, notes, status)
8. `clinic_api_credentials` - API keys for social platforms (clinic_id, platform, api_key_encrypted, api_secret_encrypted)

**Functions:**
- `has_role(uuid, app_role)` - security definer function to check roles without RLS recursion
- `get_user_role(uuid)` - returns a user's role
- `handle_new_user()` - trigger function to auto-create profile + assign 'client' role on signup

**Trigger:**
- `on_auth_user_created` on `auth.users` firing `handle_new_user()`

**RLS Policies:**
- Each table gets appropriate policies using `has_role()` to avoid recursion
- Admins: full access to all tables
- Concierges: read/write on clinics, content, analytics, calendar for their assigned clinics
- Clients: read-only on their own clinic data
- `user_roles`: only admins can manage; users can read their own role

---

## Phase 2: Design System

Update `src/index.css` with a veterinary-themed color palette:
- Primary: teal/emerald tones (~168 hue)
- Sidebar: dark teal background
- Accent: warm amber for highlights
- Clean, professional healthcare feel

---

## Phase 3: Authentication

**Files to create:**
- `src/pages/Login.tsx` - login/signup form with email+password, branded with VSA logo
- `src/hooks/useAuth.ts` - auth state management hook using `onAuthStateChange`
- `src/hooks/useUserRole.ts` - fetches user role from `user_roles` table
- `src/components/ProtectedRoute.tsx` - redirects unauthenticated users to login

---

## Phase 4: Layout and Navigation

**Files to create:**
- `src/components/AppSidebar.tsx` - role-based sidebar navigation using shadcn Sidebar component
  - Admin sees: Dashboard, Clinics, Content, Analytics, AI Content, Calendar, Employees, Review, Settings
  - Concierge sees: Dashboard, Content, Calendar, AI Content, Analytics
  - Client sees: Dashboard, Content, Analytics, Intake Form
- `src/components/DashboardLayout.tsx` - wraps pages with SidebarProvider + header with SidebarTrigger

**Update:**
- `src/App.tsx` - add all routes wrapped in ProtectedRoute with role checks

---

## Phase 5: Dashboard Pages

Create all pages in `src/pages/`:

1. **`Dashboard.tsx`** - role-specific overview cards (total clinics, posts, engagement stats)
2. **`Clinics.tsx`** - CRUD for clinics (admin only), list with search/filter
3. **`ContentCalendar.tsx`** - calendar view of scheduled posts, create/edit posts
4. **`AIContent.tsx`** - form to generate AI content drafts, list of past generations
5. **`Analytics.tsx`** - charts (using recharts) for engagement metrics by platform
6. **`IntakeForms.tsx`** - calendar submission form for clients, list view for admin/concierge
7. **`Employees.tsx`** - manage users and role assignments (admin only)
8. **`AdminReview.tsx`** - review pending content posts and AI drafts (admin only)
9. **`Settings.tsx`** - profile settings, clinic API credentials management

---

## Phase 6: Shared Components

- `src/components/StatsCard.tsx` - reusable metric card
- `src/components/ContentPostForm.tsx` - create/edit content post dialog
- `src/components/ClinicForm.tsx` - create/edit clinic dialog
- `src/components/RoleBadge.tsx` - colored badge for role display

---

## Technical Details

- All Supabase queries use `@/integrations/supabase/client`
- Data fetching via TanStack Query (`useQuery`/`useMutation`)
- Role checks use the `useUserRole` hook, never localStorage
- Navigation uses `react-router-dom` with `NavLink` component for active state
- Forms use `react-hook-form` + `zod` validation
- Toast notifications via `sonner` for success/error feedback
- Responsive design: sidebar collapses on mobile via Sheet

**Route structure:**
```text
/login          - public
/               - Dashboard (protected)
/clinics        - Clinic management (admin)
/content        - Content calendar (admin, concierge)
/ai-content     - AI content generation (admin, concierge)
/analytics      - Analytics dashboard (all roles)
/intake-forms   - Intake/calendar submissions (all roles)
/employees      - Employee management (admin)
/review         - Admin review queue (admin)
/settings       - User settings (all roles)
```

**File count:** ~20 new files total across components, pages, and hooks.

