import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader, type AttachedFile } from "./FileUploader";

interface NewFormsFormProps {
  onChange: (description: string) => void;
  files: AttachedFile[];
  onFilesChange: (files: AttachedFile[]) => void;
}

export function NewFormsForm({ onChange, files, onFilesChange }: NewFormsFormProps) {
  const [formName, setFormName] = useState("");
  const [fieldsNeeded, setFieldsNeeded] = useState("");

  useEffect(() => {
    const parts = [
      `Form Name/Purpose: ${formName || "N/A"}`,
      `Fields Needed:\n${fieldsNeeded || "N/A"}`,
    ];
    onChange("New Form Request:\n" + parts.join("\n"));
  }, [formName, fieldsNeeded, onChange]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Form Name / Purpose *</Label>
        <Input placeholder="e.g. New Patient Registration Form" value={formName} onChange={e => setFormName(e.target.value)} maxLength={200} />
      </div>
      <div className="space-y-1.5">
        <Label>Fields Needed</Label>
        <Textarea placeholder="List the fields you need, e.g.&#10;- Pet name&#10;- Owner name&#10;- Phone number&#10;- Appointment type" value={fieldsNeeded} onChange={e => setFieldsNeeded(e.target.value)} rows={4} maxLength={2000} />
      </div>
      <FileUploader files={files} onFilesChange={onFilesChange} label="Attachments / Upload your own form" />
    </div>
  );
}
