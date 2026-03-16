import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ThemeUpdatesFormProps {
  onChange: (description: string) => void;
}

export function ThemeUpdatesForm({ onChange }: ThemeUpdatesFormProps) {
  const [changes, setChanges] = useState("");
  const [colorPrefs, setColorPrefs] = useState("");

  useEffect(() => {
    const parts = [
      `Description of Changes: ${changes || "N/A"}`,
      `Color Preferences: ${colorPrefs || "N/A"}`,
      "(See attachments for reference images)",
    ];
    onChange("Theme Update Details:\n" + parts.join("\n"));
  }, [changes, colorPrefs, onChange]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Description of Changes *</Label>
        <Textarea placeholder="Describe what theme changes you'd like (fonts, layout, colors, etc.)..." value={changes} onChange={e => setChanges(e.target.value)} rows={3} maxLength={2000} />
      </div>
      <div className="space-y-1.5">
        <Label>Color Preferences</Label>
        <Input placeholder="e.g. Navy blue header, lighter background" value={colorPrefs} onChange={e => setColorPrefs(e.target.value)} maxLength={500} />
      </div>
      <p className="text-xs text-muted-foreground">Upload reference images or screenshots in the attachments section below.</p>
    </div>
  );
}
