import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface NewFormsFormProps {
  onChange: (description: string) => void;
}

export function NewFormsForm({ onChange }: NewFormsFormProps) {
  const [formName, setFormName] = useState("");
  const [fieldsNeeded, setFieldsNeeded] = useState("");
  const [placement, setPlacement] = useState("");
  const [requirements, setRequirements] = useState("");

  useEffect(() => {
    const parts = [
      `Form Name/Purpose: ${formName || "N/A"}`,
      `Fields Needed:\n${fieldsNeeded || "N/A"}`,
      `Placement on Site: ${placement || "N/A"}`,
      `Special Requirements: ${requirements || "None"}`,
    ];
    onChange("New Form Request:\n" + parts.join("\n"));
  }, [formName, fieldsNeeded, placement, requirements, onChange]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Form Name / Purpose *</Label>
        <Input placeholder="e.g. New Patient Registration Form" value={formName} onChange={e => setFormName(e.target.value)} maxLength={200} />
      </div>
      <div className="space-y-1.5">
        <Label>Fields Needed *</Label>
        <Textarea placeholder="List the fields you need, e.g.&#10;- Pet name&#10;- Owner name&#10;- Phone number&#10;- Appointment type" value={fieldsNeeded} onChange={e => setFieldsNeeded(e.target.value)} rows={4} maxLength={2000} />
      </div>
      <div className="space-y-1.5">
        <Label>Where to Place on Site</Label>
        <Input placeholder="e.g. Contact page, Homepage sidebar" value={placement} onChange={e => setPlacement(e.target.value)} maxLength={200} />
      </div>
      <div className="space-y-1.5">
        <Label>Special Requirements</Label>
        <Textarea placeholder="Any additional requirements (e.g. email notifications, file uploads)..." value={requirements} onChange={e => setRequirements(e.target.value)} rows={2} maxLength={1000} />
      </div>
    </div>
  );
}
