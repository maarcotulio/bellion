import { KeyRound, ShieldCheck } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { loginWithSharedPassword } from "@/lib/auth/actions";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { sessionCookieName, verifySessionToken } from "@/lib/auth/session";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  readonly searchParams?: Promise<{
    readonly error?: string;
    readonly next?: string | string[];
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const next = safeRedirectPath(params.next);
  const hasInvalidPassword = params.error === "invalid";
  const cookieStore = await cookies();
  const isAuthenticated = await verifySessionToken(cookieStore.get(sessionCookieName)?.value);

  if (isAuthenticated) {
    redirect(next);
  }

  return (
    <main className="min-h-screen arcane-page text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-md items-center px-6 py-16 sm:px-8">
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary shadow-[0_0_24px_rgba(62,208,255,0.18)]">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Royal Bellion Gate</CardTitle>
                <CardDescription>Enter the shared table password.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form action={loginWithSharedPassword} className="grid gap-5">
              <input type="hidden" name="next" value={next} />
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                />
              </div>
              {hasInvalidPassword ? (
                <Alert variant="destructive">
                  <AlertTitle>Access denied</AlertTitle>
                  <AlertDescription>Shared password is invalid.</AlertDescription>
                </Alert>
              ) : null}
              <Button type="submit" className="w-full">
                <KeyRound aria-hidden="true" />
                Enter
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
