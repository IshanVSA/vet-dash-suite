import { Button } from "@/components/ui/button";
import { type CalendarView } from "@/types/content-calendar";
import { List, CalendarDays, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
}

const views: { key: CalendarView; label: string; icon: React.ReactNode }[] = [
  { key: "list", label: "List", icon: <List className="h-3.5 w-3.5" /> },
  { key: "calendar", label: "Calendar", icon: <CalendarDays className="h-3.5 w-3.5" /> },
  { key: "weekly", label: "Weekly", icon: <Columns3 className="h-3.5 w-3.5" /> },
];

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-muted rounded-lg p-0.5">
      {views.map((v) => (
        <Button
          key={v.key}
          variant="ghost"
          size="sm"
          className={cn(
            "text-xs h-7 px-2.5 rounded-md",
            view === v.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => onViewChange(v.key)}
        >
          {v.icon}
          <span className="ml-1 hidden sm:inline">{v.label}</span>
        </Button>
      ))}
    </div>
  );
}
