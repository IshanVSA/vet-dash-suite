import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PriceListFormProps {
  onChange: (description: string) => void;
}

export function PriceListForm({ onChange }: PriceListFormProps) {
  const [changes, setChanges] = useState("");

  useEffect(() => {
    const parts = [
      `Description of Changes: ${changes || "N/A"}`,
      "(See attachments for updated price list file)",
    ];
    onChange("Price List Update:\n" + parts.join("\n"));
  }, [changes, onChange]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Description of Changes *</Label>
        <Textarea placeholder="Describe what prices changed, new services added, etc..." value={changes} onChange={e => setChanges(e.target.value)} rows={3} maxLength={2000} />
      </div>
      <p className="text-xs text-muted-foreground">Upload your updated price list (PDF, Excel, or image) in the attachments section below.</p>
    </div>
  );
}
