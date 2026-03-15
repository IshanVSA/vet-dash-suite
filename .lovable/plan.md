

## Problem

The `AnimatePresence` wrapper around the `TabsContent` components breaks Radix Tabs. When `mode="wait"` is used, the exiting `motion.div` unmounts before the new one mounts. During that gap, the `TabsContent` components are removed from the DOM, and Radix loses track of the active tab content. The SEO tab content never appears.

## Fix

Remove `AnimatePresence` + `motion.div` from **inside** the `<Tabs>` component and instead use a simpler approach that doesn't interfere with Radix's internal state management:

1. **Replace `AnimatePresence`/`motion.div` wrapping TabsContent** with a single `motion.div` keyed on `mode` that does NOT use `AnimatePresence mode="wait"`. Instead, use a simple opacity+transform transition on the content wrapper without unmounting via AnimatePresence.

2. **Concrete approach**: Remove `AnimatePresence` entirely. Keep a single `motion.div` with `key={mode}` using `initial`/`animate` (no `exit`). This re-triggers the enter animation on mode switch without blocking Radix's rendering. The content swaps instantly (React re-renders with new key) while the fade-slide animation plays on mount.

### Changes — `src/pages/WebsiteDepartment.tsx`

- Lines 263-293: Remove `<AnimatePresence mode="wait">` wrapper. Keep just a `<motion.div>` with `key={mode}`, `initial={{ opacity: 0, x: mode === "seo" ? 24 : -24 }}`, `animate={{ opacity: 1, x: 0 }}`, and the transition. No `exit` prop, no `AnimatePresence`.

