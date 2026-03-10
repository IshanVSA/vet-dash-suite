

## Fix: Google Ads OAuth opens in same tab

**Change**: In `src/components/clinic-detail/GoogleAdsConnectionCard.tsx`, replace `window.open(oauthUrl, "_blank")` with `window.location.href = oauthUrl`.

This is a single-line change on the "Connect Google Ads" button's `onClick` handler.

