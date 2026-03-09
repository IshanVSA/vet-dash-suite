import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface KPICardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  index?: number;
  gradient?: "blue" | "green" | "amber" | "purple";
  href?: string;
}

const accentMap = {
  blue: "border-l-primary",
  green: "border-l-success",
  amber: "border-l-warning",
  purple: "border-l-[hsl(280,65%,60%)]",
};

const iconColorMap = {
  blue: "text-primary",
  green: "text-success",
  amber: "text-warning",
  purple: "text-[hsl(280,65%,60%)]",
};

export default function KPICard({ label, value, change, changeType = "neutral", icon: Icon, index = 0, gradient = "blue", href }: KPICardProps) {
  const content = (
    <div
      className={cn(
        "relative bg-card rounded-lg border border-border/60 border-l-[3px] p-4 sm:p-5 transition-all duration-150 group",
        accentMap[gradient],
        href && "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] sm:text-xs text-muted-foreground font-semibold tracking-wider uppercase">{label}</p>
        <Icon className={cn("h-4 w-4 opacity-50", iconColorMap[gradient])} />
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">{value}</p>
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
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}
