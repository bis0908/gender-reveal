"use client";

import {
  AlertCircle,
  CalendarDays,
  Loader2,
  LockKeyhole,
  LogOut,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { LanguageSelector } from "@/components/language-selector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/context";
import {
  type MetricsSummary,
  metricsSummarySchema,
} from "@/lib/schemas/metrics-summary-schema";
import { logoutAdminAction } from "./actions";
import { MetricsChartCard, type MetricsChartDatum } from "./metrics-chart-card";
import { MetricsDashboardSkeleton } from "./metrics-dashboard-skeleton";
import {
  getKstDateInputValue,
  getThroughDateInputValue,
  isLongerThan24Months,
  type MetricsDateRange,
  toKstApiRange,
} from "./metrics-date";
import { MetricsDateFilter } from "./metrics-date-filter";

type RequestStatus =
  | "ready"
  | "loading"
  | "error"
  | "unauthorized"
  | "forbidden";

interface MetricsDashboardProps {
  initialSummary: MetricsSummary;
}

function isEmptySummary(summary: MetricsSummary): boolean {
  return summary.total === 0;
}

export function MetricsDashboard({ initialSummary }: MetricsDashboardProps) {
  const { t, language } = useTranslation();
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState(initialSummary);
  const [fromDate, setFromDate] = useState(() =>
    getKstDateInputValue(initialSummary.period.from),
  );
  const [throughDate, setThroughDate] = useState(() =>
    getThroughDateInputValue(initialSummary.period.to),
  );
  const [status, setStatus] = useState<RequestStatus>("ready");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastRange, setLastRange] = useState<MetricsDateRange>(() => ({
    from: initialSummary.period.from,
    to: initialSummary.period.to,
  }));
  const requestStatusRef = useRef<HTMLDivElement>(null);
  const locale = { ko: "ko-KR", en: "en-US", jp: "ja-JP" }[language];
  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale),
    [locale],
  );

  useEffect(() => {
    if (["error", "unauthorized", "forbidden"].includes(status)) {
      requestStatusRef.current?.focus();
    }
  }, [status]);

  const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) => {
    const normalized = /^\d{4}-\d{2}$/.test(value)
      ? `${value}-01T00:00:00+09:00`
      : /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? `${value}T00:00:00+09:00`
        : value;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(locale, {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: options?.day ?? "2-digit",
      ...options,
    }).format(parsed);
  };

  const loadMetrics = async (range: MetricsDateRange) => {
    setStatus("loading");
    setValidationError(null);

    try {
      const query = new URLSearchParams({ from: range.from, to: range.to });
      const response = await fetch(`/api/admin/metrics?${query.toString()}`, {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });

      if (response.status === 401) {
        setStatus("unauthorized");
        return;
      }

      if (response.status === 403) {
        setStatus("forbidden");
        return;
      }

      if (!response.ok) {
        setStatus("error");
        return;
      }

      const parsed = metricsSummarySchema.safeParse(await response.json());
      if (!parsed.success) {
        setStatus("error");
        return;
      }

      setSummary(parsed.data);
      setFromDate(getKstDateInputValue(parsed.data.period.from));
      setThroughDate(getThroughDateInputValue(parsed.data.period.to));
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  };

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAdminAction();
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const range = toKstApiRange(fromDate, throughDate);

    if (!range) {
      setValidationError(t("admin.metrics.filter.invalid"));
      return;
    }

    if (isLongerThan24Months(fromDate, throughDate)) {
      setValidationError(t("admin.metrics.filter.rangeTooLong"));
      return;
    }

    setLastRange(range);
    void loadMetrics(range);
  };

  const mapKeyedData = (
    data: Array<{ key: string | number; count: number }>,
    getLabel: (key: string) => string,
  ): MetricsChartDatum[] =>
    data.map((item) => ({
      key: String(item.key),
      label: getLabel(String(item.key)),
      count: item.count,
    }));

  const getCountryLabel = (key: string) => {
    if (key === "other") {
      return t("admin.metrics.labels.country.other");
    }
    if (key === "unknown") {
      return t("admin.metrics.labels.country.unknown");
    }

    try {
      return (
        new Intl.DisplayNames([language === "jp" ? "ja" : language], {
          type: "region",
        }).of(key.toUpperCase()) ?? key
      );
    } catch {
      return key;
    }
  };

  const charts = {
    daily: summary.daily.map((item) => ({
      key: item.date,
      label: formatDate(item.date, { year: undefined, month: "short" }),
      count: item.count,
    })),
    creationMode: mapKeyedData(summary.byCreationMode, (key) =>
      t(`admin.metrics.labels.creationMode.${key}`),
    ),
    country: mapKeyedData(summary.byCountry, getCountryLabel),
    babyCount: mapKeyedData(summary.byBabyCount, (key) =>
      t("admin.metrics.labels.babyCount", { count: key }),
    ),
    animation: mapKeyedData(summary.byAnimation, (key) =>
      t(`admin.metrics.labels.animation.${key}`),
    ),
    device: mapKeyedData(summary.byDevice, (key) =>
      t(`admin.metrics.labels.device.${key}`),
    ),
    dueMonth: summary.byDueMonth.map((item) => ({
      key: item.month,
      label: formatDate(item.month, { day: undefined, month: "short" }),
      count: item.count,
    })),
  };

  const renderRequestStatus = () => {
    if (status === "ready") {
      if (!isEmptySummary(summary)) {
        return null;
      }

      return (
        <Alert
          ref={requestStatusRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{t("admin.metrics.state.empty")}</AlertTitle>
          <AlertDescription>
            {t("admin.metrics.common.noData")}
          </AlertDescription>
        </Alert>
      );
    }

    if (status === "loading") {
      return null;
    }

    const messageKey =
      status === "unauthorized"
        ? "admin.metrics.state.unauthorized"
        : status === "forbidden"
          ? "admin.metrics.state.forbidden"
          : "admin.metrics.state.error";

    return (
      <Alert
        ref={requestStatusRef}
        tabIndex={-1}
        variant="destructive"
        aria-live="assertive"
      >
        {status === "error" ? (
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
        ) : (
          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
        )}
        <AlertTitle>{t(messageKey)}</AlertTitle>
        <AlertDescription className="mt-3 flex flex-wrap gap-2">
          {status === "error" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadMetrics(lastRange)}
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("admin.metrics.state.retry")}
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/login">{t("admin.login.submit")}</Link>
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium text-primary">
              {t("admin.metrics.filter.kst")}
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("admin.metrics.title")}
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
              {t("admin.metrics.description")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={handleLogout}
              className="flex items-center gap-2 h-8 px-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <LogOut className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="text-sm font-medium">
                {t("admin.metrics.signOut")}
              </span>
            </Button>
          </div>
        </header>

        <MetricsDateFilter
          fromDate={fromDate}
          throughDate={throughDate}
          disabled={status === "loading"}
          validationError={validationError}
          onFromDateChange={setFromDate}
          onThroughDateChange={setThroughDate}
          onSubmit={handleSubmit}
        />

        {renderRequestStatus()}

        <section aria-busy={status === "loading"} aria-live="polite">
          {status === "loading" ? (
            <>
              <span className="sr-only">
                {t("admin.metrics.state.loading")}
              </span>
              <MetricsDashboardSkeleton />
            </>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("admin.metrics.total.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("admin.metrics.total.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="break-all text-4xl font-bold tabular-nums sm:text-5xl">
                    {numberFormatter.format(summary.total)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {formatDate(summary.period.from)} –{" "}
                    {formatDate(getThroughDateInputValue(summary.period.to))}
                  </p>
                </CardContent>
              </Card>

              <MetricsChartCard
                title={t("admin.metrics.charts.daily.title")}
                description={t("admin.metrics.charts.daily.description")}
                data={charts.daily}
                kind="line"
              />

              <div className="grid min-w-0 gap-6 lg:grid-cols-2">
                <MetricsChartCard
                  title={t("admin.metrics.charts.creationMode.title")}
                  description={t(
                    "admin.metrics.charts.creationMode.description",
                  )}
                  data={charts.creationMode}
                />
                <MetricsChartCard
                  title={t("admin.metrics.charts.country.title")}
                  description={t("admin.metrics.charts.country.description")}
                  data={charts.country}
                />
                <MetricsChartCard
                  title={t("admin.metrics.charts.babyCount.title")}
                  description={t("admin.metrics.charts.babyCount.description")}
                  data={charts.babyCount}
                />
                <MetricsChartCard
                  title={t("admin.metrics.charts.animation.title")}
                  description={t("admin.metrics.charts.animation.description")}
                  data={charts.animation}
                />
                <MetricsChartCard
                  title={t("admin.metrics.charts.device.title")}
                  description={t("admin.metrics.charts.device.description")}
                  data={charts.device}
                />
                <MetricsChartCard
                  title={t("admin.metrics.charts.dueMonth.title")}
                  description={t("admin.metrics.charts.dueMonth.description")}
                  data={charts.dueMonth}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
