import { type PostActivityLog } from "@/types/content-calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  Sparkles, ThumbsUp, Send, Check, Clock, AlertTriangle, RefreshCw, Copy
} from "lucide-react";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  generated: <Sparkles className="h-3 w-3 text-muted-foreground" />,
  concierge_preferred: <ThumbsUp className="h-3 w-3 text-indigo-400" />,
  sent_to_admin: <Send className="h-3 w-3 text-amber-400" />,
  admin_approved: <Check className="h-3 w-3 text-emerald-400" />,
  sent_to_client: <Send className="h-3 w-3 text-blue-400" />,
  client_approved: <Check className="h-3 w-3 text-green-400" />,
  auto_approved: <Clock className="h-3 w-3 text-purple-400" />,
  flagged: <AlertTriangle className="h-3 w-3 text-destructive" />,
  regenerated: <RefreshCw className="h-3 w-3 text-muted-foreground" />,
  duplicated: <Copy className="h-3 w-3 text-muted-foreground" />,
};

const ACTION_LABELS: Record<string, string> = {
  generated: "Content generated",
  concierge_preferred: "Concierge preferred version selected",
  sent_to_admin: "Sent to admin for review",
  admin_approved: "Admin approved",
  sent_to_client: "Sent to client for approval",
  client_approved: "Client approved",
  auto_approved: "Auto-approved (5-day countdown)",
  flagged: "Flagged for review",
  regenerated: "Content regenerated",
  duplicated: "Post duplicated",
};

interface ActivityTimelineProps {
  activities: PostActivityLog[];
  loading?: boolean;
}

export function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</h4>
        <div className="text-xs text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Activity
      </h4>
      <ScrollArea className="max-h-48">
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No activity yet</p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-2">
                <div className="mt-0.5 flex-shrink-0">
                  {ACTION_ICONS[activity.action] || (
                    <div className="h-3 w-3 rounded-full bg-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-foreground">
                    {ACTION_LABELS[activity.action] || activity.action}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(activity.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
