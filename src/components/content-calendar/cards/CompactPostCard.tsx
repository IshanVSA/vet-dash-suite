import { type ContentPost, STAGE_BORDER_COLORS, STAGE_BADGE_COLORS, STAGE_LABELS } from "@/types/content-calendar";
import { Badge } from "@/components/ui/badge";
import { WorkflowTracker } from "../inspector/WorkflowTracker";
import { Instagram, Facebook, Clock, AlertTriangle, Tag } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

interface CompactPostCardProps {
  post: ContentPost;
  isSelected: boolean;
  onClick: () => void;
}

const platformIcon = (platform: string) => {
  switch (platform) {
    case "instagram":
      return <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Instagram className="h-2.5 w-2.5 text-white" /></div>;
    case "facebook":
      return <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center"><Facebook className="h-2.5 w-2.5 text-white" /></div>;
    default:
      return <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">{platform[0]?.toUpperCase()}</div>;
  }
};

export function CompactPostCard({ post, isSelected, onClick }: CompactPostCardProps) {
  const stage = post.workflow_stage || "draft";
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "bg-card rounded-lg border border-border overflow-hidden transition-all duration-200 hover:shadow-md border-l-[3px]",
        STAGE_BORDER_COLORS[stage] || "border-l-muted",
        isSelected && "ring-1 ring-primary shadow-md"
      )}
    >
      {/* Header row - always visible, clickable to select */}
      <div
        onClick={onClick}
        className="p-3 cursor-pointer hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
              className="shrink-0"
            >
              <ChevronRight className={cn(
                "h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200",
                expanded && "rotate-90"
              )} />
            </button>
            {platformIcon(post.platform)}
            <h4 className="text-sm font-medium text-foreground truncate">{post.title}</h4>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge className={cn("text-[9px]", STAGE_BADGE_COLORS[stage])}>
              {STAGE_LABELS[stage] || stage}
            </Badge>
            {post.content_type && (
              <Badge variant="secondary" className="text-[9px] py-0">{post.content_type}</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-1.5">
          <WorkflowTracker currentStage={stage} compact />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
            {post.scheduled_date && (
              <span>{format(new Date(post.scheduled_date), "MMM d")}</span>
            )}
            {post.scheduled_time && (
              <>
                <Clock className="h-2.5 w-2.5" />
                <span>{post.scheduled_time.slice(0, 5)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-border/50 pt-2.5 animate-fade-in">
          {post.caption && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Caption</p>
              <p className="text-sm leading-relaxed text-foreground">{post.caption}</p>
            </div>
          )}

          {post.content && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Content</p>
              <p className="text-sm leading-relaxed text-foreground">{post.content}</p>
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="h-3 w-3 text-muted-foreground/50" />
              {post.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-[9px] py-0 text-muted-foreground border-border/50">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {post.compliance_note && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Compliance Note</p>
              <p className="text-xs text-muted-foreground italic">{post.compliance_note}</p>
            </div>
          )}

          {post.flag_reason && (
            <div className="flex items-start gap-1.5 bg-destructive/10 rounded-md p-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">{post.flag_reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
