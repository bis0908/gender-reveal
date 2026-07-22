import { MetricsDashboardSkeleton } from "./metrics-dashboard-skeleton";

export default function AdminMetricsLoading() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="space-y-3">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-9 w-64 max-w-full animate-pulse rounded bg-muted" />
          <div className="h-5 w-96 max-w-full animate-pulse rounded bg-muted" />
        </div>
        <MetricsDashboardSkeleton />
      </div>
    </main>
  );
}
