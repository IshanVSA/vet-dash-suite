import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import type { SeoKeyword, UpsertSeoPayload } from "@/hooks/useSeoAnalytics";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
  onSubmit: (payload: UpsertSeoPayload) => Promise<void>;
  isSubmitting: boolean;
  defaults?: {
    month: string;
    domain_authority: number;
    backlinks: number;
    keywords_top_10: number;
    organic_traffic: number;
    top_keywords: SeoKeyword[];
  };
}

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function UpdateSeoAnalyticsDialog({ open, onOpenChange, clinicId, onSubmit, isSubmitting, defaults }: Props) {
  const [month, setMonth] = useState(defaults?.month || currentMonth());
  const [da, setDa] = useState(String(defaults?.domain_authority ?? ""));
  const [backlinks, setBacklinks] = useState(String(defaults?.backlinks ?? ""));
  const [kw10, setKw10] = useState(String(defaults?.keywords_top_10 ?? ""));
  const [traffic, setTraffic] = useState(String(defaults?.organic_traffic ?? ""));
  const [keywords, setKeywords] = useState<SeoKeyword[]>(defaults?.top_keywords || [{ keyword: "", position: 0, change: "" }]);

  const addKeyword = () => setKeywords([...keywords, { keyword: "", position: 0, change: "" }]);
  const removeKeyword = (i: number) => setKeywords(keywords.filter((_, idx) => idx !== i));
  const updateKeyword = (i: number, field: keyof SeoKeyword, val: string | number) => {
    const updated = [...keywords];
    updated[i] = { ...updated[i], [field]: val };
    setKeywords(updated);
  };

  const handleSubmit = async () => {
    if (!month) { toast.error("Month is required"); return; }
    const payload: UpsertSeoPayload = {
      clinic_id: clinicId,
      month,
      domain_authority: parseInt(da) || 0,
      backlinks: parseInt(backlinks) || 0,
      keywords_top_10: parseInt(kw10) || 0,
      organic_traffic: parseInt(traffic) || 0,
      top_keywords: keywords.filter(k => k.keyword.trim()),
    };
    try {
      await onSubmit(payload);
      toast.success("SEO analytics updated!");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save analytics");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update SEO Analytics</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Month</Label>
            <Input type="month" value={month} onChange={e => setMonth(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Domain Authority</Label>
              <Input type="number" min={0} value={da} onChange={e => setDa(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Backlinks</Label>
              <Input type="number" min={0} value={backlinks} onChange={e => setBacklinks(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Keywords Top 10</Label>
              <Input type="number" min={0} value={kw10} onChange={e => setKw10(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Organic Traffic</Label>
              <Input type="number" min={0} value={traffic} onChange={e => setTraffic(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Top Keywords</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addKeyword} className="gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {keywords.map((kw, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <Input
                    placeholder="Keyword"
                    value={kw.keyword}
                    onChange={e => updateKeyword(i, "keyword", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Pos"
                    value={kw.position || ""}
                    onChange={e => updateKeyword(i, "position", parseInt(e.target.value) || 0)}
                    className="w-16"
                  />
                  <Input
                    placeholder="+/-"
                    value={kw.change}
                    onChange={e => updateKeyword(i, "change", e.target.value)}
                    className="w-16"
                  />
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10 text-muted-foreground hover:text-destructive" onClick={() => removeKeyword(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
