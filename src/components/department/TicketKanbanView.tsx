import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, AlertTriangle, CheckCircle2, Inbox, UserCircle, GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TeamMemberOption {
  id: string;
  name: string;
}

interface KanbanTicket {
  id: string;
  title: string;
  ticket_type: string;
  priority: "regular" | "urgent" | "emergency";
  status: "open" | "in_progress" | "completed" | "emergency";
  description?: string | null;
  department: string;
  created_at: string;
  assigned_to?: string | null;
}

interface TicketKanbanViewProps {
  tickets: KanbanTicket[];
  teamMembers: TeamMemberOption[];
  onUpdated: () => void;
}

const columns: { key: string; label: string; icon: React.ElementType; color: string; headerBg: string }[] = [
  { key: "open", label: "Open", icon: Inbox, color: "text-blue-500", headerBg: "bg-blue-500/10 border-blue-500/30" },
  { key: "in_progress", label: "In Progress", icon: Clock, color: "text-amber-500", headerBg: "bg-amber-500/10 border-amber-500/30" },
  { key: "completed", label: "Completed", icon: CheckCircle2, color: "text-emerald-500", headerBg: "bg-emerald-500/10 border-emerald-500/30" },
  { key: "emergency", label: "Emergency", icon: AlertTriangle, color: "text-destructive", headerBg: "bg-destructive/10 border-destructive/30" },
];

const priorityDot: Record<string, string> = {
  regular: "bg-muted-foreground",
  urgent: "bg-amber-500",
  emergency: "bg-destructive",
};

const deptLabels: Record<string, string> = {
  website: "Website",
  seo: "SEO",
  google_ads: "Google Ads",
  social_media: "Social Media",
};

export function TicketKanbanView({ tickets, teamMembers, onUpdated }: TicketKanbanViewProps) {
  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    const { error } = await supabase
      .from("department_tickets" as any)
      .update({ status: newStatus } as any)
      .eq("id", ticketId);
    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Status updated`);
      onUpdated();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map(col => {
        const Icon = col.icon;
        const colTickets = tickets.filter(t => t.status === col.key);
        return (
          <div key={col.key} className="flex flex-col min-h-[300px]">
            {/* Column header */}
            <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-lg border mb-3", col.headerBg)}>
              <Icon className={cn("h-4 w-4", col.color)} />
              <span className="text-sm font-semibold text-foreground">{col.label}</span>
              <span className="ml-auto text-xs font-medium text-muted-foreground bg-background/60 px-2 py-0.5 rounded-full">
                {colTickets.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2">
              {colTickets.length === 0 ? (
                <div className="flex items-center justify-center h-24 rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground">
                  No tickets
                </div>
              ) : (
                colTickets.map(t => {
                  const assignee = t.assigned_to ? teamMembers.find(m => m.id === t.assigned_to)?.name : null;
                  return (
                    <Card
                      key={t.id}
                      className="p-3 hover:shadow-md transition-shadow cursor-default group"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", priorityDot[t.priority])} />
                        <h4 className="text-sm font-medium text-foreground leading-tight line-clamp-2">{t.title}</h4>
                      </div>

                      {t.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 pl-4">{t.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-1 mb-2 pl-4">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t.ticket_type}</Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{deptLabels[t.department] || t.department}</Badge>
                      </div>

                      <div className="flex items-center justify-between pl-4">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                        </span>
                        {assignee ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-primary/20">
                            <UserCircle className="h-2.5 w-2.5 mr-0.5" />{assignee}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                        )}
                      </div>

                      {/* Quick status change on hover */}
                      <div className="mt-2 pt-2 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Select value={t.status} onValueChange={(v) => handleStatusChange(t.id, v)}>
                          <SelectTrigger className="h-6 text-[11px] w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open" className="text-xs">Open</SelectItem>
                            <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
                            <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
