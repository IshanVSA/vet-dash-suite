import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Inbox } from "lucide-react";
import { TicketCard } from "./TicketCard";
import { NewTicketDialog } from "./NewTicketDialog";
import { useDepartmentTeam } from "@/hooks/useDepartmentTeam";

interface TicketsTabProps {
  department: string;
  services: string[];
  clinicId?: string;
}

const statusFilters = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "emergency", label: "Emergency" },
];

export function TicketsTab({ department, services, clinicId }: TicketsTabProps) {
  const [filter, setFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch team members for assignment dropdown
  const { data: teamMemberProfiles = [] } = useQuery({
    queryKey: ["dept-team-profiles", department, clinicId],
    queryFn: async () => {
      const departmentRoleMap: Record<string, string[]> = {
        website: ["Developer", "Maintenance"],
        seo: ["SEO Lead"],
        google_ads: ["Ads Strategist", "Ads Analyst"],
        social_media: ["Social & Concierge"],
      };
      const allowedRoles = departmentRoleMap[department] || [];
      if (!allowedRoles.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, team_role")
        .in("team_role", allowedRoles);
      if (!profiles?.length) return [];

      // Filter by clinic assignment if clinicId provided
      let filtered = profiles;
      if (clinicId) {
        const { data: assignments } = await (supabase
          .from("clinic_team_members" as any)
          .select("user_id")
          .eq("clinic_id", clinicId) as any);
        const assignedIds = new Set(((assignments || []) as { user_id: string }[]).map(a => a.user_id));
        filtered = profiles.filter(p => assignedIds.has(p.id));
      }

      return filtered.map(p => ({ id: p.id, name: p.full_name || p.email || "Unknown" }));
    },
  });

  const { data: tickets = [], refetch, isLoading } = useQuery({
    queryKey: ["department-tickets", department, filter, clinicId],
    queryFn: async () => {
      let query = supabase
        .from("department_tickets" as any)
        .select("*")
        .eq("department", department)
        .order("created_at", { ascending: false });

      if (clinicId) {
        query = query.eq("clinic_id", clinicId);
      }

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          {statusFilters.map(sf => (
            <Badge
              key={sf.value}
              variant={filter === sf.value ? "default" : "outline"}
              className="cursor-pointer shrink-0 px-3 py-1.5 text-xs"
              onClick={() => setFilter(sf.value)}
            >
              {sf.label}
            </Badge>
          ))}
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} className="shrink-0 gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          New Ticket
        </Button>
      </div>

      {/* Ticket list */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
          <Inbox className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm font-medium">No tickets found</p>
          <p className="text-xs mt-1">Create a new ticket to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t: any) => (
            <TicketCard
              key={t.id}
              id={t.id}
              title={t.title}
              ticket_type={t.ticket_type}
              priority={t.priority}
              status={t.status}
              description={t.description}
              department={t.department}
              created_at={t.created_at}
              onUpdated={() => refetch()}
            />
          ))}
        </div>
      )}

      <NewTicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        department={department}
        services={services}
        onCreated={() => refetch()}
        clinicId={clinicId}
      />
    </div>
  );
}
