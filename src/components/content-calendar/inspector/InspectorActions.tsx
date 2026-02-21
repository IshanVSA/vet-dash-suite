import { Button } from "@/components/ui/button";
import { type AppRole } from "@/hooks/useUserRole";
import { Flag, Copy, RefreshCw } from "lucide-react";

interface InspectorActionsProps {
  workflowStage: string;
  userRole: AppRole | null;
  onFlag: () => void;
  onDuplicate: () => void;
  onRegenerate: () => void;
  loading?: boolean;
}

export function InspectorActions({
  workflowStage,
  userRole,
  onFlag,
  onDuplicate,
  onRegenerate,
  loading,
}: InspectorActionsProps) {
  const isAdmin = userRole === "admin";
  const isConcierge = userRole === "concierge";

  // Only show actions relevant to admin/concierge (no individual approval buttons)
  if (!isAdmin && !isConcierge) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Actions
      </h4>
      <div className="grid grid-cols-2 gap-1.5">
        {/* Flag - admin & concierge */}
        {!["flagged", "client_approved", "auto_approved"].includes(workflowStage) && (
          <Button size="sm" variant="outline" className="text-xs h-8 text-destructive hover:text-destructive" onClick={onFlag} disabled={loading}>
            <Flag className="h-3 w-3 mr-1" /> Flag
          </Button>
        )}

        {/* Duplicate */}
        <Button size="sm" variant="outline" className="text-xs h-8" onClick={onDuplicate} disabled={loading}>
          <Copy className="h-3 w-3 mr-1" /> Duplicate
        </Button>

        {/* Regenerate */}
        <Button size="sm" variant="outline" className="text-xs h-8" onClick={onRegenerate} disabled={loading}>
          <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
        </Button>
      </div>
    </div>
  );
}
