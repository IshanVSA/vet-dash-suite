import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, CheckCircle2, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TicketCardProps {
  id: string;
  title: string;
  ticket_type: string;
  priority: "regular" | "urgent" | "emergency";
  status: "open" | "in_progress" | "completed" | "emergency";
  description?: string | null;
  created_at: string;
}

const statusConfig = {
  open: { label: "Open", icon: Inbox, className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  in_progress: { label: "In Progress", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  completed: { label: "Completed", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  emergency: { label: "Emergency", icon: AlertTriangle, className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const priorityConfig = {
  regular: { label: "Regular", className: "bg-muted text-muted-foreground" },
  urgent: { label: "Urgent", className: "bg-amber-500/10 text-amber-600" },
  emergency: { label: "Emergency", className: "bg-destructive/10 text-destructive" },
};

export function TicketCard({ title, ticket_type, priority, status, description, created_at }: TicketCardProps) {
  const sc = statusConfig[status];
  const pc = priorityConfig[priority];
  const StatusIcon = sc.icon;

  return (
    <Card className="overflow-hidden hover-lift transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <StatusIcon className="h-4 w-4 shrink-0" />
              <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{description}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${sc.className}`}>{sc.label}</Badge>
              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${pc.className}`}>{pc.label}</Badge>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{ticket_type}</Badge>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 pt-0.5">
            {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
