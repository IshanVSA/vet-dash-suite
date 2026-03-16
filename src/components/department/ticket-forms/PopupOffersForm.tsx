import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PopupOffersFormProps {
  onChange: (description: string) => void;
}

export function PopupOffersForm({ onChange }: PopupOffersFormProps) {
  const [offerTitle, setOfferTitle] = useState("");
  const [offerText, setOfferText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetPage, setTargetPage] = useState("");

  useEffect(() => {
    const parts = [
      `Offer Title: ${offerTitle || "N/A"}`,
      `Offer Description: ${offerText || "N/A"}`,
      `Start Date: ${startDate || "N/A"}`,
      `End Date: ${endDate || "N/A"}`,
      `Target Page: ${targetPage || "All pages"}`,
    ];
    onChange("Pop-up Offer Details:\n" + parts.join("\n"));
  }, [offerTitle, offerText, startDate, endDate, targetPage, onChange]);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Offer Title *</Label>
        <Input placeholder="e.g. Spring Sale 20% Off" value={offerTitle} onChange={e => setOfferTitle(e.target.value)} maxLength={200} />
      </div>
      <div className="space-y-1.5">
        <Label>Offer Description</Label>
        <Textarea placeholder="Describe the offer details..." value={offerText} onChange={e => setOfferText(e.target.value)} rows={2} maxLength={1000} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Target Page</Label>
        <Input placeholder="e.g. Homepage, All pages, /services" value={targetPage} onChange={e => setTargetPage(e.target.value)} maxLength={200} />
      </div>
    </div>
  );
}
