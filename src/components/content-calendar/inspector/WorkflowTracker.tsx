import { WORKFLOW_STAGES, type WorkflowStage } from "@/types/content-calendar";
import { cn } from "@/lib/utils";

interface WorkflowTrackerProps {
  currentStage: string;
  compact?: boolean;
}

export function WorkflowTracker({ currentStage, compact = false }: WorkflowTrackerProps) {
  const stageIndex = WORKFLOW_STAGES.findIndex((s) => s.key === currentStage);
  const isFlagged = currentStage === "flagged";

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {WORKFLOW_STAGES.slice(0, 5).map((stage, i) => {
          const isCompleted = stageIndex >= i;
          const isActive = stageIndex === i;
          return (
            <div
              key={stage.key}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === 0 ? "w-3" : "w-3",
                isFlagged
                  ? "bg-destructive/40"
                  : isCompleted
                  ? "bg-primary"
                  : "bg-muted-foreground/20",
                isActive && !isFlagged && "ring-1 ring-primary/50 ring-offset-1 ring-offset-card"
              )}
              style={
                isCompleted && !isFlagged
                  ? { backgroundColor: stage.color }
                  : undefined
              }
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Workflow
      </h4>
      <div className="flex items-center gap-1">
        {WORKFLOW_STAGES.map((stage, i) => {
          const isCompleted = stageIndex >= i;
          const isActive = stageIndex === i;
          return (
            <div key={stage.key} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full border-2 transition-all duration-300",
                    isFlagged
                      ? "border-destructive bg-destructive/30"
                      : isCompleted
                      ? "border-transparent"
                      : "border-muted-foreground/30 bg-transparent",
                    isActive && !isFlagged && "ring-2 ring-offset-2 ring-offset-card shadow-lg"
                  )}
                  style={
                    isCompleted && !isFlagged
                      ? { backgroundColor: stage.color, borderColor: stage.color, boxShadow: isActive ? `0 0 8px ${stage.color}40` : undefined }
                      : undefined
                  }
                />
                <span
                  className={cn(
                    "text-[9px] text-center leading-tight",
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {stage.label}
                </span>
              </div>
              {i < WORKFLOW_STAGES.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1 min-w-2 mt-[-14px]",
                    isCompleted && stageIndex > i
                      ? "bg-primary/50"
                      : "bg-muted-foreground/15"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      {isFlagged && (
        <div className="text-xs text-destructive bg-destructive/10 rounded-md px-2 py-1">
          ⚠ Post has been flagged
        </div>
      )}
    </div>
  );
}
