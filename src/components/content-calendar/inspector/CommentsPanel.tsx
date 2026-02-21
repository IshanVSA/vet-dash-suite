import { useState } from "react";
import { type PostComment } from "@/types/content-calendar";
import { type AppRole } from "@/hooks/useUserRole";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CommentsPanelProps {
  comments: PostComment[];
  loading?: boolean;
  onAddComment: (content: string, visibility: "all" | "internal" | "concierge_only") => Promise<void>;
  userRole: AppRole | null;
}

const VISIBILITY_LABELS: Record<string, string> = {
  all: "Everyone",
  internal: "Internal",
  concierge_only: "Concierge Only",
};

const VISIBILITY_COLORS: Record<string, string> = {
  all: "bg-blue-500/15 text-blue-400",
  internal: "bg-amber-500/15 text-amber-400",
  concierge_only: "bg-purple-500/15 text-purple-400",
};

export function CommentsPanel({ comments, loading, onAddComment, userRole }: CommentsPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [visibility, setVisibility] = useState<"all" | "internal" | "concierge_only">("all");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    await onAddComment(newComment.trim(), visibility);
    setNewComment("");
    setSubmitting(false);
  };

  const canSetVisibility = userRole === "admin" || userRole === "concierge";

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Comments
      </h4>
      <ScrollArea className="max-h-40">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No comments yet</p>
        ) : (
          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="rounded-md bg-muted/50 p-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-foreground">
                    {comment.profiles?.full_name || "Unknown"}
                  </span>
                  <Badge className={cn("text-[9px] px-1 py-0", VISIBILITY_COLORS[comment.visibility])}>
                    {VISIBILITY_LABELS[comment.visibility]}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {format(new Date(comment.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-xs text-foreground/80">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="text-xs min-h-[60px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        {canSetVisibility && (
          <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
            <SelectTrigger className="h-7 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              <SelectItem value="internal">Internal</SelectItem>
              {userRole === "concierge" && (
                <SelectItem value="concierge_only">Concierge Only</SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
        <Button
          size="sm"
          className="h-7 text-xs ml-auto"
          onClick={handleSubmit}
          disabled={submitting || !newComment.trim()}
        >
          <Send className="h-3 w-3 mr-1" />
          Send
        </Button>
      </div>
    </div>
  );
}
