import { type ContentPost, STAGE_BORDER_COLORS, STAGE_BADGE_COLORS, STAGE_LABELS } from "@/types/content-calendar";
import { Badge } from "@/components/ui/badge";
import { WorkflowTracker } from "../inspector/WorkflowTracker";
import { CountdownBadge } from "./CountdownBadge";
import { Instagram, Facebook, Clock, Tag, FileText, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CompactPostCardProps {
  post: ContentPost;
  isSelected: boolean;
  onClick: () => void;
}

const platformIcon = (platform: string) => {
  switch (platform) {
    case "instagram":
      return <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Instagram className="h-3 w-3 text-white" /></div>;
    case "facebook":
      return <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center"><Facebook className="h-3 w-3 text-white" /></div>;
    default:
      return <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">{platform[0]?.toUpperCase()}</div>;
  }
};

export function CompactPostCard({ post, isSelected, onClick }: CompactPostCardProps) {
  const stage = post.workflow_stage || "draft";

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-lg border border-border overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg group border-l-4",
        STAGE_BORDER_COLORS[stage] || "border-l-muted",
        isSelected && "ring-2 ring-primary shadow-lg"
      )}
    >
      <div className="p-4 space-y-3">
        {/* Top row: platform + title + badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {platformIcon(post.platform)}
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-foreground leading-tight">{post.title}</h4>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                <span className="capitalize">{post.platform}</span>
                <span>·</span>
                <span>{post.content_type}</span>
                {post.scheduled_date && (
                  <>
                    <span>·</span>
                    <span>{format(new Date(post.scheduled_date), "MMM d, yyyy")}</span>
                  </>
                )}
                {post.scheduled_time && (
                  <>
                    <Clock className="h-3 w-3 ml-1" />
                    <span>{post.scheduled_time.slice(0, 5)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Badge className={cn("text-[10px] shrink-0", STAGE_BADGE_COLORS[stage])}>
            {STAGE_LABELS[stage] || stage}
          </Badge>
        </div>

        {/* Caption / Content preview */}
        {post.caption && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Caption</p>
            <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">{post.caption}</p>
          </div>
        )}

        {post.content && !post.caption && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Content</p>
            <p className="text-xs text-foreground/80 line-clamp-3 leading-relaxed">{post.content}</p>
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="h-3 w-3 text-muted-foreground/50" />
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Compliance note */}
        {post.compliance_note && (
          <div className="flex items-start gap-1.5 bg-muted/50 rounded-md px-2.5 py-1.5">
            <ShieldCheck className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[10px] text-muted-foreground leading-relaxed">{post.compliance_note}</p>
          </div>
        )}

        {/* Flag reason */}
        {post.flag_reason && stage === "flagged" && (
          <div className="flex items-start gap-1.5 bg-destructive/10 rounded-md px-2.5 py-1.5">
            <FileText className="h-3 w-3 text-destructive mt-0.5 shrink-0" />
            <p className="text-[10px] text-destructive leading-relaxed">{post.flag_reason}</p>
          </div>
        )}

        {/* Countdown badge for sent_to_client */}
        {stage === "sent_to_client" && (
          <CountdownBadge autoApproveAt={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()} />
        )}

        {/* Workflow tracker */}
        <WorkflowTracker currentStage={stage} compact />
      </div>
    </div>
  );
}
