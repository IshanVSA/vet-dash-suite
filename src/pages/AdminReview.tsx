import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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
        <h1 className="text-3xl font-bold">Admin Review</h1>
        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Content Posts ({pendingPosts?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="ai">AI Drafts ({pendingAI?.length ?? 0})</TabsTrigger>
          </TabsList>
          <TabsContent value="posts" className="space-y-4 mt-4">
            {pendingPosts?.length === 0 ? <p className="text-muted-foreground">No pending posts</p> : pendingPosts?.map((post) => (
              <Card key={post.id}>
                <CardHeader className="pb-2"><CardTitle className="text-lg">{post.title}</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{post.content?.slice(0, 100)}</p>
                    <Badge variant="outline" className="mt-2">{post.platform}</Badge>
                  </div>
                  <Button size="sm" onClick={() => approvePost.mutate(post.id)}>Approve</Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          <TabsContent value="ai" className="space-y-4 mt-4">
            {pendingAI?.length === 0 ? <p className="text-muted-foreground">No pending AI drafts</p> : pendingAI?.map((draft) => (
              <Card key={draft.id}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{draft.prompt}</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{draft.generated_content?.slice(0, 100)}</p>
                  <Button size="sm" onClick={() => approveAI.mutate(draft.id)}>Approve</Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
