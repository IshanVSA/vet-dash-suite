

## Plan: Filter Department Team Members by Team Role

### Current Behavior
The `useDepartmentTeam` hook queries the `department_members` table to find users assigned to each department. This means team members only appear if they have a row in `department_members` for that department.

### Desired Behavior
Show team members based on their `team_role` field in the `profiles` table:
- **Website** (`website`): Developer, Maintenance
- **SEO** (`seo`): SEO Lead
- **Google Ads** (`google_ads`): Ads Strategist, Ads Analyst
- **Social Media** (`social_media`): Social & Concierge

### Changes

**1. Update `src/hooks/useDepartmentTeam.ts`**

Add a mapping from department name to allowed `team_role` values:

```
website → ["Developer", "Maintenance"]
seo → ["SEO Lead"]
google_ads → ["Ads Strategist", "Ads Analyst"]
social_media → ["Social & Concierge"]
```

Change the data fetching strategy: instead of querying `department_members`, query `profiles` where `team_role` is in the allowed list for the given department. Also join with `user_roles` to exclude `client` users (only show admin/concierge staff). Use the `team_role` value as the displayed role.

The hook signature and return type remain the same, so no changes needed in any consuming components (`WebsiteDepartment`, `SeoDepartment`, `GoogleAdsDepartment`, `SocialOverview`).

