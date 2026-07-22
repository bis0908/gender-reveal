import "server-only";

import { createBadRequestError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getMetricsSupabaseClient } from "@/lib/metrics-supabase-client.server";
import {
  type MetricsSummary,
  metricsSummarySchema,
} from "@/lib/schemas/metrics-summary-schema";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const METRICS_ENDPOINT = "/api/admin/metrics";
const ISO_OFFSET_PATTERN = /(?:Z|[+-]\d{2}:\d{2})$/;

type AdminMetricsQueryErrorCode =
  | "METRICS_CLIENT_ERROR"
  | "METRICS_RPC_ERROR"
  | "METRICS_RESPONSE_INVALID";

class AdminMetricsQueryError extends Error {
  constructor(readonly code: AdminMetricsQueryErrorCode) {
    super("관리자 메트릭 조회에 실패했습니다.");
    this.name = "AdminMetricsQueryError";
  }
}

export interface AdminMetricsRange {
  from: string;
  to: string;
}

export function getDefaultAdminMetricsRange(
  now: Date = new Date(),
): AdminMetricsRange {
  if (Number.isNaN(now.getTime())) {
    throw createBadRequestError("조회 기준 시각이 올바르지 않습니다.");
  }

  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  const year = kstNow.getUTCFullYear();
  const month = kstNow.getUTCMonth();
  const day = kstNow.getUTCDate();
  const fromUtc = Date.UTC(year, month, day - 29) - KST_OFFSET_MS;
  const toUtc = Date.UTC(year, month, day + 1) - KST_OFFSET_MS;

  return {
    from: formatKstTimestamp(fromUtc),
    to: formatKstTimestamp(toUtc),
  };
}

export function parseAdminMetricsRange(
  range: AdminMetricsRange,
): AdminMetricsRange {
  const from = range?.from?.trim();
  const to = range?.to?.trim();

  if (!isIsoTimestampWithOffset(from) || !isIsoTimestampWithOffset(to)) {
    throw createBadRequestError(
      "조회 기간은 오프셋을 포함한 ISO 8601 시각이어야 합니다.",
    );
  }

  const fromMs = Date.parse(from);
  const toMs = Date.parse(to);

  if (fromMs >= toMs) {
    throw createBadRequestError(
      "조회 시작 시각은 종료 시각보다 빨라야 합니다.",
    );
  }

  if (toMs > addKstMonths(fromMs, 24)) {
    throw createBadRequestError("조회 기간은 최대 24개월입니다.");
  }

  return { from, to };
}

export async function getAdminMetrics(
  range: AdminMetricsRange,
): Promise<MetricsSummary> {
  const parsedRange = parseAdminMetricsRange(range);

  try {
    let client: ReturnType<typeof getMetricsSupabaseClient>;
    try {
      client = getMetricsSupabaseClient();
    } catch {
      throw new AdminMetricsQueryError("METRICS_CLIENT_ERROR");
    }

    const { data, error } = await client.rpc("get_reveal_generation_metrics", {
      p_from: parsedRange.from,
      p_to: parsedRange.to,
    });

    if (error) {
      throw new AdminMetricsQueryError("METRICS_RPC_ERROR");
    }

    const parsedSummary = metricsSummarySchema.safeParse(data);
    if (!parsedSummary.success) {
      throw new AdminMetricsQueryError("METRICS_RESPONSE_INVALID");
    }

    logger.serverMetric("metrics_admin_query_success", {
      endpoint: METRICS_ENDPOINT,
      ...parsedRange,
    });

    return parsedSummary.data;
  } catch (error) {
    const safeError =
      error instanceof AdminMetricsQueryError
        ? error
        : new AdminMetricsQueryError("METRICS_RPC_ERROR");

    logger.serverMetric("metrics_admin_query_failure", {
      endpoint: METRICS_ENDPOINT,
      ...parsedRange,
      errorCode: safeError.code,
    });

    throw safeError;
  }
}

function isIsoTimestampWithOffset(value: string | undefined): value is string {
  if (!value || !ISO_OFFSET_PATTERN.test(value)) {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function formatKstTimestamp(utcMilliseconds: number): string {
  return new Date(utcMilliseconds + KST_OFFSET_MS)
    .toISOString()
    .replace("Z", "+09:00");
}

function addKstMonths(utcMilliseconds: number, months: number): number {
  const kstDate = new Date(utcMilliseconds + KST_OFFSET_MS);
  const sourceYear = kstDate.getUTCFullYear();
  const sourceMonth = kstDate.getUTCMonth();
  const targetMonthIndex = sourceMonth + months;
  const targetYear = sourceYear + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastTargetDay = new Date(
    Date.UTC(targetYear, targetMonth + 1, 0),
  ).getUTCDate();
  const targetDay = Math.min(kstDate.getUTCDate(), lastTargetDay);

  return (
    Date.UTC(
      targetYear,
      targetMonth,
      targetDay,
      kstDate.getUTCHours(),
      kstDate.getUTCMinutes(),
      kstDate.getUTCSeconds(),
      kstDate.getUTCMilliseconds(),
    ) - KST_OFFSET_MS
  );
}
