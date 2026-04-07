import type { Route } from "next";
import { redirect } from "next/navigation";

import { RoutePage, routePageStyles as shell } from "@/components/shell/route-page";
import { ButtonLink } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { AuthForm } from "@/components/auth/auth-form";
import { readSupabasePublicEnvironment } from "@/config/env";
import { submitAuthAction } from "@/lib/auth/actions";
import { getCurrentViewer } from "@/lib/auth/server";
import { buildAuthHref, resolvePostAuthPath, type AuthMode } from "@/lib/auth/navigation";

import styles from "./page.module.css";

function resolveMode(value: string | string[] | undefined): AuthMode {
  const singleValue = Array.isArray(value) ? value[0] : value;

  return singleValue === "signup" ? "signup" : "signin";
}

function resolveStatusMessage(value: string | string[] | undefined) {
  const singleValue = Array.isArray(value) ? value[0] : value;

  if (singleValue === "check-email") {
    return "Account created. Check your email to confirm access, then sign in to continue.";
  }

  if (singleValue === "signed-out") {
    return "You have been signed out.";
  }

  return null;
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const viewer = await getCurrentViewer();
  const nextPath = resolvePostAuthPath(
    Array.isArray(params.next) ? params.next[0] : params.next,
    "/account",
  );

  if (viewer.status === "authenticated") {
    redirect(nextPath as Route);
  }

  const mode = resolveMode(params.mode);
  const statusMessage = resolveStatusMessage(params.status);
  const envReady = Boolean(readSupabasePublicEnvironment());

  return (
    <RoutePage
      actions={<ButtonLink href="/">Continue as Guest</ButtonLink>}
      badges={[
        { label: "Public Discovery Stays Open", tone: "green" },
        {
          label: envReady ? "Supabase Auth Ready" : "Setup Required",
          tone: envReady ? "blue" : "gold",
        },
        {
          label: mode === "signup" ? "Create Account" : "Sign In",
          tone: mode === "signup" ? "gold" : "teal",
        },
      ]}
      description="Create or access a NASQ account to enter protected member and admin workflows. Public discovery remains available without signing in, while challenge submission and solution publishing stay gated behind verified company membership."
      eyebrow="Member Access"
      title={mode === "signup" ? "Create Your Account" : "Sign In to Continue"}
    >
      <div className={styles.grid}>
        <Surface>
          {envReady ? (
            <AuthForm
              key={`${mode}:${nextPath}`}
              action={submitAuthAction}
              initialMode={mode}
              nextPath={nextPath}
              statusMessage={statusMessage}
            />
          ) : (
            <div className={shell.stack}>
              <h2 className={styles.sectionTitle}>Auth setup required</h2>
              <p className={styles.copy}>
                Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
                before enabling sign in and account creation.
              </p>
            </div>
          )}
        </Surface>

        <div className={styles.stack}>
          <Surface>
            <h2 className={styles.sectionTitle}>What signing in unlocks</h2>
            <ul className={shell.list}>
              <li className={shell.listItem}>
                <div>
                  <div className={shell.listPrimary}>Protected member workspace</div>
                  <div className={shell.listSecondary}>
                    Account, drafts, relay, and owned record management all live behind account access.
                  </div>
                </div>
              </li>
              <li className={shell.listItem}>
                <div>
                  <div className={shell.listPrimary}>Verified contribution flows</div>
                  <div className={shell.listSecondary}>
                    Signing in alone is not enough to publish. Verified company membership still governs submission and solution publishing.
                  </div>
                </div>
              </li>
              <li className={shell.listItem}>
                <div>
                  <div className={shell.listPrimary}>AI continuity</div>
                  <div className={shell.listSecondary}>
                    Signed-in sessions keep AI conversations and support AI-to-draft handoff when membership is verified.
                  </div>
                </div>
              </li>
            </ul>
          </Surface>

          <Surface>
            <h2 className={styles.sectionTitle}>Next destination</h2>
            <p className={styles.copy}>
              After auth, this flow will return you to <strong>{nextPath}</strong>.
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
              <ButtonLink href={buildAuthHref(nextPath, "signin") as Route} variant="outline">
                Sign In Instead
              </ButtonLink>
              <ButtonLink href={buildAuthHref(nextPath, "signup") as Route}>
                Create Account
              </ButtonLink>
            </div>
          </Surface>
        </div>
      </div>
    </RoutePage>
  );
}
