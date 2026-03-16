import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface DaySchedule {
  open: boolean;
  openTime: string;
  closeTime: string;
}

type WeekSchedule = Record<string, DaySchedule>;

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const defaultSchedule: WeekSchedule = Object.fromEntries(
  DAYS.map(day => [day, { open: day !== "Sunday", openTime: "09:00", closeTime: "17:00" }])
);

interface TimeChangesFormProps {
  onChange: (description: string) => void;
}

export function TimeChangesForm({ onChange }: TimeChangesFormProps) {
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule);

  useEffect(() => {
    const lines = DAYS.map(day => {
      const s = schedule[day];
      return s.open ? `${day}: ${s.openTime} - ${s.closeTime}` : `${day}: Closed`;
    });
    onChange("Updated Business Hours:\n" + lines.join("\n"));
  }, [schedule, onChange]);

  const update = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setSchedule(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Business Hours</Label>
      <div className="space-y-2">
        {DAYS.map(day => (
          <div key={day} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
            <div className="w-24 text-sm font-medium text-foreground">{day}</div>
            <Switch
              checked={schedule[day].open}
              onCheckedChange={v => update(day, "open", v)}
            />
            <span className="text-xs text-muted-foreground w-10">
              {schedule[day].open ? "Open" : "Closed"}
            </span>
            {schedule[day].open && (
              <>
                <Input
                  type="time"
                  value={schedule[day].openTime}
                  onChange={e => update(day, "openTime", e.target.value)}
                  className="w-28 h-8 text-xs"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  type="time"
                  value={schedule[day].closeTime}
                  onChange={e => update(day, "closeTime", e.target.value)}
                  className="w-28 h-8 text-xs"
                />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
