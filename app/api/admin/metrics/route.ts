import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  AppError,
  createInternalError,
  type ErrorResponse,
} from "@/lib/errors";
import type { MetricsSummary } from "@/lib/schemas/metrics-summary-schema";
import { getAdminMetrics } from "@/lib/services/admin-metrics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRIVATE_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
} as const;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<MetricsSummary | ErrorResponse>> {
  try {
    await requireAdmin();

    const searchParams = new URL(request.url).searchParams;
    const summary = await getAdminMetrics({
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
    });

    return NextResponse.json(summary, {
      headers: PRIVATE_NO_STORE_HEADERS,
    });
  } catch (error) {
    const safeError = error instanceof AppError ? error : createInternalError();

    return NextResponse.json(safeError.toJSON(), {
      status: safeError.statusCode,
      headers: PRIVATE_NO_STORE_HEADERS,
    });
  }
}
