import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, CheckCircle2, Send, PenLine, Flag, MessageSquare, Clock, Sparkles,
  Ticket, FileText, Upload, UserPlus, Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow, parseISO } from "date-fns";

interface UnifiedActivity {
  id: string;
  type: string;
  label: string;
  description: string;
  created_at: string;
  icon: React.ElementType;
  color: string;
}

const postActionConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  created: { icon: Sparkles, label: "Post created", color: "text-primary" },
  status_change: { icon: Clock, label: "Status changed", color: "text-amber-500" },
  approved: { icon: CheckCircle2, label: "Approved", color: "text-emerald-500" },
  admin_approved: { icon: CheckCircle2, label: "Admin approved", color: "text-emerald-500" },
  client_approved: { icon: CheckCircle2, label: "Client approved", color: "text-emerald-500" },
  final_approved: { icon: CheckCircle2, label: "Final approved", color: "text-emerald-500" },
  sent_to_client: { icon: Send, label: "Sent to client", color: "text-sky-500" },
  sent_to_admin: { icon: Send, label: "Sent to admin", color: "text-sky-500" },
  edited: { icon: PenLine, label: "Edited", color: "text-violet-500" },
  flagged: { icon: Flag, label: "Flagged", color: "text-destructive" },
  comment: { icon: MessageSquare, label: "Comment added", color: "text-muted-foreground" },
};

const priorityLabels: Record<string, string> = {
  regular: "",
  urgent: " (Urgent)",
  emergency: " (Emergency)",
};

export default function RecentActivity() {
  const [items, setItems] = useState<UnifiedActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      // Fetch profiles and clinics for name resolution
      const [profilesRes, clinicsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name"),
        supabase.from("clinics").select("id, clinic_name"),
      ]);
      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p.full_name || "Unknown"]));
      const clinicMap = new Map((clinicsRes.data || []).map(c => [c.id, c.clinic_name]));

      // Fetch all activity sources in parallel
      const [postActivityRes, ticketsRes, contentRequestsRes] = await Promise.all([
        supabase
          .from("post_activity_log")
          .select("id, action, created_at, metadata, post_id, actor_id, content_posts(title, clinic_id)")
          .order("created_at", { ascending: false })
          .limit(15),
        supabase
          .from("department_tickets")
          .select("id, title, department, priority, status, created_at, created_by, clinic_id")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("content_requests")
          .select("id, status, created_at, created_by_concierge_id, clinic_id, intake_data")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const activities: UnifiedActivity[] = [];

      // Map post activity
      (postActivityRes.data || []).forEach((row: any) => {
        const cfg = postActionConfig[row.action] || { icon: Activity, label: row.action, color: "text-muted-foreground" };
        const postTitle = row.content_posts?.title || "Untitled post";
        const clinicName = row.content_posts?.clinic_id ? clinicMap.get(row.content_posts.clinic_id) : null;
        const actorName = row.actor_id ? profileMap.get(row.actor_id) : null;
        let desc = postTitle;
        if (clinicName) desc += ` for ${clinicName}`;
        if (actorName) desc += ` by ${actorName}`;

        activities.push({
          id: `post-${row.id}`,
          type: "post",
          label: cfg.label,
          description: desc,
          created_at: row.created_at,
          icon: cfg.icon,
          color: cfg.color,
        });
      });

      // Map tickets
      (ticketsRes.data || []).forEach((t: any) => {
        const creatorName = t.created_by ? profileMap.get(t.created_by) || "Someone" : "Someone";
        const clinicName = t.clinic_id ? clinicMap.get(t.clinic_id) : null;
        const deptLabel = t.department?.replace("_", " ") || "Unknown";
        const priority = priorityLabels[t.priority] || "";
        let desc = `"${t.title}" in ${deptLabel}${priority}`;
        if (clinicName) desc += ` for ${clinicName}`;
        desc += ` by ${creatorName}`;

        activities.push({
          id: `ticket-${t.id}`,
          type: "ticket",
          label: t.status === "open" ? "Ticket created" : `Ticket ${t.status.replace("_", " ")}`,
          description: desc,
          created_at: t.created_at,
          icon: Ticket,
          color: t.priority === "emergency" ? "text-destructive" : t.priority === "urgent" ? "text-amber-500" : "text-sky-500",
        });
      });

      // Map content requests
      (contentRequestsRes.data || []).forEach((cr: any) => {
        const conciergeName = profileMap.get(cr.created_by_concierge_id) || "A concierge";
        const clinicName = cr.clinic_id ? clinicMap.get(cr.clinic_id) || "a clinic" : "a clinic";
        const intake = cr.intake_data as any;
        const month = intake?.month || "";
        let desc = `for ${clinicName} by ${conciergeName}`;
        if (month) desc += ` (${month})`;

        activities.push({
          id: `cr-${cr.id}`,
          type: "content_request",
          label: cr.status === "generated" ? "Content generated" : `Content ${cr.status.replace("_", " ")}`,
          description: desc,
          created_at: cr.created_at,
          icon: FileText,
          color: "text-primary",
        });
      });

      // Sort by date and take top 15
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(activities.slice(0, 15));
      setLoading(false);
    };
    fetchAll();
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
            <p className="text-xs text-muted-foreground">Platform-wide events across all users</p>
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
          <ul className="divide-y divide-border/40 max-h-[420px] overflow-y-auto">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 px-4 sm:px-6 py-3 hover:bg-muted/40 transition-colors animate-fade-in"
                  style={{ animationDelay: `${320 + i * 40}ms`, animationFillMode: "both" }}
                >
                  <div className={`mt-0.5 shrink-0 ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground"> — </span>
                      <span className="text-muted-foreground">{item.description}</span>
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
