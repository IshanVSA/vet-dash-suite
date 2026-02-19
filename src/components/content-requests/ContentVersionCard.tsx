import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, Check, ChevronDown } from "lucide-react";
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

const INITIAL_VISIBLE = 3;

function StrategySummary({ summary }: { summary: any }) {
  if (!summary) return null;

  return (
    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/40">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">📊 Strategy Summary</p>

      {summary.content_mix && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Content Mix</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(summary.content_mix).map(([key, val]) => (
              <Badge key={key} variant="outline" className="text-[10px] py-0 capitalize">
                {key}: {val as number}%
              </Badge>
            ))}
          </div>
        </div>
      )}

      {summary.format_distribution && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Format Distribution</p>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(summary.format_distribution).map(([key, val]) => (
              <Badge key={key} variant="secondary" className="text-[10px] py-0 capitalize">
                {key}: {val as number}%
              </Badge>
            ))}
          </div>
        </div>
      )}

      {summary.goal_alignment && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Goal Alignment</p>
          <p className="text-xs text-foreground/80">{summary.goal_alignment}</p>
        </div>
      )}

      {summary.revenue_focus && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Revenue Focus</p>
          <p className="text-xs text-foreground/80">{summary.revenue_focus}</p>
        </div>
      )}

      {summary.competitive_positioning && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Competitive Positioning</p>
          <p className="text-xs text-foreground/80">{summary.competitive_positioning}</p>
        </div>
      )}
    </div>
  );
}

function MultiPostBlock({ posts }: { posts: any[] }) {
  const [showAll, setShowAll] = useState(false);
  const visiblePosts = showAll ? posts : posts.slice(0, INITIAL_VISIBLE);
  const hiddenCount = posts.length - INITIAL_VISIBLE;

  const weeks = posts.map((p, i) => p.week || Math.ceil((i + 1) / 4));
  const minWeek = Math.min(...weeks);
  const maxWeek = Math.max(...weeks);
  const weekLabel = minWeek === maxWeek ? `Week ${minWeek}` : `Week ${minWeek}–${maxWeek}`;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {posts.length} posts · {weekLabel}
      </p>

      <div className="flex flex-col">
        {visiblePosts.map((post: any, i: number) => (
          <ContentPostCard
            key={i}
            post={post}
            index={i}
            isLast={!showAll && i === visiblePosts.length - 1 && hiddenCount <= 0}
          />
        ))}
      </div>

      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer pt-1"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAll && "rotate-180")} />
          {showAll ? "Show fewer" : `Show all ${posts.length} posts`}
        </button>
      )}
    </div>
  );
}

function renderContentBlock(content: any) {
  if (!content) return <p className="text-sm text-muted-foreground">No content generated</p>;

  // Render strategy summary + posts
  if (content.posts && Array.isArray(content.posts)) {
    return (
      <div className="space-y-4">
        {content.strategy_summary && <StrategySummary summary={content.strategy_summary} />}
        <MultiPostBlock posts={content.posts} />
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {content.caption && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Caption</p>
          <p className="text-foreground">{content.caption}</p>
        </div>
      )}
      {content.main_copy && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Main Copy</p>
          <p className="text-foreground">{content.main_copy}</p>
        </div>
      )}
      {content.cta && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Call to Action</p>
          <p className="text-foreground font-medium">{content.cta}</p>
        </div>
      )}
      {content.hashtags && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Hashtags</p>
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
      "glass-card rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-5 transition-all duration-300",
      version.client_selected && "ring-2 ring-primary/30 border-primary/40 bg-primary/5",
      version.admin_approved && !version.client_selected && "ring-1 ring-success/30 border-success/30",
      version.concierge_preferred && !version.admin_approved && !version.client_selected && "ring-1 ring-[hsl(280,65%,60%)]/30 border-[hsl(280,65%,60%)]/30",
      !isHighlighted && "hover:border-primary/20"
    )}>
      {/* Header */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
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

      {/* Content */}
      {renderContentBlock(version.generated_content)}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-border/40">
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
