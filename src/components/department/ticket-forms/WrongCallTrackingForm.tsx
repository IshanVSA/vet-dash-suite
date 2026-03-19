import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceDictation } from "./VoiceDictation";

interface WrongCallTrackingFormProps {
  onChange: (description: string) => void;
}

const TRACKING_ISSUES = ["Wrong Number Displayed", "Calls Attributed to Wrong Campaign", "Tracking Number Not Working", "Missing Call Recordings", "Incorrect Call Duration", "Other"];

export function WrongCallTrackingForm({ onChange }: WrongCallTrackingFormProps) {
  const [trackingIssue, setTrackingIssue] = useState("");
  const [affectedNumber, setAffectedNumber] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");

  useEffect(() => {
    const parts = [
      `Tracking Issue: ${trackingIssue || "N/A"}`,
      `Affected Number: ${affectedNumber || "N/A"}`,
      `Expected Behavior: ${expectedBehavior || "N/A"}`,
      `Actual Behavior: ${actualBehavior || "N/A"}`,
    ];
    onChange("Wrong Call Tracking Report:\n" + parts.join("\n"));
  }, [trackingIssue, affectedNumber, expectedBehavior, actualBehavior, onChange]);

  const handleAutofill = useCallback((fields: Record<string, any>) => {
    if (fields.trackingIssue) setTrackingIssue(fields.trackingIssue);
    if (fields.affectedNumber) setAffectedNumber(fields.affectedNumber);
    if (fields.expectedBehavior) setExpectedBehavior(fields.expectedBehavior);
    if (fields.actualBehavior) setActualBehavior(fields.actualBehavior);
  }, []);

  return (
    <div className="space-y-3">
      <VoiceDictation formType="Wrong Call Tracking" onFieldsExtracted={handleAutofill} />
      <div className="space-y-1.5">
        <Label>Issue Type *</Label>
        <Select value={trackingIssue} onValueChange={setTrackingIssue}>
          <SelectTrigger><SelectValue placeholder="Select tracking issue" /></SelectTrigger>
          <SelectContent>
            {TRACKING_ISSUES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Affected Phone Number</Label>
        <Input placeholder="e.g. (555) 123-4567" value={affectedNumber} onChange={e => setAffectedNumber(e.target.value)} maxLength={30} />
      </div>
      <div className="space-y-1.5">
        <Label>Expected Behavior *</Label>
        <Textarea placeholder="What should be happening with call tracking?" value={expectedBehavior} onChange={e => setExpectedBehavior(e.target.value)} rows={2} maxLength={1000} />
      </div>
      <div className="space-y-1.5">
        <Label>Actual Behavior *</Label>
        <Textarea placeholder="What is actually happening instead?" value={actualBehavior} onChange={e => setActualBehavior(e.target.value)} rows={2} maxLength={1000} />
      </div>
    </div>
  );
}
