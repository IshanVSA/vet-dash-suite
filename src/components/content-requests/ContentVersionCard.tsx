import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, Check, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContentPostCard } from "./ContentPostCard";

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

interface ContentVersionCardProps {
  version: ContentVersion;
  requestId: string;
  requestStatus: string;
  clinicId: string;
  role: string | null;
  onConciergePrefer: (requestId: string, versionId: string) => void;
  onAdminApprove: (requestId: string, versionId: string) => void;
  onClientSelect: (requestId: string, versionId: string, clinicId: string) => void;
}

function MultiPostBlock({ posts }: { posts: any[] }) {
  const [allExpanded, setAllExpanded] = useState(false);
  const [key, setKey] = useState(0);

  const toggleAll = () => {
    setAllExpanded(v => !v);
    setKey(k => k + 1); // force re-mount to reset individual states
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary/60" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {posts.length} Posts for the Month
          </p>
        </div>
        <button
          onClick={toggleAll}
          className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          {allExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
      </div>
      <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
        {posts.map((post: any, i: number) => (
          <ContentPostCard key={i} post={post} index={i} defaultOpen={allExpanded} />
        ))}
      </div>
    </div>
  );
}

function renderContentBlock(content: any) {
  if (!content) return <p className="text-sm text-muted-foreground">No content generated</p>;

  if (content.posts && Array.isArray(content.posts)) {
    return <MultiPostBlock posts={content.posts} />;
  }

  // Legacy single-post format
  return (
    <div className="space-y-3 text-sm">
      {content.caption && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Caption</p>
          <p className="text-foreground">{content.caption}</p>
        </div>
      )}
      {content.main_copy && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Main Copy</p>
          <p className="text-foreground">{content.main_copy}</p>
        </div>
      )}
      {content.cta && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Call to Action</p>
          <p className="text-foreground font-medium">{content.cta}</p>
        </div>
      )}
      {content.hashtags && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Hashtags</p>
          <p className="text-primary text-xs">{content.hashtags}</p>
        </div>
      )}
    </div>
  );
}

export function ContentVersionCard({
  version,
  requestId,
  requestStatus,
  clinicId,
  role,
  onConciergePrefer,
  onAdminApprove,
  onClientSelect,
}: ContentVersionCardProps) {
  const isHighlighted = version.concierge_preferred || version.admin_approved || version.client_selected;

  return (
    <div className={cn(
      "glass-card rounded-xl p-5 space-y-4 transition-all duration-300",
      version.client_selected && "ring-2 ring-primary/30 border-primary/40 bg-primary/5",
      version.admin_approved && !version.client_selected && "ring-1 ring-success/30 border-success/30",
      version.concierge_preferred && !version.admin_approved && !version.client_selected && "ring-1 ring-[hsl(280,65%,60%)]/30 border-[hsl(280,65%,60%)]/30",
      !isHighlighted && "hover:border-primary/20"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-gradient-to-r from-primary to-[hsl(280,65%,60%)] text-primary-foreground text-[10px] font-bold border-0 shadow-sm">
            {version.model_name}
          </Badge>
          {version.concierge_preferred && (
            <Badge className="bg-[hsl(280,65%,60%)]/15 text-[hsl(280,65%,60%)] border-[hsl(280,65%,60%)]/20 text-[10px] font-semibold">
              <Star className="h-3 w-3 mr-1 fill-current" /> Concierge Pick
            </Badge>
          )}
          {version.admin_approved && (
            <Badge className="bg-success/15 text-success border-success/20 text-[10px] font-semibold">
              <ThumbsUp className="h-3 w-3 mr-1" /> Approved
            </Badge>
          )}
          {version.client_selected && (
            <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px] font-semibold">
              <Check className="h-3 w-3 mr-1" /> Selected
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      {renderContentBlock(version.generated_content)}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-border/40">
        {role === "concierge" && requestStatus === "generated" && !version.concierge_preferred && (
          <Button size="sm" variant="outline" className="text-xs hover:bg-[hsl(280,65%,60%)]/10 hover:text-[hsl(280,65%,60%)] hover:border-[hsl(280,65%,60%)]/30" onClick={() => onConciergePrefer(requestId, version.id)}>
            <Star className="h-3.5 w-3.5 mr-1" /> Mark Preferred
          </Button>
        )}
        {role === "admin" && !version.admin_approved && ["generated", "concierge_preferred"].includes(requestStatus) && (
          <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground text-xs shadow-sm" onClick={() => onAdminApprove(requestId, version.id)}>
            <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approve
          </Button>
        )}
        {role === "client" && requestStatus === "admin_approved" && !version.client_selected && (
          <Button size="sm" className="text-xs shadow-sm" onClick={() => onClientSelect(requestId, version.id, clinicId)}>
            <Check className="h-3.5 w-3.5 mr-1" /> Select This
          </Button>
        )}
      </div>
    </div>
  );
}
