import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, CheckCircle2, Send, PenLine, Flag, MessageSquare, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow, parseISO } from "date-fns";

interface ActivityItem {
  id: string;
  action: string;
  created_at: string;
  post_title: string;
  metadata: Record<string, unknown>;
}

const actionConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  created: { icon: Sparkles, label: "Post created", color: "text-primary" },
  status_change: { icon: Clock, label: "Status changed", color: "text-amber-500" },
  approved: { icon: CheckCircle2, label: "Approved", color: "text-emerald-500" },
  admin_approved: { icon: CheckCircle2, label: "Admin approved", color: "text-emerald-500" },
  client_approved: { icon: CheckCircle2, label: "Client approved", color: "text-emerald-500" },
  sent_to_client: { icon: Send, label: "Sent to client", color: "text-sky-500" },
  sent_to_admin: { icon: Send, label: "Sent to admin", color: "text-sky-500" },
  edited: { icon: PenLine, label: "Edited", color: "text-violet-500" },
  flagged: { icon: Flag, label: "Flagged", color: "text-destructive" },
  comment: { icon: MessageSquare, label: "Comment added", color: "text-muted-foreground" },
};

const fallbackConfig = { icon: Activity, label: "Activity", color: "text-muted-foreground" };

function getConfig(action: string) {
  return actionConfig[action] || fallbackConfig;
}

export default function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      const { data } = await supabase
        .from("post_activity_log")
        .select("id, action, created_at, metadata, post_id, content_posts(title)")
        .order("created_at", { ascending: false })
        .limit(10);

      const mapped: ActivityItem[] = (data || []).map((row: any) => ({
        id: row.id,
        action: row.action,
        created_at: row.created_at,
        post_title: row.content_posts?.title || "Untitled post",
        metadata: (row.metadata as Record<string, unknown>) || {},
      }));
      setItems(mapped);
      setLoading(false);
    };
    fetchActivity();
  }, []);

  if (loading) return null;

  return (
    <Card
      className="overflow-hidden border-border/60 animate-fade-in"
      style={{ animationDelay: "280ms", animationFillMode: "both" }}
    >
      <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <p className="text-xs text-muted-foreground">Latest content workflow events</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No recent activity yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {items.map((item, i) => {
              const cfg = getConfig(item.action);
              const Icon = cfg.icon;
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 px-4 sm:px-6 py-3 hover:bg-muted/40 transition-colors animate-fade-in"
                  style={{ animationDelay: `${320 + i * 40}ms`, animationFillMode: "both" }}
                >
                  <div className={`mt-0.5 shrink-0 ${cfg.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{cfg.label}</span>
                      <span className="text-muted-foreground"> — </span>
                      <span className="truncate">{item.post_title}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(parseISO(item.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
