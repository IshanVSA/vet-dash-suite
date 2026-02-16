import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Sparkles, ChevronDown, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AIContent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text || "");
    toast.success("Copied to clipboard!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-hero rounded-xl p-6 -mx-2 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Content Engine
          </h1>
          <p className="text-muted-foreground mt-1">Generate and manage AI-powered content drafts</p>
        </div>

        <Card className="hover-lift animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Generate Content</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); generate.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Write a social media post about pet dental health..." required className="input-glow" />
              </div>
              <Button type="submit" disabled={generate.isPending}>
                <Sparkles className="mr-2 h-4 w-4" /> Generate
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading content...</div>
        ) : !drafts?.length ? (
          <Card className="animate-fade-in">
            <CardContent className="py-12 text-center">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center mx-auto mb-4" style={{ animation: "sparkle-pulse 2s ease-in-out infinite" }}>
                <Sparkles className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">No AI Content Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Use the form above to generate your first AI-powered content draft.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft, idx) => {
              const isExpanded = expandedId === draft.id;
              return (
                <Collapsible key={draft.id} open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : draft.id)}>
                  <Card className="hover-lift animate-fade-in" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: "both" }}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{draft.prompt}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{draft.status}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(draft.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); copyContent(draft.generated_content || ""); }}>
                          <Copy className="h-4 w-4 mr-1" /> Copy
                        </Button>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </CardHeader>
                    {!isExpanded && (
                      <CardContent className="pt-0">
                        <p className="text-sm text-foreground line-clamp-2">{draft.generated_content}</p>
                      </CardContent>
                    )}
                    <CollapsibleContent>
                      <CardContent className="border-t border-border pt-4">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{draft.generated_content}</p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
