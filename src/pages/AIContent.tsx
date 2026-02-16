import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AIContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");

  const { data: drafts, isLoading } = useQuery({
    queryKey: ["ai-content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_content").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ai_content").insert({
        prompt,
        generated_content: `AI-generated draft for: "${prompt}" — This is a placeholder. Connect an AI provider to generate real content.`,
        status: "draft",
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-content"] });
      toast.success("Draft generated!");
      setPrompt("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">AI Content Generation</h1>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Generate Content</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); generate.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Write a social media post about pet dental health..." required />
              </div>
              <Button type="submit" disabled={generate.isPending}>
                <Sparkles className="mr-2 h-4 w-4" /> Generate
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Previous Drafts</h2>
          {isLoading ? <p className="text-muted-foreground">Loading...</p> : drafts?.map((draft) => (
            <Card key={draft.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{draft.prompt}</CardTitle>
                  <Badge variant="outline">{draft.status}</Badge>
                </div>
              </CardHeader>
              <CardContent><p className="text-sm">{draft.generated_content}</p></CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
