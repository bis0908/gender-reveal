"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/context";

export interface MetricsChartDatum {
  key: string;
  label: string;
  count: number;
}

interface MetricsChartCardProps {
  title: string;
  description: string;
  data: MetricsChartDatum[];
  kind?: "bar" | "line";
}

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--popover))",
  borderColor: "hsl(var(--border))",
  borderRadius: "var(--radius)",
  color: "hsl(var(--popover-foreground))",
};

function getChartHeight(dataLength: number, kind: "bar" | "line"): number {
  if (kind === "line") {
    return 288;
  }

  return Math.min(480, Math.max(264, dataLength * 42));
}

export function MetricsChartCard({
  title,
  description,
  data,
  kind = "bar",
}: MetricsChartCardProps) {
  const { t, language } = useTranslation();
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const locale = { ko: "ko-KR", en: "en-US", jp: "ja-JP" }[language];
  const formatter = new Intl.NumberFormat(locale);

  if (data.length === 0) {
    return (
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t("admin.metrics.common.noData")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0">
        <div
          className="w-full min-w-0"
          style={{ height: getChartHeight(data.length, kind) }}
          role="img"
          aria-label={`${title}: ${description}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            {kind === "line" ? (
              <LineChart
                data={data}
                margin={{ top: 12, right: 16, bottom: 20, left: 0 }}
                accessibilityLayer
              >
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                  angle={-20}
                  height={48}
                  textAnchor="end"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [
                    formatter.format(Number(value)),
                    title,
                  ]}
                />
                <Legend verticalAlign="top" height={28} />
                <Line
                  dataKey="count"
                  name={title}
                  type="monotone"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "hsl(var(--background))", strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 42, bottom: 8, left: 8 }}
                accessibilityLayer
              >
                <CartesianGrid strokeDasharray="4 4" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={92}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [
                    formatter.format(Number(value)),
                    title,
                  ]}
                />
                <Legend verticalAlign="top" height={28} />
                <Bar
                  dataKey="count"
                  name={title}
                  fill="hsl(var(--chart-2))"
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                    dataKey="count"
                    position="right"
                    className="fill-foreground"
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <ul
          className="mt-4 grid gap-x-4 gap-y-2 border-t pt-4 text-xs sm:grid-cols-2"
          aria-label={`${title} ${t("admin.metrics.common.count")}`}
        >
          {data.map((item) => {
            const percent = total > 0 ? (item.count / total) * 100 : 0;

            return (
              <li
                key={item.key}
                className="flex min-w-0 items-center justify-between gap-3"
              >
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.label}
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatter.format(item.count)}{" "}
                  {t("admin.metrics.common.count")}
                  {kind === "bar"
                    ? ` · ${percent.toFixed(1)}% ${t("admin.metrics.common.percent")}`
                    : null}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
