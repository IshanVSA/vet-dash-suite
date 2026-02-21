import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole, type AppRole } from "@/hooks/useUserRole";
import { type ContentPost, STAGE_LABELS } from "@/types/content-calendar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface MonthlyApprovalBarProps {
  posts: ContentPost[];
  onPostsUpdated: (posts: ContentPost[]) => void;
}

export function MonthlyApprovalBar({ posts, onPostsUpdated }: MonthlyApprovalBarProps) {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [loading, setLoading] = useState(false);

  if (posts.length === 0) return null;

  const isAdmin = role === "admin";
  const isConcierge = role === "concierge";
  const isClient = role === "client";

  // Count posts at various stages
  const pendingAdminReview = posts.filter(p =>
    ["generated", "concierge_preferred", "sent_to_admin"].includes(p.workflow_stage)
  );
  const pendingClientReview = posts.filter(p => p.workflow_stage === "sent_to_client");
  const adminApproved = posts.filter(p => p.workflow_stage === "admin_approved");
  const fullyApproved = posts.filter(p =>
    ["client_approved", "auto_approved"].includes(p.workflow_stage) || p.status === "approved" || p.status === "posted"
  );

  const percent = posts.length > 0 ? Math.round((fullyApproved.length / posts.length) * 100) : 0;

  const bulkUpdateStage = async (postIds: string[], newStage: string, newStatus: string) => {
    if (!user) return;
    setLoading(true);

    try {
      // Update all content_posts
      const { error: postError } = await supabase
        .from("content_posts")
        .update({ workflow_stage: newStage, status: newStatus })
        .in("id", postIds);

      if (postError) throw postError;

      // Upsert workflows for each post
      for (const postId of postIds) {
        const workflowUpdate: any = { stage: newStage };
        if (newStage === "sent_to_client") {
          const now = new Date();
          workflowUpdate.sent_to_client_at = now.toISOString();
          workflowUpdate.auto_approve_at = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
        }

        // Try update first, insert if not exists
        const { data: existing } = await supabase
          .from("post_workflow")
          .select("id")
          .eq("post_id", postId)
          .maybeSingle();

        if (existing) {
          await supabase.from("post_workflow").update(workflowUpdate).eq("id", existing.id);
        } else {
          await supabase.from("post_workflow").insert({ post_id: postId, ...workflowUpdate });
        }

        // Log activity
        await supabase.from("post_activity_log").insert({
          post_id: postId,
          action: newStage,
          actor_id: user.id,
          metadata: { bulk_action: true },
        });
      }

      // Update local state
      const updatedPosts = posts.map(p =>
        postIds.includes(p.id) ? { ...p, workflow_stage: newStage, status: newStatus } : p
      );
      onPostsUpdated(updatedPosts);
      toast.success(`${postIds.length} posts updated to ${STAGE_LABELS[newStage] || newStage}`);
    } catch (error) {
      toast.error("Failed to update posts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminApproveMonth = () => {
    const ids = pendingAdminReview.map(p => p.id);
    if (ids.length === 0) { toast.info("No posts pending admin review."); return; }
    bulkUpdateStage(ids, "admin_approved", "approved");
  };

  const handleSendToClient = () => {
    const ids = adminApproved.map(p => p.id);
    if (ids.length === 0) { toast.info("No admin-approved posts to send."); return; }
    bulkUpdateStage(ids, "sent_to_client", "pending");
  };

  const handleClientApproveMonth = () => {
    const ids = pendingClientReview.map(p => p.id);
    if (ids.length === 0) { toast.info("No posts pending your review."); return; }
    bulkUpdateStage(ids, "client_approved", "approved");
  };

  // Concierge: send to admin
  const handleSendToAdmin = () => {
    const eligible = posts.filter(p =>
      ["generated", "concierge_preferred"].includes(p.workflow_stage)
    );
    const ids = eligible.map(p => p.id);
    if (ids.length === 0) { toast.info("No posts to send to admin."); return; }
    bulkUpdateStage(ids, "sent_to_admin", "pending");
  };

  return (
    <div className="flex items-center gap-3 bg-card rounded-lg border border-border px-4 py-2.5 flex-wrap">
      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      <div className="flex-1 min-w-[120px]">
        <Progress value={percent} className="h-2" />
      </div>
      <span className="text-xs font-medium text-foreground shrink-0">
        {fullyApproved.length} / {posts.length} Approved
      </span>

      <div className="flex items-center gap-2 ml-auto">
        {/* Concierge: Send all to admin */}
        {isConcierge && pendingAdminReview.filter(p => ["generated", "concierge_preferred"].includes(p.workflow_stage)).length > 0 && (
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleSendToAdmin} disabled={loading}>
            <Send className="h-3 w-3 mr-1" /> Send All to Admin ({posts.filter(p => ["generated", "concierge_preferred"].includes(p.workflow_stage)).length})
          </Button>
        )}

        {/* Admin: Approve entire month */}
        {isAdmin && pendingAdminReview.length > 0 && (
          <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700" onClick={handleAdminApproveMonth} disabled={loading}>
            <ShieldCheck className="h-3 w-3 mr-1" /> Approve Month ({pendingAdminReview.length})
          </Button>
        )}

        {/* Admin: Send all to client */}
        {isAdmin && adminApproved.length > 0 && (
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleSendToClient} disabled={loading}>
            <Send className="h-3 w-3 mr-1" /> Send to Client ({adminApproved.length})
          </Button>
        )}

        {/* Client: Approve entire month */}
        {isClient && pendingClientReview.length > 0 && (
          <Button size="sm" className="text-xs h-7 bg-green-600 hover:bg-green-700" onClick={handleClientApproveMonth} disabled={loading}>
            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve Month ({pendingClientReview.length})
          </Button>
        )}
      </div>
    </div>
  );
}
