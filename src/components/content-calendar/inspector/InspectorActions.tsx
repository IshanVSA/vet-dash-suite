import { Button } from "@/components/ui/button";
import { type AppRole } from "@/hooks/useUserRole";
import { Check, Flag, Copy, RefreshCw, Send } from "lucide-react";

interface InspectorActionsProps {
  workflowStage: string;
  userRole: AppRole | null;
  onApprove: () => void;
  onFlag: () => void;
  onDuplicate: () => void;
  onRegenerate: () => void;
  onSendToClient: () => void;
  onSendToAdmin: () => void;
  loading?: boolean;
}

export function InspectorActions({
  workflowStage,
  userRole,
  onApprove,
  onFlag,
  onDuplicate,
  onRegenerate,
  onSendToClient,
  onSendToAdmin,
  loading,
}: InspectorActionsProps) {
  const isAdmin = userRole === "admin";
  const isConcierge = userRole === "concierge";
  const isClient = userRole === "client";

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Actions
      </h4>
      <div className="grid grid-cols-2 gap-1.5">
        {/* Concierge: send to admin */}
        {isConcierge && (workflowStage === "generated" || workflowStage === "concierge_preferred") && (
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={onSendToAdmin} disabled={loading}>
            <Send className="h-3 w-3 mr-1" /> Send to Admin
          </Button>
        )}

        {/* Admin: approve */}
        {isAdmin && (workflowStage === "sent_to_admin" || workflowStage === "generated" || workflowStage === "concierge_preferred") && (
          <Button size="sm" className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700" onClick={onApprove} disabled={loading}>
            <Check className="h-3 w-3 mr-1" /> Approve
          </Button>
        )}

        {/* Admin: send to client */}
        {isAdmin && workflowStage === "admin_approved" && (
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={onSendToClient} disabled={loading}>
            <Send className="h-3 w-3 mr-1" /> Send to Client
          </Button>
        )}

        {/* Client: approve */}
        {isClient && workflowStage === "sent_to_client" && (
          <Button size="sm" className="text-xs h-8 bg-green-600 hover:bg-green-700" onClick={onApprove} disabled={loading}>
            <Check className="h-3 w-3 mr-1" /> Approve
          </Button>
        )}

        {/* Flag - admin & concierge */}
        {(isAdmin || isConcierge) && !["flagged", "client_approved", "auto_approved"].includes(workflowStage) && (
          <Button size="sm" variant="outline" className="text-xs h-8 text-destructive hover:text-destructive" onClick={onFlag} disabled={loading}>
            <Flag className="h-3 w-3 mr-1" /> Flag
          </Button>
        )}

        {/* Duplicate - admin & concierge */}
        {(isAdmin || isConcierge) && (
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={onDuplicate} disabled={loading}>
            <Copy className="h-3 w-3 mr-1" /> Duplicate
          </Button>
        )}

        {/* Regenerate - admin & concierge */}
        {(isAdmin || isConcierge) && (
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={onRegenerate} disabled={loading}>
            <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
          </Button>
        )}
      </div>
    </div>
  );
}
