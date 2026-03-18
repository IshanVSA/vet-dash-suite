

## Plan: Add Stat Holiday Hours Option to Time Changes Form

### What changes

**File: `src/components/department/ticket-forms/TimeChangesForm.tsx`**

Add a new section below the Business Hours grid:

1. **"Open on Statutory Holidays?" toggle** — a `Switch` component defaulting to off (Closed).
2. **Conditional time inputs** — when toggled on, show open/close time fields (same pattern as the day rows).
3. **Update the `onChange` description output** to include the stat holiday preference, e.g.:
   - If closed: `Statutory Holidays: Closed`
   - If open: `Statutory Holidays: Open (09:00 - 17:00)`

### New state

```
const [statHolidayOpen, setStatHolidayOpen] = useState(false);
const [statHolidayOpenTime, setStatHolidayOpenTime] = useState("09:00");
const [statHolidayCloseTime, setStatHolidayCloseTime] = useState("17:00");
```

### UI layout

A single row styled like the day schedule rows (`bg-muted/30 rounded-md p-2`) with:
- Label "Stat Holidays"
- Switch toggle
- "Open" / "Closed" text
- Conditional time inputs when open

### Description output update

Append after the business hours lines:
```
Statutory Holidays: Closed
— or —
Statutory Holidays: Open (09:00 - 17:00)
```

No other files need changes since the description string is what gets stored in the ticket.

