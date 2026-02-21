import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Hero skeleton */}
      <div className="rounded-2xl border border-border/50 p-8 bg-muted/30">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-7 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="h-11 w-11 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart skeleton */}
      <Card className="border-border/60">
        <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-4">
          <Skeleton className="h-[260px] w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card className="border-border/60">
        <div className="px-6 py-4 border-b border-border/40 bg-muted/30">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-28 hidden sm:block" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-8 w-16 ml-auto rounded-lg" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-[260px] rounded-lg" />
          <Skeleton className="h-10 w-[200px] rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-8 w-[130px] rounded-md" />
        <Skeleton className="h-8 w-[130px] rounded-md" />
        <Skeleton className="h-8 w-[140px] rounded-md" />
      </div>

      {/* Calendar grid skeleton */}
      <div className="grid grid-cols-7 gap-px border border-border/60 rounded-xl overflow-hidden bg-border/60">
        {[...Array(7)].map((_, i) => (
          <div key={`h-${i}`} className="bg-muted/30 p-2 text-center">
            <Skeleton className="h-4 w-8 mx-auto" />
          </div>
        ))}
        {[...Array(35)].map((_, i) => (
          <div key={i} className="bg-card min-h-[80px] p-2">
            <Skeleton className="h-3 w-5 mb-2" />
            {i % 5 === 0 && <Skeleton className="h-5 w-full rounded" />}
            {i % 7 === 2 && <Skeleton className="h-5 w-3/4 rounded mt-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero skeleton */}
      <div className="rounded-2xl border border-border/50 p-8 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-7 w-56 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Clinic cards skeleton */}
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="border-border/60 border-l-4 border-l-border">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-64 mb-2" />
                <Skeleton className="h-5 w-28 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
