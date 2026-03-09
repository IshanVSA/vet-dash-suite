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
      className="bg-card rounded-lg border border-border/60 border-l-[3px] border-l-primary p-4 sm:p-5 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-muted-foreground font-semibold tracking-wider uppercase">{title}</p>
        <Icon className="h-4 w-4 text-primary opacity-50" />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
      {change && (
        <p className={cn(
          "text-xs font-medium mt-1",
          changeType === "positive" && "text-success",
          changeType === "negative" && "text-destructive",
          changeType === "neutral" && "text-muted-foreground"
        )}>
          {change}
        </p>
      )}
      {description && !change && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}
