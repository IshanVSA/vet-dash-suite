import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Lock, ShieldCheck } from "lucide-react";
import { useAiSeoAccess } from "@/hooks/useAiSeoAccess";
import { Skeleton } from "@/components/ui/skeleton";

export default function AiSeoDepartment() {
  const { hasAccess, isLoading } = useAiSeoAccess();

  return (
    <DashboardLayout>
      <div className="space-y-4 dept-tint-ai-seo min-h-full -m-6 p-6" data-dept="AI SEO">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="h-8 w-8 rounded-lg bg-[hsl(var(--dept-ai-seo))]/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-[hsl(var(--dept-ai-seo))]" />
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">AI SEO</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : hasAccess ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">AI SEO</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Our AI-powered SEO tools are coming soon. Stay tuned for intelligent keyword research, automated content optimization, and smart ranking insights.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" /> Coming Soon
              </span>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/60 bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative mb-6">
                <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <div className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-destructive/10 border-4 border-background flex items-center justify-center">
                  <Lock className="h-4 w-4 text-destructive" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">AI SEO is Locked</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Unlock AI-powered SEO tools including intelligent keyword research, automated content optimization, and smart ranking insights by upgrading to the AI SEO plan.
              </p>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Keyword Research</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Content Optimization</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Ranking Insights</span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-4 py-1.5 text-xs font-semibold text-destructive">
                  <Lock className="h-3 w-3" /> Plan Required
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
