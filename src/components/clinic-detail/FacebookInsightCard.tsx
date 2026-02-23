import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SubMetric {
  label: string;
  value: string | number;
  color?: "default" | "primary" | "destructive";
}

interface FacebookInsightCardProps {
  title: string;
  mainValue: string | number;
  mainLabel?: string;
  sparklineData?: { value: number }[];
  subMetrics?: SubMetric[];
}

export function FacebookInsightCard({
  title,
  mainValue,
  mainLabel,
  sparklineData,
  subMetrics,
}: FacebookInsightCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="pt-5 pb-4 px-5 space-y-3">
        {/* Header */}
        <p className="text-sm font-medium text-muted-foreground">{title}</p>

        {/* Main value + sparkline */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-bold text-foreground leading-none">
              {mainValue}
            </p>
            {mainLabel && (
              <p className="text-xs text-muted-foreground mt-1">{mainLabel}</p>
            )}
          </div>

          {sparklineData && sparklineData.length > 1 && (
            <div className="w-24 h-10 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Sub-metrics */}
        {subMetrics && subMetrics.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-border">
            {subMetrics.map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">{m.label}</span>
                <span
                  className={
                    m.color === "primary"
                      ? "text-primary font-medium"
                      : m.color === "destructive"
                        ? "text-destructive font-medium"
                        : "text-foreground font-medium"
                  }
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
