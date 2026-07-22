"use client";

import { Loader2, LockKeyhole } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LanguageSelector } from "@/components/language-selector";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { loginAdminAction } from "./actions";
import { type AdminLoginState, initialAdminLoginState } from "./login-state";

const LOGIN_ERROR_TRANSLATIONS: Record<string, string> = {
  invalid_credentials: "admin.login.invalidCredentials",
  forbidden: "admin.login.forbidden",
  generic: "admin.login.genericError",
};

function getLoginErrorTranslation(error: string | null): string | null {
  if (!error) {
    return null;
  }

  return LOGIN_ERROR_TRANSLATIONS[error] ?? "admin.login.genericError";
}

export function AdminLoginForm() {
  const { t } = useTranslation();
  const [state, setState] = useState<AdminLoginState>(initialAdminLoginState);
  const [isPending, setIsPending] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const errorKey = getLoginErrorTranslation(state.error);

  useEffect(() => {
    if (errorKey) {
      errorRef.current?.focus();
    }
  }, [errorKey]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) {
      return;
    }

    setIsPending(true);
    setState(initialAdminLoginState);

    try {
      const nextState = await loginAdminAction(
        state,
        new FormData(event.currentTarget),
      );
      setState(nextState);
    } catch {
      setState({ error: "generic" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-end">
          <LanguageSelector />
        </div>
        <Card>
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl">{t("admin.login.title")}</CardTitle>
            <CardDescription>{t("admin.login.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-5"
              onSubmit={handleSubmit}
              aria-busy={isPending}
              noValidate
            >
              {errorKey ? (
                <Alert
                  id="admin-login-error"
                  ref={errorRef}
                  tabIndex={-1}
                  variant="destructive"
                  aria-live="assertive"
                >
                  <AlertDescription>{t(errorKey)}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="admin-email">{t("admin.login.email")}</Label>
                <Input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  disabled={isPending}
                  aria-invalid={Boolean(errorKey)}
                  aria-describedby={errorKey ? "admin-login-error" : undefined}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">
                  {t("admin.login.password")}
                </Label>
                <Input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={isPending}
                  aria-invalid={Boolean(errorKey)}
                  aria-describedby={errorKey ? "admin-login-error" : undefined}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                    {t("admin.login.submitting")}
                  </>
                ) : (
                  t("admin.login.submit")
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
