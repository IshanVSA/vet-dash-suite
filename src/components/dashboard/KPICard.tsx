import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

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

const iconBgMap = {
  blue: "bg-primary/8",
  green: "bg-success/8",
  amber: "bg-warning/8",
  purple: "bg-[hsl(280,65%,60%)]/8",
};

const iconColorMap = {
  blue: "text-primary",
  green: "text-success",
  amber: "text-warning",
  purple: "text-[hsl(280,65%,60%)]",
};

const accentMap = {
  blue: "border-l-primary",
  green: "border-l-success",
  amber: "border-l-warning",
  purple: "border-l-[hsl(280,65%,60%)]",
};

export default function KPICard({ label, value, change, changeType = "neutral", icon: Icon, index = 0, gradient = "blue", href }: KPICardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={href ? { y: -3, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "relative bg-card rounded-xl border border-border/50 border-l-[3px] p-5 transition-shadow duration-200 group",
        accentMap[gradient],
        href && "cursor-pointer"
      )}
      style={{ boxShadow: "var(--shadow-sm)" }}
      onMouseEnter={(e) => { if (href) (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-lg)"; }}
      onMouseLeave={(e) => { if (href) (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">{label}</p>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", iconBgMap[gradient])}>
          <Icon className={cn("h-4 w-4", iconColorMap[gradient])} />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums leading-none">{value}</p>
      {change && (
        <p className={cn(
          "text-xs font-medium mt-2",
          changeType === "positive" && "text-success",
          changeType === "negative" && "text-destructive",
          changeType === "neutral" && "text-muted-foreground"
        )}>
          {change}
        </p>
      )}
    </motion.div>
  );

  if (href) {
    return <Link to={href} className="block">{content}</Link>;
  }

  return content;
}