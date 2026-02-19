import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  index?: number;
  gradient?: "blue" | "green" | "amber" | "purple";
}

const gradientMap = {
  blue: {
    bg: "kpi-gradient-blue",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    ring: "ring-primary/10",
    accentBar: "from-primary to-primary/60",
  },
  green: {
    bg: "kpi-gradient-green",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    ring: "ring-success/10",
    accentBar: "from-success to-success/60",
  },
  amber: {
    bg: "kpi-gradient-amber",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    ring: "ring-warning/10",
    accentBar: "from-warning to-warning/60",
  },
  purple: {
    bg: "kpi-gradient-purple",
    iconBg: "bg-[hsl(280,65%,60%)]/10",
    iconColor: "text-[hsl(280,65%,60%)]",
    ring: "ring-[hsl(280,65%,60%)]/10",
    accentBar: "from-[hsl(280,65%,60%)] to-[hsl(280,65%,60%)]/60",
  },
};

export default function KPICard({ label, value, change, changeType = "neutral", icon: Icon, index = 0, gradient = "blue" }: KPICardProps) {
  const g = gradientMap[gradient];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 hover-lift animate-fade-in group",
        g.bg
      )}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      {/* Top accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r opacity-60", g.accentBar)} />
      
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[12px] text-muted-foreground font-semibold tracking-wider uppercase">{label}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight tabular-nums">{value}</p>
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
        </div>
        <div className={cn(
          "h-11 w-11 rounded-xl flex items-center justify-center ring-1 transition-transform duration-300 group-hover:scale-110",
          g.iconBg,
          g.ring
        )}>
          <Icon className={cn("h-5 w-5", g.iconColor)} />
        </div>
      </div>
    </div>
  );
}
