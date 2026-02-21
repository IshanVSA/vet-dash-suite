export interface ContentPost {
  id: string;
  clinic_id: string;
  title: string;
  caption: string | null;
  content: string | null;
  platform: string;
  content_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  tags: string[];
  compliance_note: string | null;
  workflow_stage: string;
  flag_reason: string | null;
}

export interface PostWorkflow {
  id: string;
  post_id: string;
  stage: string;
  sent_to_client_at: string | null;
  auto_approve_at: string | null;
  updated_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  visibility: "all" | "internal" | "concierge_only";
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

export interface PostActivityLog {
  id: string;
  post_id: string;
  action: string;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type WorkflowStage =
  | "draft"
  | "generated"
  | "concierge_preferred"
  | "sent_to_admin"
  | "admin_approved"
  | "sent_to_client"
  | "client_approved"
  | "auto_approved"
  | "flagged";

export type CalendarView = "list" | "calendar" | "weekly";

export const WORKFLOW_STAGES: { key: WorkflowStage; label: string; color: string }[] = [
  { key: "generated", label: "Generated", color: "hsl(220, 9%, 46%)" },
  { key: "concierge_preferred", label: "Preferred", color: "hsl(245, 58%, 51%)" },
  { key: "sent_to_admin", label: "To Admin", color: "hsl(38, 92%, 50%)" },
  { key: "admin_approved", label: "Admin OK", color: "hsl(152, 69%, 41%)" },
  { key: "sent_to_client", label: "To Client", color: "hsl(221, 83%, 53%)" },
  { key: "client_approved", label: "Approved", color: "hsl(142, 71%, 45%)" },
  { key: "auto_approved", label: "Auto", color: "hsl(271, 91%, 65%)" },
];

export const STAGE_BORDER_COLORS: Record<string, string> = {
  draft: "border-l-muted-foreground/30",
  generated: "border-l-muted-foreground",
  concierge_preferred: "border-l-indigo-500",
  sent_to_admin: "border-l-amber-500",
  admin_approved: "border-l-emerald-500",
  sent_to_client: "border-l-blue-500",
  client_approved: "border-l-green-500",
  auto_approved: "border-l-purple-500",
  flagged: "border-l-destructive",
};

export const STAGE_BADGE_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  generated: "bg-muted text-muted-foreground",
  concierge_preferred: "bg-indigo-500/15 text-indigo-400",
  sent_to_admin: "bg-amber-500/15 text-amber-400",
  admin_approved: "bg-emerald-500/15 text-emerald-400",
  sent_to_client: "bg-blue-500/15 text-blue-400",
  client_approved: "bg-green-500/15 text-green-400",
  auto_approved: "bg-purple-500/15 text-purple-400",
  flagged: "bg-destructive/15 text-destructive",
};

export const STAGE_LABELS: Record<string, string> = {
  draft: "Draft",
  generated: "Generated",
  concierge_preferred: "Concierge Preferred",
  sent_to_admin: "Sent to Admin",
  admin_approved: "Admin Approved",
  sent_to_client: "Sent to Client",
  client_approved: "Client Approved",
  auto_approved: "Auto Approved",
  flagged: "Flagged",
};
