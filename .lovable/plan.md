

## Create Team Member Edge Function

The "Add Team Member" button on the Employees page currently shows a placeholder message because no backend logic exists to create users. This plan adds a Supabase Edge Function that securely creates new users with role assignment.

### What will change

1. **New Edge Function: `create-team-member`**
   - Accepts `full_name`, `email`, `password`, and `role` (admin/concierge/client)
   - Verifies the calling user is an admin (server-side check)
   - Creates the user via `supabase.auth.admin.createUser()`
   - The existing `handle_new_user` database trigger will automatically create the profile and default role
   - Then updates the role from the default "client" to the requested role if needed
   - Returns the new user's ID on success

2. **Update `src/pages/Employees.tsx`**
   - Replace the placeholder toast with an actual call to the `create-team-member` edge function
   - On success, refresh the table and close the dialog
   - On error, show the error message

3. **Update `src/pages/Clients.tsx`**
   - Wire up the same edge function for adding clients (role fixed to "client")

### Technical Details

**Edge Function (`supabase/functions/create-team-member/index.ts`)**
- Uses `SUPABASE_SERVICE_ROLE_KEY` (already configured) to call `auth.admin.createUser()`
- Validates the caller is an admin by checking their JWT and querying `user_roles`
- Sets `email_confirm: true` so the new user can log in immediately

**Employees.tsx changes**
- The `onClick` handler calls `supabase.functions.invoke("create-team-member", { body: form })`
- Handles loading state and error display
- Resets form and refreshes data on success

