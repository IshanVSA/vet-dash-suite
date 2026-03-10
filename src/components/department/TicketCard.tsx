import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, AlertTriangle, CheckCircle2, Inbox, ChevronDown, ChevronUp, ArrowRightLeft, UserCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TeamMemberOption {
  id: string;
  name: string;
}

interface TicketCardProps {
  id: string;
  title: string;
  ticket_type: string;
  priority: "regular" | "urgent" | "emergency";
  status: "open" | "in_progress" | "completed" | "emergency";
  description?: string | null;
  department: string;
  created_at: string;
  assigned_to?: string | null;
  teamMembers?: TeamMemberOption[];
  onUpdated?: () => void;
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

const allDepartments = [
  { value: "website", label: "Website" },
  { value: "seo", label: "SEO" },
  { value: "google_ads", label: "Google Ads" },
  { value: "social_media", label: "Social Media" },
];

const statusOptions: { value: string; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export function TicketCard({ id, title, ticket_type, priority, status, description, department, created_at, assigned_to, teamMembers = [], onUpdated }: TicketCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  const sc = statusConfig[status];
  const pc = priorityConfig[priority];
  const StatusIcon = sc.icon;

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from("department_tickets" as any)
      .update({ status: newStatus } as any)
      .eq("id", id);
    setUpdating(false);
    if (error) {
      toast.error("Failed to update status");
      console.error(error);
    } else {
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      onUpdated?.();
    }
  };

  const handleDepartmentChange = async (newDept: string) => {
    if (newDept === department) return;
    setUpdating(true);
    const { error } = await supabase
      .from("department_tickets" as any)
      .update({ department: newDept } as any)
      .eq("id", id);
    setUpdating(false);
    if (error) {
      toast.error("Failed to reassign department");
      console.error(error);
    } else {
      toast.success(`Ticket moved to ${allDepartments.find(d => d.value === newDept)?.label}`);
      onUpdated?.();
    }
  };

  const handleAssigneeChange = async (userId: string) => {
    const value = userId === "unassigned" ? null : userId;
    setUpdating(true);
    const { error } = await supabase
      .from("department_tickets" as any)
      .update({ assigned_to: value } as any)
      .eq("id", id);
    setUpdating(false);
    if (error) {
      toast.error("Failed to assign team member");
      console.error(error);
    } else {
      const name = value ? teamMembers.find(m => m.id === value)?.name ?? "member" : "nobody";
      toast.success(`Ticket assigned to ${name}`);
      onUpdated?.();
    }
  };

  const assigneeName = assigned_to ? teamMembers.find(m => m.id === assigned_to)?.name : null;

  return (
    <Card className={`overflow-hidden transition-all ${updating ? "opacity-60 pointer-events-none" : "hover-lift"}`}>
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
              {assigneeName && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                  <UserCircle className="h-3 w-3 mr-1" />{assigneeName}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Status:</span>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-7 text-xs w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Dept:</span>
              <Select value={department} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="h-7 text-xs w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allDepartments.map(d => (
                    <SelectItem key={d.value} value={d.value} className="text-xs">{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
