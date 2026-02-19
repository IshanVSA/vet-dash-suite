import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ContentVersionCard } from "./ContentVersionCard";

interface ContentRequest {
  id: string;
  clinic_id: string;
  created_by_concierge_id: string;
  intake_data: any;
  status: string;
  created_at: string;
}

interface ContentVersion {
  id: string;
  content_request_id: string;
  model_name: string;
  generated_content: any;
  concierge_preferred: boolean;
  admin_approved: boolean;
  client_selected: boolean;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon?: string }> = {
  generated: { label: "Generated", color: "bg-accent text-accent-foreground" },
  concierge_preferred: { label: "Concierge Preferred", color: "bg-[hsl(280,65%,60%)]/15 text-[hsl(280,65%,60%)]" },
  admin_approved: { label: "Admin Approved", color: "bg-success/15 text-success" },
  client_approved: { label: "Client Approved", color: "bg-primary/15 text-primary" },
};

interface ContentRequestCardProps {
  request: ContentRequest;
  versions: ContentVersion[];
  clinicName: string;
  role: string | null;
  index: number;
  onConciergePrefer: (requestId: string, versionId: string) => void;
  onAdminApprove: (requestId: string, versionId: string) => void;
  onClientSelect: (requestId: string, versionId: string, clinicId: string) => void;
}

function ModelToggleView({
  versions,
  requestId,
  requestStatus,
  clinicId,
  role,
  onConciergePrefer,
  onAdminApprove,
  onClientSelect,
}: {
  versions: ContentVersion[];
  requestId: string;
  requestStatus: string;
  clinicId: string;
  role: string | null;
  onConciergePrefer: (requestId: string, versionId: string) => void;
  onAdminApprove: (requestId: string, versionId: string) => void;
  onClientSelect: (requestId: string, versionId: string, clinicId: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Derive labels from model names
  const labels = versions.map(v => {
    const name = v.model_name.toLowerCase();
    if (name.includes("openai") || name.includes("gpt")) return "OpenAI";
    if (name.includes("claude") || name.includes("anthropic")) return "Claude";
    return v.model_name;
  });

  const activeVersion = versions[activeIndex];
  if (!activeVersion) return null;

  return (
    <div className="space-y-4">
      {/* Toggle switch */}
      {versions.length > 1 && (
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center rounded-lg bg-muted/60 p-1 border border-border/40">
            {versions.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                  activeIndex === i
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {labels[i]}
              </button>
            ))}
          </div>
        </div>
      )}

      <ContentVersionCard
        version={activeVersion}
        requestId={requestId}
        requestStatus={requestStatus}
        clinicId={clinicId}
        role={role}
        onConciergePrefer={onConciergePrefer}
        onAdminApprove={onAdminApprove}
        onClientSelect={onClientSelect}
      />
    </div>
  );
}

export function ContentRequestCard({
  request,
  versions,
  clinicName,
  role,
  index,
  onConciergePrefer,
  onAdminApprove,
  onClientSelect,
}: ContentRequestCardProps) {
  const status = statusConfig[request.status] || { label: request.status, color: "bg-muted text-muted-foreground" };
  const intake = request.intake_data as any;
  const isComplete = request.status === "client_approved";
  const totalPosts = versions.reduce((sum, v) => {
    const content = v.generated_content as any;
    return sum + (content?.posts?.length || 1);
  }, 0);

  return (
    <Card
      className={cn(
        "animate-fade-in overflow-hidden transition-all duration-300",
        isComplete ? "border-primary/20" : "hover-lift"
      )}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
    >
      {/* Gradient top accent bar */}
      <div className={cn(
        "h-1 w-full",
        isComplete
          ? "bg-gradient-to-r from-success via-primary to-[hsl(280,65%,60%)]"
          : "bg-gradient-to-r from-primary to-[hsl(280,65%,60%)]"
      )} />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-bold text-foreground truncate">{clinicName}</h3>
              {isComplete && (
                <div className="flex items-center gap-1 bg-success/10 text-success rounded-full px-2.5 py-0.5">
                  <Check className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase">Complete</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("text-[11px] font-semibold border-0 px-3 py-1 rounded-full", status.color)}>
                {status.label}
              </Badge>
              {intake?.goal && (
                <Badge variant="outline" className="text-[11px] px-3 py-1 rounded-full border-border/50 bg-muted/40 text-foreground/70 capitalize">
                  {String(intake.goal).replace(/_/g, " ")}
                </Badge>
              )}
              {intake?.tone && (
                <Badge variant="outline" className="text-[11px] px-3 py-1 rounded-full border-border/50 bg-muted/40 text-foreground/70 capitalize">
                  {intake.tone}
                </Badge>
              )}
              {intake?.selectedMonth && (
                <Badge variant="outline" className="text-[11px] px-3 py-1 rounded-full border-border/50 bg-muted/40 text-foreground/70">
                  <Calendar className="h-3 w-3 mr-1.5 text-muted-foreground" /> {intake.selectedMonth}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[11px] text-muted-foreground font-medium">
              {format(new Date(request.created_at), "MMM d, yyyy")}
            </span>
            {totalPosts > 0 && (
              <Badge variant="secondary" className="text-[10px] font-semibold rounded-full px-2.5 py-0.5">
                <FileText className="h-3 w-3 mr-1" /> {totalPosts} posts
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {versions.length === 0 ? (
          <div className="rounded-lg bg-muted/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">No versions generated yet.</p>
          </div>
        ) : (
          <ModelToggleView
            versions={versions}
            requestId={request.id}
            requestStatus={request.status}
            clinicId={request.clinic_id}
            role={role}
            onConciergePrefer={onConciergePrefer}
            onAdminApprove={onAdminApprove}
            onClientSelect={onClientSelect}
          />
        )}
      </CardContent>
    </Card>
  );
}
