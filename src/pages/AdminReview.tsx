import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldCheck, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminReview() {
  const queryClient = useQueryClient();

  const { data: pendingPosts } = useQuery({
    queryKey: ["pending-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_posts").select("*").eq("status", "draft").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: pendingAI } = useQuery({
    queryKey: ["pending-ai"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_content").select("*").eq("status", "draft").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approvePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_posts").update({ status: "scheduled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pending-posts"] }); toast.success("Post approved!"); },
  });

  const approveAI = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_content").update({ status: "approved" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["pending-ai"] }); toast.success("AI draft approved!"); },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-hero rounded-xl p-6 -mx-2 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            Admin Review
          </h1>
          <p className="text-muted-foreground mt-1">Review and approve pending content before publishing.</p>
        </div>

        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Content Posts ({pendingPosts?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="ai">AI Drafts ({pendingAI?.length ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="space-y-4 mt-4">
            {!pendingPosts?.length ? (
              <div className="text-center py-12 text-muted-foreground animate-fade-in">
                <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-8 w-8 text-accent-foreground" />
                </div>
                <p className="font-medium text-foreground mb-1">All caught up!</p>
                <p className="text-sm">No pending posts to review.</p>
              </div>
            ) : pendingPosts.map((post, i) => (
              <Card key={post.id} className="hover-lift animate-fade-in border-l-4 border-l-warning" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{post.title}</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content?.slice(0, 150)}</p>
                    <Badge variant="outline" className="mt-2 capitalize">{post.platform}</Badge>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 ml-4">
                    <Button size="sm" className="bg-gradient-to-r from-success to-success/90 text-success-foreground shadow-sm shimmer" onClick={() => approvePost.mutate(post.id)}>
                      <Check className="h-4 w-4 mr-1.5" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                      <RotateCcw className="h-4 w-4 mr-1.5" /> Send Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="ai" className="space-y-4 mt-4">
            {!pendingAI?.length ? (
              <div className="text-center py-12 text-muted-foreground animate-fade-in">
                <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-8 w-8 text-accent-foreground" />
                </div>
                <p className="font-medium text-foreground mb-1">All caught up!</p>
                <p className="text-sm">No pending AI drafts to review.</p>
              </div>
            ) : pendingAI.map((draft, i) => (
              <Card key={draft.id} className="hover-lift animate-fade-in border-l-4 border-l-warning" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{draft.prompt}</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground line-clamp-2">{draft.generated_content?.slice(0, 150)}</p>
                  <div className="flex flex-col gap-2 shrink-0 ml-4">
                    <Button size="sm" className="bg-gradient-to-r from-success to-success/90 text-success-foreground shadow-sm shimmer" onClick={() => approveAI.mutate(draft.id)}>
                      <Check className="h-4 w-4 mr-1.5" /> Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
