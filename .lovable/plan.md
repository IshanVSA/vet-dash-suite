

## Plan: Add Clinic Assignment from the Employees Page

### What
Add a button on each employee row that opens a dialog with checkboxes for all active clinics, allowing admins to assign/unassign clinics directly from the Employees page — mirroring the team assignment dialog on the Clinics page but inverted (select clinics for a user, instead of users for a clinic).

### Changes

**`src/pages/Employees.tsx`**
1. Add state for the clinic assignment dialog: `assignDialogUser` (selected user), `assignedClinicIds` (checked clinic IDs), `allClinics` (list of all active clinics fetched in `fetchData`).
2. The `fetchData` function already fetches clinics — store the full list in `allClinics` state.
3. Add a new **Assign Clinics** button (Building2 icon) in the Actions column next to the delete button.
4. On click, open a dialog pre-populated with the user's current clinic assignments (derived from existing `clinic_team_members` data).
5. Dialog contains a checkbox list of all active clinics with a Save button.
6. On save, diff current vs. new selections, insert new rows and delete removed rows from `clinic_team_members`, then refresh data.

No database or migration changes needed — the `clinic_team_members` table and RLS policies already exist.

