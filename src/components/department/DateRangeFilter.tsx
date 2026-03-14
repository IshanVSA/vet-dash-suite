import { format, subDays, differenceInDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  presets?: number[];
  className?: string;
}

export function DateRangeFilter({
  dateRange,
  onDateRangeChange,
  presets = [7, 14, 30, 90],
  className,
}: DateRangeFilterProps) {
  const totalDays = differenceInDays(dateRange.to, dateRange.from) + 1;
  const isPresetRange =
    presets.includes(totalDays) &&
    format(dateRange.to, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {presets.map((days) => (
          <Button
            key={days}
            size="sm"
            variant={totalDays === days && isPresetRange ? "default" : "outline"}
            onClick={() =>
              onDateRangeChange({ from: subDays(new Date(), days), to: new Date() })
            }
            className="text-xs"
          >
            {days}d
          </Button>
        ))}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "text-xs gap-1.5",
              isPresetRange
                ? "text-muted-foreground"
                : "text-foreground border-primary/50"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {!isPresetRange && (
              <span className="font-medium">Custom Range:</span>
            )}
            {format(dateRange.from, "MMM d")} –{" "}
            {format(dateRange.to, "MMM d, yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
              if (range?.from && range?.to)
                onDateRangeChange({ from: range.from, to: range.to });
              else if (range?.from)
                onDateRangeChange({ from: range.from, to: range.from });
            }}
            disabled={(date) => date > new Date()}
            numberOfMonths={2}
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
