"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/context";

interface MetricsDateFilterProps {
  fromDate: string;
  throughDate: string;
  disabled: boolean;
  validationError: string | null;
  onFromDateChange: (value: string) => void;
  onThroughDateChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function MetricsDateFilter({
  fromDate,
  throughDate,
  disabled,
  validationError,
  onFromDateChange,
  onThroughDateChange,
  onSubmit,
}: MetricsDateFilterProps) {
  const { t } = useTranslation();
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (validationError) {
      errorRef.current?.focus();
    }
  }, [validationError]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {t("admin.metrics.filter.period")}
        </CardTitle>
        <CardDescription>
          {t("admin.metrics.filter.recent30Days")} ·{" "}
          {t("admin.metrics.filter.kst")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
          onSubmit={onSubmit}
          noValidate
        >
          <div className="min-w-0 space-y-2">
            <Label htmlFor="metrics-from">
              {t("admin.metrics.filter.from")}
            </Label>
            <Input
              id="metrics-from"
              name="from"
              type="date"
              value={fromDate}
              onChange={(event) => onFromDateChange(event.target.value)}
              disabled={disabled}
              aria-invalid={Boolean(validationError)}
              aria-describedby="metrics-filter-help metrics-filter-error"
              required
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="metrics-through">
              {t("admin.metrics.filter.to")}
            </Label>
            <Input
              id="metrics-through"
              name="through"
              type="date"
              value={throughDate}
              onChange={(event) => onThroughDateChange(event.target.value)}
              disabled={disabled}
              aria-invalid={Boolean(validationError)}
              aria-describedby="metrics-filter-help metrics-filter-error"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={disabled}
            className="w-full md:w-auto"
          >
            {disabled
              ? t("admin.metrics.filter.applying")
              : t("admin.metrics.filter.apply")}
          </Button>
          <p
            id="metrics-filter-help"
            className="text-xs text-muted-foreground md:col-span-3"
          >
            {t("admin.metrics.filter.rangeTooLong")}
          </p>
          <div
            id="metrics-filter-error"
            ref={errorRef}
            tabIndex={-1}
            className="text-sm font-medium text-destructive md:col-span-3"
            role={validationError ? "alert" : undefined}
          >
            {validationError}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
