import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddRemoveTeamFormProps {
  onChange: (description: string) => void;
}

export function AddRemoveTeamForm({ onChange }: AddRemoveTeamFormProps) {
  const [action, setAction] = useState<"add" | "remove">("add");
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");

  useEffect(() => {
    const parts = [
      `Action: ${action === "add" ? "Add" : "Remove"} Team Member`,
      `Name: ${memberName || "N/A"}`,
      `Role/Title: ${memberRole || "N/A"}`,
      `Email: ${memberEmail || "N/A"}`,
      `Phone: ${memberPhone || "N/A"}`,
      action === "add" ? "(See attachments for photo)" : "",
    ].filter(Boolean);
    onChange("Team Member Update:\n" + parts.join("\n"));
  }, [action, memberName, memberRole, memberEmail, memberPhone, onChange]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Action *</Label>
        <Select value={action} onValueChange={v => setAction(v as "add" | "remove")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="add">Add Team Member</SelectItem>
            <SelectItem value="remove">Remove Team Member</SelectItem>
          </SelectContent>
        </Select>
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" placeholder="Email address" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} maxLength={255} />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input type="tel" placeholder="Phone number" value={memberPhone} onChange={e => setMemberPhone(e.target.value)} maxLength={20} />
          </div>
        </div>
      )}
      {action === "add" && (
        <p className="text-xs text-muted-foreground">Upload the team member's photo in the attachments section below.</p>
      )}
    </div>
  );
}
