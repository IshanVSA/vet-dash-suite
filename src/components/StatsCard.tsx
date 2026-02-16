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
      className="bg-card rounded-xl border border-border p-5 hover-lift animate-fade-in"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
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
        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-sm">
          <Icon className="h-5 w-5 text-accent-foreground" />
        </div>
      </div>
    </div>
  );
}
