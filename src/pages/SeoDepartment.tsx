import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function SeoDepartment() {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <div className="h-8 w-8 rounded-lg bg-[hsl(var(--dept-seo))]/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-[hsl(var(--dept-seo))]" />
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">AI SEO</h1>
        </div>

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
      </div>
    </DashboardLayout>
  );
}
