import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  index?: number;
}

export function StatsCard({ title, value, icon: Icon, description, change, changeType = "neutral", index = 0 }: StatsCardProps) {
  return (
    <div
      className="bg-card rounded-xl border border-border p-4 sm:p-5 hover-lift animate-fade-in"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 sm:space-y-2 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
          {change && (
            <p className={cn(
              "text-xs font-medium",
              changeType === "positive" && "text-success",
              changeType === "negative" && "text-destructive",
              changeType === "neutral" && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
          {description && !change && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-sm shrink-0">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
        </div>
      </div>
    </div>
  );
}
