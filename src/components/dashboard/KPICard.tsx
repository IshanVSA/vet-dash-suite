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
  },
  green: {
    bg: "kpi-gradient-green",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    ring: "ring-success/10",
  },
  amber: {
    bg: "kpi-gradient-amber",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    ring: "ring-warning/10",
  },
  purple: {
    bg: "kpi-gradient-purple",
    iconBg: "bg-[hsl(280,65%,60%)]/10",
    iconColor: "text-[hsl(280,65%,60%)]",
    ring: "ring-[hsl(280,65%,60%)]/10",
  },
};

export default function KPICard({ label, value, change, changeType = "neutral", icon: Icon, index = 0, gradient = "blue" }: KPICardProps) {
  const g = gradientMap[gradient];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/60 bg-card p-5 hover-lift animate-fade-in",
        g.bg
      )}
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[13px] text-muted-foreground font-medium tracking-wide">{label}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
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
        <div className={cn(
          "h-11 w-11 rounded-xl flex items-center justify-center ring-1",
          g.iconBg,
          g.ring
        )}>
          <Icon className={cn("h-5 w-5", g.iconColor)} />
        </div>
      </div>
      {/* Decorative corner glow */}
      <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-[0.04] bg-primary blur-2xl pointer-events-none" />
    </div>
  );
}
