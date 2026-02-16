import { Badge } from "@/components/ui/badge";
import type { AppRole } from "@/hooks/useUserRole";

const roleConfig: Record<AppRole, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-primary/10 text-primary border-primary/20" },
  concierge: { label: "Concierge", className: "bg-warning/10 text-warning border-warning/20" },
  client: { label: "Client", className: "bg-success/10 text-success border-success/20" },
};

export function RoleBadge({ role }: { role: AppRole }) {
  const config = roleConfig[role];
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}
