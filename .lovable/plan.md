

## Fix: Add "Content Requests" to Sidebar Navigation

### Problem
The sidebar navigation is defined in `src/components/DashboardLayout.tsx`, but "Content Requests" (`/content-requests`) is not listed in either the `adminSections` or `conciergeSections` arrays. The route exists in `App.tsx` and works if navigated to directly, but there is no link in the sidebar.

### Fix
Add a "Content Requests" nav item to the sidebar in `DashboardLayout.tsx` for all three roles:

**Admin sections** (line 29-33): Add `{ label: "Content Requests", icon: FileCheck, path: "/content-requests" }` after "Client Intake"

**Concierge sections** (line 55-58): Add `{ label: "Content Requests", icon: FileCheck, path: "/content-requests" }` after "Client Intake"

**Client sections** (line 102-108): Add `{ label: "Content Requests", icon: FileCheck, path: "/content-requests" }` so clients can review and approve content

Also import the `FileCheck` icon from lucide-react (already used in `AppSidebar.tsx`).

### Technical Details

**File**: `src/components/DashboardLayout.tsx`

1. Add `FileCheck` to the lucide-react import on line 7
2. Add nav item to `adminSections` MAIN group (after line 32)
3. Add nav item to `conciergeSections` MAIN group (after line 57)
4. Add nav item to both `defaultClientSections` and dynamic `clientSections` (after Dashboard)

This is a one-file, minimal change.
