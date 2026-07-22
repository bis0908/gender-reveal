import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CHART_SKELETON_KEYS = [
  "creation-mode",
  "country",
  "baby-count",
  "animation",
  "device",
  "due-month",
] as const;

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

export function MetricsDashboardSkeleton() {
  return (
    <div className="space-y-6" data-testid="metrics-dashboard-loading">
      <Card>
        <CardHeader className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-12 w-32" />
        </CardContent>
      </Card>
      <ChartSkeleton />
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {CHART_SKELETON_KEYS.map((key) => (
          <ChartSkeleton key={key} />
        ))}
      </div>
    </div>
  );
}
