

## Fix: Add "Clients" Link to Sidebar Navigation

The "Clients" page exists and the route is configured, but the sidebar navigation in `DashboardLayout.tsx` is missing the "Clients" link. The `AppSidebar.tsx` component has it, but `DashboardLayout.tsx` is the component that actually renders the sidebar.

### Changes

**`src/components/DashboardLayout.tsx`**
- Add `UserCheck` to the lucide-react imports
- Add `{ label: "Clients", icon: UserCheck, path: "/clients" }` to the `adminSections` array, in the same section as "Clinics" and "Employees"

That's it -- one file, two small edits. After this, the "Clients" link will appear in the admin sidebar between "Employees" and "Settings".

