import { Badge } from "@/components/ui/badge";
import type { AppRole } from "@/hooks/useUserRole";

const roleConfig: Record<AppRole, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-primary text-primary-foreground" },
  concierge: { label: "Concierge", className: "bg-accent text-accent-foreground" },
  client: { label: "Client", className: "bg-secondary text-secondary-foreground" },
};

export function RoleBadge({ role }: { role: AppRole }) {
  const config = roleConfig[role];
  return <Badge className={config.className}>{config.label}</Badge>;
}
