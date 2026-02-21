import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { type ContentPost, type PostComment, type PostActivityLog, type PostWorkflow, STAGE_LABELS, STAGE_BADGE_COLORS } from "@/types/content-calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WorkflowTracker } from "./WorkflowTracker";
import { ActivityTimeline } from "./ActivityTimeline";
import { CommentsPanel } from "./CommentsPanel";
import { InspectorActions } from "./InspectorActions";
import { CountdownBadge } from "../cards/CountdownBadge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Instagram, Facebook, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ContentInspectorProps {
  post: ContentPost | null;
  onClose: () => void;
  onPostUpdated: (post: ContentPost) => void;
}

export function ContentInspector({ post, onClose, onPostUpdated }: ContentInspectorProps) {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [workflow, setWorkflow] = useState<PostWorkflow | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [activities, setActivities] = useState<PostActivityLog[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!post) return;
    loadWorkflow();
    loadComments();
    loadActivities();
  }, [post?.id]);

  const loadWorkflow = async () => {
    if (!post) return;
    const { data } = await supabase
      .from("post_workflow")
      .select("*")
      .eq("post_id", post.id)
      .maybeSingle();
    setWorkflow(data as PostWorkflow | null);
  };

  const loadComments = async () => {
    if (!post) return;
    setLoadingComments(true);
    const { data } = await supabase
      .from("post_comments")
      .select("*, profiles:user_id(full_name)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    setComments((data as any as PostComment[]) || []);
    setLoadingComments(false);
  };

  const loadActivities = async () => {
    if (!post) return;
    setLoadingActivities(true);
    const { data } = await supabase
      .from("post_activity_log")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: false });
    setActivities((data as PostActivityLog[]) || []);
    setLoadingActivities(false);
  };

  const addComment = async (content: string, visibility: "all" | "internal" | "concierge_only") => {
    if (!post || !user) return;
    const { error } = await supabase.from("post_comments").insert({
      post_id: post.id,
      user_id: user.id,
      content,
      visibility,
    });
    if (error) {
      toast.error("Failed to add comment");
      return;
    }
    loadComments();
  };

  const updateWorkflowStage = async (newStage: string) => {
    if (!post || !user) return;
    setActionLoading(true);

    const workflowUpdate: any = { stage: newStage };
    if (newStage === "sent_to_client") {
      const now = new Date();
      workflowUpdate.sent_to_client_at = now.toISOString();
      workflowUpdate.auto_approve_at = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
    }

    // Upsert workflow
    if (workflow) {
      await supabase.from("post_workflow").update(workflowUpdate).eq("id", workflow.id);
    } else {
      await supabase.from("post_workflow").insert({ post_id: post.id, ...workflowUpdate });
    }

    // Update denormalized stage on content_posts
    const statusMap: Record<string, string> = {
      client_approved: "approved",
      admin_approved: "approved",
      flagged: "flagged",
      sent_to_client: "pending",
      sent_to_admin: "pending",
    };
    const newStatus = statusMap[newStage] || post.status;
    await supabase.from("content_posts").update({ workflow_stage: newStage, status: newStatus }).eq("id", post.id);

    // Log activity
    await supabase.from("post_activity_log").insert({
      post_id: post.id,
      action: newStage,
      actor_id: user.id,
      metadata: {},
    });

    onPostUpdated({ ...post, workflow_stage: newStage, status: newStatus });
    loadWorkflow();
    loadActivities();
    setActionLoading(false);
    toast.success(`Stage updated to ${STAGE_LABELS[newStage] || newStage}`);
  };

  const handleDuplicate = async () => {
    if (!post || !user) return;
    setActionLoading(true);
    const { id, ...rest } = post;
    const { data, error } = await supabase.from("content_posts").insert({
      ...rest,
      title: `${post.title} (copy)`,
      status: "draft",
      workflow_stage: "draft",
    }).select().single();

    if (error) {
      toast.error("Failed to duplicate");
    } else {
      toast.success("Post duplicated");
    }
    setActionLoading(false);
  };

  const handleRegenerate = () => {
    toast.info("Regeneration requires content request context. Use Content Requests page.");
  };

  if (!post) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <Instagram className="h-6 w-6" />
          </div>
          <p className="font-medium text-foreground">Select a post</p>
          <p className="text-xs">Click on a content card to view details</p>
        </div>
      </div>
    );
  }

  const currentStage = post.workflow_stage || "draft";

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <Badge className={cn("text-[10px]", STAGE_BADGE_COLORS[currentStage])}>
              {STAGE_LABELS[currentStage] || currentStage}
            </Badge>
            <h3 className="font-semibold text-foreground text-sm leading-tight">{post.title}</h3>
            <p className="text-xs text-muted-foreground">
              {post.platform} · {post.content_type} · {post.scheduled_date ? format(new Date(post.scheduled_date), "MMM d") : "Unscheduled"}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Countdown badge */}
        {currentStage === "sent_to_client" && workflow?.auto_approve_at && (
          <CountdownBadge autoApproveAt={workflow.auto_approve_at} />
        )}

        <Separator />

        {/* Content preview */}
        <div className="space-y-2">
          {post.caption && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Caption</p>
              <p className="text-xs text-foreground/80">{post.caption}</p>
            </div>
          )}
          {post.content && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Main Copy</p>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">{post.content}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Workflow tracker */}
        <WorkflowTracker currentStage={currentStage} />

        <Separator />

        {/* Actions */}
        <InspectorActions
          workflowStage={currentStage}
          userRole={role}
          onFlag={() => updateWorkflowStage("flagged")}
          onDuplicate={handleDuplicate}
          onRegenerate={handleRegenerate}
          loading={actionLoading}
        />

        <Separator />

        {/* Activity timeline */}
        <ActivityTimeline activities={activities} loading={loadingActivities} />

        <Separator />

        {/* Comments */}
        <CommentsPanel
          comments={comments}
          loading={loadingComments}
          onAddComment={addComment}
          userRole={role}
        />
      </div>
    </ScrollArea>
  );
}
