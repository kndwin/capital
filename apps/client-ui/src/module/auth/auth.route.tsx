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
    <div className="flex min-h-svh w-full items-center justify-center overflow-hidden bg-background p-6">
      <div className="flex w-full max-w-4xl flex-col items-center justify-center gap-6 md:flex-row md:gap-10">
        <ParticleField
          src={capitalParticleLogoSrc}
          className="size-48 shrink-0 opacity-40 sm:size-56 md:size-80"
          threshold={54}
          sampleStep={2.15}
          dotSize={0.62}
          renderScale={0.82}
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
          errorTitle={authError ? "Sign in failed" : undefined}
          onGoogleSignIn={async () => {
            const exit = await signIn({
              payload: {
                providerId: "google",
                callbackURL: "/",
                errorCallbackURL: "/login",
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
    return "Google sign-in could not be completed. Please try again.";
  }
  return error ? "Google sign-in could not be completed. Please try again." : null;
}
