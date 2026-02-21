import { differenceInDays, differenceInHours } from "date-fns";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownBadgeProps {
  autoApproveAt: string;
  className?: string;
}

export function CountdownBadge({ autoApproveAt, className }: CountdownBadgeProps) {
  const now = new Date();
  const target = new Date(autoApproveAt);
  const daysLeft = differenceInDays(target, now);
  const hoursLeft = differenceInHours(target, now);

  if (hoursLeft <= 0) {
    return (
      <div className={cn("flex items-center gap-1.5 rounded-md bg-purple-500/15 px-2.5 py-1.5 text-purple-400", className)}>
        <Clock className="h-3 w-3" />
        <span className="text-xs font-semibold">AUTO APPROVED</span>
      </div>
    );
  }

  const urgency = daysLeft <= 1 ? "text-destructive bg-destructive/10" : "text-blue-400 bg-blue-500/10";

  return (
    <div className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1.5", urgency, className)}>
      <Clock className="h-3 w-3" />
      <span className="text-xs font-medium">
        Client Review — {daysLeft > 0 ? `${daysLeft} Day${daysLeft !== 1 ? "s" : ""} Remaining` : `${hoursLeft}h Remaining`}
      </span>
    </div>
  );
}
