import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ContentPost {
  id: string;
  clinic_id: string;
  title: string;
  caption: string | null;
  content: string | null;
  platform: string;
  content_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  tags: string[];
  compliance_note: string | null;
}

interface PostChipProps {
  post: ContentPost;
  onClick: (post: ContentPost) => void;
  compact?: boolean;
}

const statusBorder: Record<string, string> = {
  scheduled: "border-l-blue-500",
  posted: "border-l-green-500",
  failed: "border-l-red-500",
};

const statusBadge: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  posted: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export function PostChip({ post, onClick, compact = false }: PostChipProps) {
  const isDraggable = post.status !== "posted";

  const handleDragStart = (e: React.DragEvent) => {
    if (!isDraggable) return;
    e.dataTransfer.setData("text/plain", post.id);
    e.dataTransfer.effectAllowed = "move";
  };

  if (compact) {
    return (
      <div
        draggable={isDraggable}
        onDragStart={handleDragStart}
        onClick={() => onClick(post)}
        className={cn(
          "px-2 py-1.5 rounded-md text-xs border-l-[3px] bg-background/80 cursor-pointer truncate hover:bg-accent/40 transition-all shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]",
          statusBorder[post.status] || "border-l-muted",
          !isDraggable && "cursor-default opacity-75"
        )}
        title={post.title}
      >
        <span className="font-medium truncate block text-foreground">{post.title}</span>
        {post.scheduled_time && (
          <span className="text-[10px] text-muted-foreground mt-0.5 block">{post.scheduled_time.slice(0, 5)}</span>
        )}
      </div>
    );
  }

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onClick={() => onClick(post)}
      className={cn(
        "px-3 py-2.5 rounded-lg border border-border border-l-[3px] bg-card cursor-pointer hover:bg-accent/50 transition-colors",
        statusBorder[post.status] || "border-l-muted",
        !isDraggable && "cursor-default"
      )}
    >
      <p className="font-medium text-sm text-foreground truncate">{post.title}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <Badge variant="outline" className="text-[10px] uppercase px-1.5 py-0">
          {post.content_type}
        </Badge>
        <Badge className={cn("text-[10px] uppercase px-1.5 py-0 border-0", statusBadge[post.status] || "bg-muted text-muted-foreground")}>
          {post.status}
        </Badge>
      </div>
      {post.scheduled_time && (
        <p className="text-[10px] text-muted-foreground mt-1">{post.scheduled_time.slice(0, 5)}</p>
      )}
    </div>
  );
}

export type { ContentPost };
