import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Option, Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { HttpClient } from "@capital/client-api/http-atom";
import { capitalParticleLogoSrc, LoginForm } from "@/module/auth/ui/login-form.ui";
import { ParticleField } from "@/module/auth/ui/particle-field.ui";
import { useAtomSet, useAtomValue } from "@effect/atom-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search): { error?: string; reason?: string } => ({
    error: typeof search.error === "string" ? search.error : undefined,
    reason: typeof search.reason === "string" ? search.reason : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const signInAtom = HttpClient.mutation("auth", "signInOAuth2");
  const signIn = useAtomSet(signInAtom, { mode: "promiseExit" });
  const result = useAtomValue(signInAtom);
  const authError = getAuthErrorMessage(search.error, search.reason);
  const particleImpulseRef = useRef(0);

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-background p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--foreground)/.1),transparent_32%),radial-gradient(circle_at_78%_72%,hsl(var(--foreground)/.07),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,hsl(var(--background)/.28)_62%,hsl(var(--background))_100%)]" />
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center justify-center gap-8 md:flex-row md:gap-14">
        <ParticleField
          src={capitalParticleLogoSrc}
          className="size-[min(78vw,20rem)] shrink-0 opacity-40 md:size-[28rem]"
          threshold={54}
          sampleStep={2.15}
          dotSize={0.62}
          renderScale={0.86}
          mouseForce={54}
          mouseRadius={150}
          denseParticles
          adaptToTheme={false}
          color="rgba(255, 255, 255, 0.42)"
          typingImpulseRef={particleImpulseRef}
        />
        <LoginForm
          className="shrink-0"
          particleImpulseRef={particleImpulseRef}
          isSubmitting={AsyncResult.isWaiting(result) || AsyncResult.isSuccess(result)}
          error={
            AsyncResult.isFailure(result)
              ? Option.match(AsyncResult.error(result), {
                  onNone: () => "Sign in failed",
                  onSome: (e) => (e instanceof Error ? e.message : String(e)),
                })
              : authError
          }
          errorTitle={authError ? "Company account required" : undefined}
          onGoogleSignIn={async () => {
            const exit = await signIn({
              payload: {
                providerId: "google",
                callbackURL: "/",
                errorCallbackURL: "/login?reason=domain",
              },
            });
            if (Exit.isSuccess(exit) && exit.value.url) {
              window.open(exit.value.url, "_blank");
            }
          }}
        />
      </div>
    </div>
  );
}

function getAuthErrorMessage(error?: string, reason?: string) {
  if (
    reason === "domain" ||
    error === "unable_to_create_user" ||
    error === "unable_to_create_session"
  ) {
    return "Capital is limited to capital accounts. Sign in with your @capital.kndwin.dev Google account.";
  }
  return error ? "Google sign-in could not be completed. Please try again." : null;
}
