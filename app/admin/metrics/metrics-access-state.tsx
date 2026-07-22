"use client";

import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { LanguageSelector } from "@/components/language-selector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export function MetricsForbiddenState() {
  const { t } = useTranslation();
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    alertRef.current?.focus();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex justify-end">
          <LanguageSelector />
        </div>
        <Alert
          ref={alertRef}
          tabIndex={-1}
          variant="destructive"
          aria-live="assertive"
        >
          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>{t("admin.metrics.state.forbidden")}</AlertTitle>
          <AlertDescription className="mt-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/login">{t("admin.login.submit")}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </main>
  );
}
