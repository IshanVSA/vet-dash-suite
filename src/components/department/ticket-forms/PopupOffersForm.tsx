import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Shield, ShieldCheck, ShieldAlert, Loader2, AlertTriangle, Lightbulb } from "lucide-react";

interface PopupOffersFormProps {
  onChange: (description: string) => void;
  onConsentChange: (consented: boolean) => void;
  clinicId?: string;
}

const PROVINCE_MAP: Record<string, string> = {
  AB: "ABVMA (Alberta Veterinary Medical Association)",
  BC: "CVBC (College of Veterinarians of British Columbia)",
  ON: "CVO (College of Veterinarians of Ontario)",
  SK: "SVMA (Saskatchewan Veterinary Medical Association)",
  MB: "MVMA (Manitoba Veterinary Medical Association)",
  QC: "OMVQ (Ordre des médecins vétérinaires du Québec)",
  NS: "NSVMA (Nova Scotia Veterinary Medical Association)",
  NB: "NBVMA (New Brunswick Veterinary Medical Association)",
  PE: "PEIVMA (PEI Veterinary Medical Association)",
  NL: "NLVMA (Newfoundland & Labrador Veterinary Medical Association)",
  NT: "AVMA (general)",
  NU: "AVMA (general)",
  YT: "AVMA (general)",
};

function detectComplianceBody(address: string): string {
  if (!address) return "General Veterinary Advertising Standards";
  const upper = address.toUpperCase();

  // Check Canadian provinces
  for (const [code, body] of Object.entries(PROVINCE_MAP)) {
    // Match province code in postal-style addresses or spelled out
    const patterns = [
      new RegExp(`\\b${code}\\b`),
      new RegExp(`\\b${code}\\s+[A-Z]\\d[A-Z]`, "i"),
    ];
    if (patterns.some(p => p.test(upper))) return body;
  }

  // Common province names
  const nameMap: Record<string, string> = {
    ALBERTA: "AB", BRITISH_COLUMBIA: "BC", "BRITISH COLUMBIA": "BC",
    ONTARIO: "ON", SASKATCHEWAN: "SK", MANITOBA: "MB", QUEBEC: "QC",
    "NOVA SCOTIA": "NS", "NEW BRUNSWICK": "NB",
    "PRINCE EDWARD ISLAND": "PE", NEWFOUNDLAND: "NL",
  };
  for (const [name, code] of Object.entries(nameMap)) {
    if (upper.includes(name)) return PROVINCE_MAP[code];
  }

  return "General Veterinary Advertising Standards";
}

export function PopupOffersForm({ onChange, onConsentChange, clinicId }: PopupOffersFormProps) {
  const [offerTitle, setOfferTitle] = useState("");
  const [offerText, setOfferText] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [clinicAddress, setClinicAddress] = useState("");
  const [complianceBody, setComplianceBody] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    compliant: boolean;
    issues: string[];
    suggestions: string[];
  } | null>(null);
  const [consented, setConsented] = useState(false);

  // Fetch clinic address
  useEffect(() => {
    if (!clinicId) return;
    supabase
      .from("clinics")
      .select("address")
      .eq("id", clinicId)
      .single()
      .then(({ data }) => {
        const addr = data?.address || "";
        setClinicAddress(addr);
        setComplianceBody(detectComplianceBody(addr));
      });
  }, [clinicId]);

  // Emit description
  useEffect(() => {
    const parts = [
      `Offer Title: ${offerTitle || "N/A"}`,
      `Offer Description: ${offerText || "N/A"}`,
      `Terms & Conditions: ${termsAndConditions || "None"}`,
      `Additional Notes: ${additionalNotes || "None"}`,
      `Start Date: ${startDate || "N/A"}`,
      `End Date: ${endDate || "N/A"}`,
      `Compliance Body: ${complianceBody || "N/A"}`,
      `Verified: ${verified ? "Yes" : "No"}`,
    ];
    onChange("Pop-up Offer Details:\n" + parts.join("\n"));
  }, [offerTitle, offerText, termsAndConditions, startDate, endDate, complianceBody, verified, onChange]);

  // Reset verification when form changes
  const handleFieldChange = useCallback(() => {
    if (verified) {
      setVerified(false);
      setVerificationResult(null);
      setConsented(false);
      onConsentChange(false);
    }
  }, [verified, onConsentChange]);

  const handleVerify = async () => {
    if (!offerTitle.trim()) return;
    setVerifying(true);
    setVerificationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("verify-popup-offer", {
        body: {
          offerTitle,
          offerText,
          termsAndConditions,
          startDate,
          endDate,
          complianceBody,
        },
      });

      if (error) throw error;

      setVerificationResult(data);
      setVerified(data.compliant === true);
    } catch (err) {
      console.error("Verification error:", err);
      setVerificationResult({
        compliant: false,
        issues: ["Verification service unavailable. Please try again."],
        suggestions: [],
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleConsentChange = (checked: boolean) => {
    setConsented(checked);
    onConsentChange(checked);
  };

  const canVerify = offerTitle.trim() && startDate && endDate;
  const locked = consented;

  return (
    <div className="space-y-4">
      {/* Offer Title */}
      <div className="space-y-1.5">
        <Label>Offer Title *</Label>
        <Input
          placeholder="e.g. Spring Sale 20% Off"
          value={offerTitle}
          onChange={e => { setOfferTitle(e.target.value); handleFieldChange(); }}
          maxLength={200}
          disabled={locked}
        />
      </div>

      {/* Offer Description */}
      <div className="space-y-1.5">
        <Label>Offer Description</Label>
        <Textarea
          placeholder="Describe the offer details..."
          value={offerText}
          onChange={e => { setOfferText(e.target.value); handleFieldChange(); }}
          rows={2}
          maxLength={1000}
          disabled={locked}
        />
      </div>

      {/* Terms & Conditions */}
      <div className="space-y-1.5">
        <Label>Terms &amp; Conditions</Label>
        <Textarea
          placeholder="e.g. Valid for new clients only. Cannot be combined with other offers..."
          value={termsAndConditions}
          onChange={e => { setTermsAndConditions(e.target.value); handleFieldChange(); }}
          rows={2}
          maxLength={2000}
          disabled={locked}
        />
      </div>

      {/* Start & End Date */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); handleFieldChange(); }}
            disabled={locked}
          />
        </div>
        <div className="space-y-1.5">
          <Label>End Date *</Label>
          <Input
            type="date"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); handleFieldChange(); }}
            disabled={locked}
          />
        </div>
      </div>

      {/* Compliance Body */}
      {complianceBody && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          <span>Compliance: <strong className="text-foreground">{complianceBody}</strong></span>
        </div>
      )}

      {/* Verify Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!canVerify || verifying || locked}
        onClick={handleVerify}
      >
        {verifying ? (
          <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Verifying…</>
        ) : verified ? (
          <><ShieldCheck className="h-4 w-4 mr-1.5 text-primary" /> Verified — Re-verify</>
        ) : (
          <><Shield className="h-4 w-4 mr-1.5" /> Verify Offer Compliance</>
        )}
      </Button>

      {/* Verification Result */}
      {verificationResult && (
        <div className={`rounded-lg border p-3 space-y-2 text-sm ${
          verificationResult.compliant
            ? "border-primary/30 bg-primary/5"
            : "border-destructive/30 bg-destructive/5"
        }`}>
          <div className="flex items-center gap-2 font-medium">
            {verificationResult.compliant ? (
              <><ShieldCheck className="h-4 w-4 text-primary" /> Offer is compliant</>
            ) : (
              <><ShieldAlert className="h-4 w-4 text-destructive" /> Compliance issues found</>
            )}
          </div>

          {verificationResult.issues.length > 0 && (
            <div className="space-y-1">
              {verificationResult.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-destructive">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}

          {verificationResult.suggestions.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground">Suggestions:</p>
              {verificationResult.suggestions.map((sug, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Lightbulb className="h-3 w-3 mt-0.5 shrink-0 text-accent-foreground" />
                  <span>{sug}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Consent Checkbox */}
      <div className={`flex items-start gap-2 rounded-md border p-3 ${
        !verified ? "opacity-50" : ""
      }`}>
        <Checkbox
          id="popup-consent"
          checked={consented}
          onCheckedChange={(checked) => handleConsentChange(checked === true)}
          disabled={!verified}
          className="mt-0.5"
        />
        <label htmlFor="popup-consent" className="text-xs leading-relaxed cursor-pointer select-none">
          I acknowledge that all information provided for this pop-up offer is correct and compliant
          with <strong>{complianceBody || "applicable regulatory"}</strong> regulations. I confirm
          the offer details, terms, and dates are accurate.
        </label>
      </div>
    </div>
  );
}
