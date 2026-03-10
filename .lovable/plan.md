

## Fix: Google Ads connection state not reflecting after OAuth

### Problem
After a successful Google Ads OAuth connection, the redirect lands on `/clinics/{id}?google=connected` but:
1. The default tab is "instagram" -- the user doesn't see the Connections tab where the status would show as connected
2. No success toast is shown for the `?google=connected` param
3. The URL params (`google`, `google_accounts`, `meta_pages`) are never cleaned up

### Changes

**File: `src/pages/ClinicDetail.tsx`**

1. **Auto-switch to Connections tab** when `?google=connected`, `?google_accounts=...`, or `?meta_pages=...` params are present. Change `<Tabs defaultValue="instagram">` to use a controlled `value` that defaults to "connections" when these params exist, otherwise "instagram".

2. **Handle `?google=connected` param** -- show a success toast and clean up the URL param.

3. **Clean up all OAuth URL params** (`google`, `google_accounts`, `meta_pages`) after processing to prevent stale state on refresh.

4. **Ensure `fetchCredentials` is called** after the account selection dialog saves (it already calls `onRefresh` which triggers `fetchCredentials`, so this should work -- but we should also call it when detecting `?google=connected`).

### Technical Details

- Add state: `const [activeTab, setActiveTab] = useState("instagram")`
- In the `useEffect`, detect `?google=connected` param: show toast, set tab to "connections", clean param
- For `google_accounts` and `meta_pages`, also set tab to "connections"
- Convert `<Tabs defaultValue="instagram">` to `<Tabs value={activeTab} onValueChange={setActiveTab}>`
- After processing URL params, remove them with `setSearchParams` using `replace: true`

