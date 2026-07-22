import { logger } from "@/lib/logger";
import { getMetricsSupabaseClient } from "@/lib/metrics-supabase-client.server";
import type { AnimationType } from "@/lib/types";

export type CreationMode = "instant" | "dday";

export interface GenerationMetricSource {
  isMultiple?: boolean;
  babiesInfo?: readonly unknown[];
  animationType?: unknown;
  dueDate?: unknown;
}

export interface GenerationMetricRow {
  event_id: string;
  creation_mode: CreationMode;
  country_code: string | null;
  baby_count: number;
  animation_type: AnimationType;
  device_platform: "ios" | "android" | "other" | "unknown";
  due_month: string | null;
}

export interface RecordGenerationMetricOptions {
  eventId: string;
  creationMode: CreationMode;
  endpoint: string;
  request: Pick<Request, "headers">;
  data: GenerationMetricSource;
}

const METRICS_TABLE = "reveal_generation_events";
const MAX_RECORD_ATTEMPTS = 2;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SUPPORTED_ANIMATIONS: readonly AnimationType[] = [
  "confetti",
  "balloons",
  "fireworks",
  "falling",
  "reveal",
  "lootbox",
  "balloonpop",
  "scratch",
];

class GenerationMetricValidationError extends Error {
  readonly code = "METRICS_VALIDATION_ERROR";
}

function classifyDevice(
  request: Pick<Request, "headers">,
): GenerationMetricRow["device_platform"] {
  const userAgent = request.headers.get("user-agent") ?? "";

  if (!userAgent.trim()) {
    return "unknown";
  }

  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return "ios";
  }

  if (/android/i.test(userAgent)) {
    return "android";
  }

  return "other";
}

function deriveCountryCode(request: Pick<Request, "headers">): string | null {
  if (process.env.VERCEL !== "1") {
    return null;
  }

  const countryCode = request.headers.get("x-vercel-ip-country");
  return countryCode && /^[A-Z]{2}$/.test(countryCode) ? countryCode : null;
}

function deriveDueMonth(dueDate: unknown): string | null {
  if (dueDate === undefined || dueDate === null || dueDate === "") {
    return null;
  }

  const parsedDate =
    dueDate instanceof Date
      ? new Date(dueDate.getTime())
      : typeof dueDate === "string"
        ? new Date(dueDate)
        : null;

  if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const year = parsedDate.getUTCFullYear();
  const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function validateCreationMode(creationMode: CreationMode): void {
  if (creationMode !== "instant" && creationMode !== "dday") {
    throw new GenerationMetricValidationError("생성 모드가 올바르지 않습니다.");
  }
}

function validateAnimationType(animationType: unknown): AnimationType {
  if (
    typeof animationType !== "string" ||
    !SUPPORTED_ANIMATIONS.includes(animationType as AnimationType)
  ) {
    throw new GenerationMetricValidationError(
      "애니메이션 유형이 올바르지 않습니다.",
    );
  }

  return animationType as AnimationType;
}

function deriveBabyCount(data: GenerationMetricSource): number {
  const babyCount = data.isMultiple
    ? Array.isArray(data.babiesInfo)
      ? data.babiesInfo.length
      : 0
    : 1;

  if (babyCount < 1) {
    throw new GenerationMetricValidationError("태아 수가 올바르지 않습니다.");
  }

  return babyCount;
}

function getSanitizedErrorCode(error: unknown): string {
  if (error instanceof GenerationMetricValidationError) {
    return error.code;
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(code)) {
      return code;
    }
  }

  return "METRICS_RECORD_ERROR";
}

export function deriveGenerationMetric(
  request: Pick<Request, "headers">,
  data: GenerationMetricSource,
  creationMode: CreationMode,
  eventId: string,
): GenerationMetricRow {
  if (!UUID_PATTERN.test(eventId)) {
    throw new GenerationMetricValidationError("이벤트 ID가 올바르지 않습니다.");
  }

  validateCreationMode(creationMode);

  return {
    event_id: eventId,
    creation_mode: creationMode,
    country_code: deriveCountryCode(request),
    baby_count: deriveBabyCount(data),
    animation_type: validateAnimationType(data.animationType),
    device_platform: classifyDevice(request),
    due_month: deriveDueMonth(data.dueDate),
  };
}

export async function recordGenerationMetric(
  options: RecordGenerationMetricOptions,
): Promise<boolean> {
  const { eventId, creationMode, endpoint, request, data } = options;
  const logContext = { endpoint, creationMode, eventId };
  let metric: GenerationMetricRow;

  try {
    metric = deriveGenerationMetric(request, data, creationMode, eventId);
  } catch (error) {
    logger.serverMetric("metrics_record_failure", {
      ...logContext,
      errorCode: getSanitizedErrorCode(error),
    });
    return false;
  }

  let errorCode = "METRICS_RECORD_ERROR";

  for (let attempt = 0; attempt < MAX_RECORD_ATTEMPTS; attempt += 1) {
    try {
      const client = getMetricsSupabaseClient();
      const { error } = await client.from(METRICS_TABLE).upsert(metric, {
        onConflict: "event_id",
        ignoreDuplicates: true,
      });

      if (!error) {
        logger.serverMetric("metrics_record_success", logContext);
        return true;
      }

      errorCode = getSanitizedErrorCode(error);
    } catch (error) {
      errorCode = getSanitizedErrorCode(error);
    }
  }

  logger.serverMetric("metrics_record_failure", {
    ...logContext,
    errorCode,
  });
  return false;
}
