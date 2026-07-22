"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

interface AdminMetricsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminMetricsError({
  error,
  reset,
}: AdminMetricsErrorProps) {
  const { t } = useTranslation();
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.error("관리자 메트릭 화면을 불러오지 못했습니다.", error.digest);
    alertRef.current?.focus();
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Alert
        ref={alertRef}
        tabIndex={-1}
        variant="destructive"
        className="max-w-lg"
        aria-live="assertive"
      >
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>{t("admin.metrics.state.error")}</AlertTitle>
        <AlertDescription className="mt-3">
          <Button type="button" variant="outline" onClick={reset}>
            {t("admin.metrics.state.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    </main>
  );
}
