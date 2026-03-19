import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddRemoveTeamFormProps {
  onChange: (description: string) => void;
}

export function AddRemoveTeamForm({ onChange }: AddRemoveTeamFormProps) {
  const [action, setAction] = useState<"add" | "remove">("add");
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");

  useEffect(() => {
    const parts = [
      `Action: ${action === "add" ? "Add" : "Remove"} Team Member`,
      `Name: ${memberName || "N/A"}`,
      `Role/Title: ${memberRole || "N/A"}`,
      action === "add" ? "(See attachments for photo)" : "",
    ].filter(Boolean);
    onChange("Team Member Update:\n" + parts.join("\n"));
  }, [action, memberName, memberRole, onChange]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Action *</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={action === "add" ? "default" : "outline"}
            className={cn("gap-2", action !== "add" && "text-muted-foreground")}
            onClick={() => setAction("add")}
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </Button>
          <Button
            type="button"
            variant={action === "remove" ? "default" : "outline"}
            className={cn("gap-2", action !== "remove" && "text-muted-foreground")}
            onClick={() => setAction("remove")}
          >
            <UserMinus className="h-4 w-4" />
            Remove Member
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Member Name *</Label>
        <Input placeholder="Full name" value={memberName} onChange={e => setMemberName(e.target.value)} maxLength={200} />
      </div>
      <div className="space-y-1.5">
        <Label>Role / Title</Label>
        <Input placeholder="e.g. Veterinarian, Technician" value={memberRole} onChange={e => setMemberRole(e.target.value)} maxLength={200} />
      </div>
      {action === "add" && (
        <p className="text-xs text-muted-foreground">Upload the team member's photo in the attachments section below.</p>
      )}
    </div>
  );
}
