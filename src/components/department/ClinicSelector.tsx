import { Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClinicOption } from "@/hooks/useClinicSelector";

interface ClinicSelectorProps {
  clinics: ClinicOption[];
  selectedClinicId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
}

export function ClinicSelector({ clinics, selectedClinicId, onSelect, loading }: ClinicSelectorProps) {
  if (loading) {
    return (
      <div className="h-10 w-64 bg-muted/50 rounded-lg animate-pulse" />
    );
  }

  if (clinics.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        No clinics available
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select value={selectedClinicId} onValueChange={onSelect}>
        <SelectTrigger className="w-[240px] sm:w-[280px] h-9 text-sm">
          <SelectValue placeholder="Select a clinic" />
        </SelectTrigger>
        <SelectContent>
          {clinics.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.clinic_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
