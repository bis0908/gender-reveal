import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { AppError, ErrorCode } from "@/lib/errors";
import {
  getAdminMetrics,
  getDefaultAdminMetricsRange,
} from "@/lib/services/admin-metrics";
import { MetricsForbiddenState } from "./metrics-access-state";
import { MetricsDashboard } from "./metrics-dashboard";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMetricsPage() {
  let accessError: AppError | null = null;

  try {
    await requireAdmin();
  } catch (error) {
    if (!(error instanceof AppError)) {
      throw error;
    }

    accessError = error;
  }

  if (accessError?.code === ErrorCode.UNAUTHORIZED) {
    return redirect("/admin/login");
  }

  if (accessError?.code === ErrorCode.FORBIDDEN) {
    return <MetricsForbiddenState />;
  }

  if (accessError) {
    throw accessError;
  }

  const range = getDefaultAdminMetricsRange();
  const summary = await getAdminMetrics(range);

  return <MetricsDashboard initialSummary={summary} />;
}
