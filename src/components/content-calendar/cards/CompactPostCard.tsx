import { type ContentPost, STAGE_BORDER_COLORS, STAGE_BADGE_COLORS, STAGE_LABELS } from "@/types/content-calendar";
import { Badge } from "@/components/ui/badge";
import { WorkflowTracker } from "../inspector/WorkflowTracker";
import { Instagram, Facebook, Clock } from "lucide-react";
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
      return <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Instagram className="h-2.5 w-2.5 text-white" /></div>;
    case "facebook":
      return <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center"><Facebook className="h-2.5 w-2.5 text-white" /></div>;
    default:
      return <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">{platform[0]?.toUpperCase()}</div>;
  }
};

export function CompactPostCard({ post, isSelected, onClick }: CompactPostCardProps) {
  const stage = post.workflow_stage || "draft";

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-card rounded-lg border border-border overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md group border-l-[3px]",
        STAGE_BORDER_COLORS[stage] || "border-l-muted",
        isSelected && "ring-1 ring-primary shadow-md"
      )}
    >
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {platformIcon(post.platform)}
            <h4 className="text-sm font-medium text-foreground truncate">{post.title}</h4>
          </div>
          <Badge className={cn("text-[9px] shrink-0", STAGE_BADGE_COLORS[stage])}>
            {STAGE_LABELS[stage] || stage}
          </Badge>
        </div>

        {post.caption && (
          <p className="text-xs text-muted-foreground line-clamp-2">{post.caption}</p>
        )}

        <div className="flex items-center justify-between gap-2">
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
    </div>
  );
}
