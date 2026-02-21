import { type ContentPost } from "@/types/content-calendar";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2 } from "lucide-react";

interface MonthlyProgressBarProps {
  posts: ContentPost[];
}

export function MonthlyProgressBar({ posts }: MonthlyProgressBarProps) {
  const total = posts.length;
  const approved = posts.filter(
    (p) =>
      p.workflow_stage === "client_approved" ||
      p.workflow_stage === "auto_approved" ||
      p.status === "approved" ||
      p.status === "posted"
  ).length;
  const percent = total > 0 ? Math.round((approved / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-card rounded-lg border border-border px-4 py-2.5">
      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <Progress value={percent} className="h-2" />
      </div>
      <span className="text-xs font-medium text-foreground shrink-0">
        {approved} / {total} Approved
      </span>
    </div>
  );
}
