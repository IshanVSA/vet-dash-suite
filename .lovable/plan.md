

## Plan: Replace Inline Dropdowns with Edit Dialog

### Problem
Currently, the table has inline `Select` dropdowns for Access Level and Team Role directly in each row, plus a separate clinic assignment button. The user wants:
1. Only admins can edit (already the case since the page is admin-only, but we should enforce it visually)
2. Replace inline dropdowns with static text display
3. Add a single "Edit" button in Actions that opens a dialog to edit Access Level, Team Role, and Assigned Clinics all in one place

### Changes

**File: `src/pages/Employees.tsx`**

1. **Remove inline Select dropdowns** from the table rows for Access Level and Team Role columns. Display them as static text/badges instead:
   - Access Level: show `Badge` with "Admin" or "Member"
   - Team Role: show text like "Developer" or italic "N/A" for admins

2. **Replace the two action buttons** (Building2 clinic assign + Trash2 delete) with an **Edit button** (Pencil icon) and the existing Delete button.

3. **Create a unified Edit Dialog** that combines:
   - Access Level select (Admin / Member)
   - Team Role select (the 6 roles, hidden when Admin)
   - Clinic assignments (checkbox list, same as current assign dialog)
   - Save button that updates all three in one action

4. **Add state for the edit dialog**:
   - `editDialogUser: Profile | null`
   - `editForm: { role: string, team_role: string, clinicIds: string[] }`
   - On open: populate from current data
   - On save: call `handleRoleChange`, `handleTeamRoleChange`, and `handleSaveAssignments` logic sequentially

5. **Remove the separate Assign Clinics dialog** — merged into the edit dialog.

6. **Import `Pencil`** from lucide-react, remove `Building2` import.

### UI Result
Table shows read-only data. Actions column has Edit (pencil) + Delete (trash). Clicking Edit opens a dialog with all editable fields and a clinic checklist.

