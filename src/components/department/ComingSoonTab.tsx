import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function ComingSoonTab({ label }: { label: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Construction className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-1">{label}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          This section is coming soon. We're building something great here.
        </p>
      </CardContent>
    </Card>
  );
}
